# Backlog

This document contains features and improvements that are planned for future implementation.

---

## Operational Notes & Reminders

### Enable/Disable Automatic Booking Schedule

**To disable automatic booking (e.g., for testing):**
- Comment out the `schedule` section in `.github/workflows/booking-automation.yml`
- Commit and push the change
- The workflow will stop running automatically but can still be triggered manually

**To re-enable automatic booking:**
- Uncomment the `schedule` section in `.github/workflows/booking-automation.yml`
- Commit and push the change
- The workflow will resume running every 15 minutes automatically

**Current Status:** Schedule is enabled (runs every 15 minutes automatically)

---

## Event-Driven Trigger Architecture (Future Optimization)

### Overview
Replace the 15-minute polling approach with an event-driven trigger system that only runs GitHub Actions when a booking window actually opens. This reduces GitHub Actions usage from ~250 minutes/month to ~48-144 minutes/month (80% cost reduction).

### Current Approach
- **Method**: GitHub Actions cron runs every 15 minutes (`*/15 * * * *`)
- **Usage**: ~250 minutes/month (12.5% of 2,000 min free tier)
- **Runs**: 2,880 runs/month (most runs exit early if no bookings needed)
- **Status**: ✅ Working, meets all KPIs (<60s booking latency with parallel processing)

### Optimization Option A: Supabase pg_cron

**Architecture:**
```
Supabase pg_cron (scheduled at exact booking window times)
  → Triggers GitHub Actions via webhook (repository_dispatch)
  → GitHub Actions runs Puppeteer (parallel processing)
```

**Benefits:**
- ✅ Free tier compatible (pg_cron available on Supabase free tier)
- ✅ Exact timing (fires at booking window open time)
- ✅ Minimal GitHub Actions usage (24 runs/month = 48-144 min)
- ✅ Only runs when needed (no wasted runs)

**Drawbacks:**
- ⚠️ Complex implementation (8-10 hours)
- ⚠️ Need to manage pg_cron jobs (create/delete on class changes)
- ⚠️ Need to clean up `cron.job_run_details` table regularly (grows large)
- ⚠️ More failure points (DB cron → webhook → GitHub)
- ⚠️ Requires GitHub Personal Access Token with workflow scope

**Implementation Requirements:**
1. Create Supabase migration with pg_cron functions:
   - `calculate_next_booking_window(class_id)`
   - `schedule_booking_trigger(class_id)`
   - `unschedule_booking_trigger(class_id)`
   - `trigger_github_actions_webhook()`
2. Update class CRUD operations to schedule/unschedule triggers
3. Add GitHub Actions `repository_dispatch` trigger
4. Set up GitHub PAT and store in Supabase secrets
5. Implement table cleanup for `cron.job_run_details`

### Optimization Option B: Vercel Cron

**Architecture:**
```
Vercel cron (scheduled in vercel.json)
  → Next.js API route (/api/cron/booking)
  → Triggers GitHub Actions via webhook (repository_dispatch)
  → GitHub Actions runs Puppeteer (parallel processing)
```

**Benefits:**
- ✅ Free tier compatible (Vercel Hobby plan)
- ✅ Exact timing
- ✅ Minimal GitHub Actions usage (24 runs/month = 48-144 min)
- ✅ Simpler than pg_cron (no database functions needed)
- ✅ Better debugging (Vercel dashboard shows cron logs)
- ✅ No table cleanup needed

**Drawbacks:**
- ⚠️ Static cron jobs in vercel.json (need redeploy when booking times change)
- ⚠️ Requires Next.js API route
- ⚠️ Requires GitHub Personal Access Token with workflow scope
- ⚠️ Medium complexity (4-6 hours implementation)

**Implementation Requirements:**
1. Add cron schedule to `vercel.json`:
   ```json
   {
     "crons": [
       {"path": "/api/cron/booking", "schedule": "15 14 * * 1"},  // Mon 2:15 PM
       {"path": "/api/cron/booking", "schedule": "15 14 * * 3"},  // Wed 2:15 PM
       {"path": "/api/cron/booking", "schedule": "30 9 * * 6"}    // Sat 9:30 AM
     ]
   }
   ```
2. Create Next.js API route: `app/api/cron/booking/route.ts`
3. Add GitHub Actions `repository_dispatch` trigger
4. Set up GitHub PAT and store as Vercel environment variable
5. (Optional) Daily sync job to update cron schedule based on active classes

### When to Implement

**DO NOT implement unless:**
- GitHub Actions usage approaches 1,500+ minutes/month (75% of free tier)
- Need to scale to 10+ users
- Want to minimize infrastructure costs
- Have 4-10 hours available for optimization work

**Current situation:**
- Usage: ~250 min/month (12.5% of free tier)
- Room to scale to 5-6 users before approaching limits
- All KPIs are being met (<60s booking latency)
- System is stable and working

### Recommendation

**For MVP (current state):**
- ✅ Stick with 15-minute polling + parallel processing
- ✅ Monitor GitHub Actions usage for 2-4 weeks
- ✅ Only optimize if usage becomes a concern

**If optimization needed:**
- 🥇 **Recommended**: Vercel Cron (Option B) - simpler, easier to debug
- 🥈 **Alternative**: Supabase pg_cron (Option A) - if you prefer database-centric approach

### Cost Analysis

| Approach | GitHub Actions Usage | % of Free Tier | Runs/Month | Implementation Time |
|----------|---------------------|----------------|------------|---------------------|
| **Current (15-min polling)** | 250 min | 12.5% | 2,880 | 0 hours (done) |
| **Vercel Cron** | 48-144 min | 2.4-7.2% | 24 | 4-6 hours |
| **Supabase pg_cron** | 48-144 min | 2.4-7.2% | 24 | 8-10 hours |

### Status
**Status**: Backlogged - Not currently needed
**Priority**: Low (optimization only, current approach works well)
**Last Updated**: 2025-01-11
**Next Step**: Monitor GitHub Actions usage for 2-4 weeks before reconsidering

---

## Retry Logic for Full Classes

### Overview
When a class shows "Class Full" but still has a booking button available, implement retry logic that continuously attempts to book the class until the class start time. This handles cases where spots open up due to cancellations.

### Requirements

1. **Immediate Booking Attempt**
   - When a class shows "Class Full" but has a RESERVE button, attempt to book immediately
   - The button might work and add user to waitlist

2. **Retry Loop**
   - If immediate attempt doesn't succeed, retry every 3 minutes until class start time
   - Calculate class start datetime from `dayOfWeek` and `classTime`
   - Stop retrying when class starts

3. **Page Refresh and Re-navigation**
   - On each retry:
     - Refresh the page to get updated class status
     - Re-select the branch
     - Re-navigate to the correct day
     - Re-search for the class

4. **Status Detection**
   - If class becomes available → book immediately
   - If still full but has booking button → continue retrying
   - If booking button disappears → stop retrying (truly full)

### Implementation Notes

- **Retry Interval**: 3 minutes
- **Maximum Retries**: 100 (safety limit)
- **Stop Conditions**: 
  - Class starts
  - Booking button disappears
  - Booking succeeds
  - Maximum retries reached

### Helper Functions Needed

1. `calculateClassStartTime(dayOfWeek: number, hours: number, minutes: number): Date`
   - Calculates the class start datetime from day of week and time
   - Handles same-day vs next-week logic

2. `attemptBookingButtonClick(page: Page, classType: string, targetTime12: string): Promise<{ success: boolean; error?: string }>`
   - Already exists in codebase
   - Reusable function to click booking buttons

### Code Location
- Main logic should be added in `scripts/booking-automation.ts` in the `findAndBookClass()` function
- Should be triggered when `searchResult.status === 'full'` but class has a booking button

### Testing Considerations
- Test with classes that are full but have waitlist options
- Test retry behavior when class becomes available during retry loop
- Test that retries stop when class starts
- Test that retries stop if booking button disappears

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium
**Last Updated**: 2025-01-10

---

## Multi-Branch Fallback Logic

### Overview
When a class is not available at the primary branch, automatically attempt to book the same class at alternative branches. This handles cases where a user's preferred branch is full but other branches have availability.

### Requirements

1. **Branch Priority System**
   - Allow users to specify primary and fallback branches for each class
   - Store branch preferences in `recurring_classes` table (add `fallback_branches` JSON column)

2. **Automatic Fallback**
   - If primary branch booking fails (class full, not found), try fallback branches in order
   - Only attempt fallback if class is available at fallback branch
   - Stop on first successful booking

3. **Database Updates**
   - Track which branch was used for each booking attempt
   - Store branch preference in class configuration

### Implementation Notes

- **Database Schema**: Add `fallback_branches TEXT[]` to `recurring_classes` table
- **Booking Logic**: Modify `findAndBookClass()` to accept branch list and iterate through branches
- **Status Tracking**: Update `booking_attempts.branch_used` to show which branch succeeded

### Code Location
- Database migration: `supabase/migrations/`
- Booking logic: `scripts/booking-automation.ts` in `bookClass()` function
- UI: `components/RecurringClassForm.tsx` - Add branch selection dropdown with multiple options

### Testing Considerations
- Test with classes available at multiple branches
- Test when primary branch is full but fallback has availability
- Test when all branches are full
- Verify branch_used is correctly recorded

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium
**Last Updated**: 2025-01-10

---

## Manual "Book Now" Button

### Overview
Add a manual trigger button in the UI that allows users to immediately attempt to book a class, bypassing the scheduled automation. Useful for testing, retrying failed bookings, or booking classes outside the normal schedule.

### Requirements

1. **UI Button**
   - Add "Book Now" button to each class in the schedule list
   - Show button only for active classes
   - Disable button while booking is in progress

2. **Backend API Endpoint**
   - Create API route: `/api/book-class/[classId]`
   - Accepts class ID and triggers booking automation
   - Returns booking status (success/failure)

3. **Real-time Status Updates**
   - Show loading state while booking is in progress
   - Update UI with booking result (success/failure message)
   - Refresh booking attempt history after completion

### Implementation Notes

- **API Route**: `app/api/book-class/[classId]/route.ts`
- **UI Component**: Add button to `components/ScheduleList.tsx` or similar
- **Error Handling**: Show user-friendly error messages
- **Rate Limiting**: Prevent multiple simultaneous bookings for same class

### Code Location
- API: `app/api/book-class/[classId]/route.ts` (new file)
- UI: `components/ScheduleList.tsx` or `components/RecurringClassForm.tsx`
- Booking logic: Reuse `scripts/run-booking-automation.ts` or extract booking function

### Testing Considerations
- Test button click triggers booking
- Test loading states and error handling
- Test concurrent booking attempts
- Verify booking attempts are recorded in database

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium
**Last Updated**: 2025-01-10

---

## Class Cancellation Detection

### Overview
Detect when a gym cancels a class that the user has booked, and notify the user. This requires monitoring booked classes and checking if they're still available on the schedule.

### Requirements

1. **Cancellation Detection**
   - Periodically check booked classes against current schedule
   - If class no longer appears on schedule, mark as cancelled
   - Update booking status in database

2. **User Notification**
   - Send email notification when class is cancelled
   - Update UI to show cancelled status
   - Allow user to remove cancelled class from schedule

3. **Database Updates**
   - Add `cancelled` status to `booking_attempts.status` enum
   - Track cancellation detection timestamp

### Implementation Notes

- **Detection Method**: Compare booked classes against current schedule during automation runs
- **Frequency**: Check during each hourly automation run
- **Database**: Update `booking_attempts` table schema to include 'cancelled' status

### Code Location
- Detection logic: `scripts/booking-automation.ts` - Add cancellation check function
- Database migration: `supabase/migrations/` - Update status enum
- Notification: Reuse email notification system

### Testing Considerations
- Test detection when class is removed from schedule
- Test notification delivery
- Test UI updates for cancelled classes

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Low
**Last Updated**: 2025-01-10

---

## Gym Site Class Listing Scraper

### Overview
Automatically scrape the gym website to discover available classes and their schedules, eliminating the need for manual class entry. Users could then select from discovered classes instead of typing class names manually.

### Requirements

1. **Class Discovery**
   - Scrape class schedule page for all available classes
   - Extract class names, times, days, branches
   - Store discovered classes in database

2. **Class Selection UI**
   - Show dropdown/autocomplete of discovered classes
   - Filter by branch, day, time
   - Allow users to select from discovered classes

3. **Periodic Updates**
   - Run scraper periodically to update class list
   - Handle schedule changes (new classes, removed classes)

### Implementation Notes

- **Scraping**: Use Puppeteer to navigate schedule page and extract class data
- **Storage**: New table `discovered_classes` to store scraped class information
- **Matching**: Match user-entered classes to discovered classes for validation

### Code Location
- Scraper: `scripts/scrape-classes.ts` (new file)
- Database: New migration for `discovered_classes` table
- UI: Update `RecurringClassForm.tsx` to use autocomplete with discovered classes

### Testing Considerations
- Test scraping accuracy
- Test handling of schedule changes
- Test class matching logic
- Verify UI updates correctly

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Low
**Last Updated**: 2025-01-10

---

## Real-time Status Updates

### Overview
Implement real-time updates for booking status without requiring page refresh. Use WebSockets or polling to update the UI when booking attempts complete.

### Requirements

1. **Real-time Updates**
   - Update booking status in UI as soon as booking completes
   - Show live status for in-progress bookings
   - Refresh booking attempt history automatically

2. **Implementation Options**
   - Option 1: Supabase Realtime subscriptions (recommended)
   - Option 2: Polling with React Query
   - Option 3: Server-Sent Events (SSE)

### Implementation Notes

- **Recommended**: Use Supabase Realtime to subscribe to `booking_attempts` table changes
- **UI Updates**: Update React components when database changes detected
- **Performance**: Only subscribe to user's own booking attempts

### Code Location
- Realtime subscription: `app/dashboard/page.tsx` or similar
- UI components: Update schedule list components to use realtime data

### Testing Considerations
- Test real-time updates when booking completes
- Test multiple users updating simultaneously
- Verify performance with many booking attempts

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium
**Last Updated**: 2025-01-10

---

## Enhanced Booking History and Analytics

### Overview
Provide detailed analytics and history of booking attempts, including success rates, common failure reasons, and trends over time.

### Requirements

1. **Analytics Dashboard**
   - Show booking success rate by class, branch, day of week
   - Display common failure reasons
   - Show booking attempt trends over time

2. **Detailed History**
   - Filterable booking attempt history
   - Export booking history to CSV
   - Search and filter by date, class, status

3. **Visualizations**
   - Charts showing success rates over time
   - Bar charts for failure reasons
   - Calendar view of booking attempts

### Implementation Notes

- **Data Aggregation**: Use Supabase queries to aggregate booking attempt data
- **Charts**: Use a charting library like Recharts or Chart.js
- **Export**: Generate CSV from booking attempts data

### Code Location
- Analytics page: `app/analytics/page.tsx` (new file)
- Components: Create analytics components for charts and tables
- API: `app/api/analytics/route.ts` for aggregated data

### Testing Considerations
- Test with various booking attempt scenarios
- Test filtering and search functionality
- Test CSV export
- Verify chart accuracy

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Low
**Last Updated**: 2025-01-10

---

## SMS Notifications

### Overview
Add SMS notification support in addition to email notifications. Users can choose their preferred notification method (email, SMS, or both).

### Requirements

1. **SMS Integration**
   - Integrate with SMS service (Twilio, AWS SNS, etc.)
   - Store user phone numbers securely
   - Send SMS for booking confirmations and failures

2. **User Preferences**
   - Add notification preferences to user settings
   - Allow users to choose email, SMS, or both
   - Per-class notification preferences

3. **Database Updates**
   - Add `phone_number` to user settings (encrypted)
   - Add `notification_preferences` JSON field

### Implementation Notes

- **SMS Service**: Use Twilio (recommended) or AWS SNS
- **Cost**: SMS has per-message costs, consider rate limiting
- **Security**: Encrypt phone numbers like passwords

### Code Location
- SMS service: `lib/sms.ts` (new file)
- User settings: Update `user_settings` table schema
- Notification logic: Update `scripts/run-booking-automation.ts` to send SMS

### Testing Considerations
- Test SMS delivery
- Test notification preferences
- Test error handling for invalid phone numbers
- Verify cost implications

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Low
**Last Updated**: 2025-01-10

---

## Daxko API Integration (Replace Puppeteer)

### Overview
Daxko (YMCA's platform provider) has an official API for managing classes and bookings. This could replace Puppeteer browser automation with direct API calls, making the system faster, more reliable, and potentially enabling Vercel free tier usage.

**API Documentation**: [Daxko GroupEx Pro API](https://docs.partners.daxko.com/openapi/gxp/v1/)

### Requirements

1. **API Authentication**
   - Research Daxko API authentication requirements
   - Determine if API access is available for end users or requires partner status
   - Store API credentials securely (if needed)

2. **Replace Puppeteer with API Calls**
   - Map current Puppeteer flow to API endpoints:
     - Login → API authentication
     - Navigate to schedule → API class listing endpoint
     - Select branch → API branch filtering
     - Find class → API class search
     - Book class → API booking endpoint
   - Handle API responses and error codes

3. **Benefits Over Puppeteer**
   - **Faster**: API calls are <5 seconds vs 30-60 seconds for Puppeteer
   - **More reliable**: No browser rendering issues, no selector changes
   - **Vercel compatible**: Could work on Vercel free tier (10s timeout)
   - **Simpler**: No browser binary, no screenshots needed
   - **Better error handling**: Structured API responses vs HTML parsing

4. **Migration Strategy**
   - Research API availability and access requirements
   - Create proof-of-concept API integration
   - Test with real gym account
   - Gradually migrate from Puppeteer to API
   - Keep Puppeteer as fallback if API unavailable

### Implementation Notes

- **API Research**: First step is to understand:
  - Is API available for end users or only partners?
  - What authentication method is required?
  - What endpoints are available for booking?
  - Are there rate limits?
  - Is there a cost associated with API access?

- **Code Location**: 
  - New file: `scripts/daxko-api-client.ts` (API client)
  - Modify: `scripts/booking-automation.ts` to use API instead of Puppeteer
  - Or create: `scripts/booking-automation-api.ts` (new API-based version)

- **Fallback Strategy**: 
  - If API is unavailable or limited, keep Puppeteer as backup
  - Could use API for checking availability, Puppeteer for booking

### Testing Considerations

- Test API authentication flow
- Test class search and filtering
- Test booking endpoint
- Test error handling (rate limits, invalid credentials, etc.)
- Compare API response times vs Puppeteer
- Verify booking success rate with API

### Potential Architecture Impact

**If API is available and works:**
- ✅ Could use **Vercel free tier** (API calls are fast)
- ✅ Could check **every 1 minute** (no timeout concerns)
- ✅ Much simpler architecture
- ✅ More reliable than browser automation

**If API requires partner status or is limited:**
- ⚠️ May need to stick with Puppeteer
- ⚠️ Or use hybrid: API for checks, Puppeteer for booking

### Research Findings

**API Access:**
- API appears to be partner/enterprise focused
- Requires contacting Daxko sales or emailing [email protected] for access
- May not be available to end users directly
- Documentation: https://docs.partners.daxko.com/openapi/gxp/v1/

**Next Steps:**
1. Contact Daxko to inquire about API access for end users
2. Determine if API is available for individual gym members or only for gym partners
3. If available, research authentication method and booking endpoints
4. Create proof-of-concept if access is granted

### Status
**Status**: Backlogged - Research in progress
**Priority**: High (could fundamentally change architecture)
**Last Updated**: 2025-01-XX
**Next Step**: Contact Daxko to determine API access eligibility

---

## Multi-Gym Support with Gym-Specific Class Forms

### Overview
Support multiple gym systems (YMCA, Planet Fitness, Gold's Gym, etc.) with gym-specific class detail forms and booking flows.

### Requirements

1. **Gym Selection in UI**
   - User selects gym type when adding gym credentials
   - Different gyms may have different login flows
   - Gym-specific configuration options

2. **Gym-Specific Class Forms**
   - YMCA: Current form with branch dropdown, class type text input
   - Planet Fitness: Different fields based on their system
   - Gold's Gym: Their specific requirements
   - Each gym has tailored UI matching their class listing structure

3. **Branch Name Validation**
   - Dropdown populated from actual gym website (scraped or API)
   - Prevents typos and ensures exact match with gym's dropdown
   - Update branch list periodically
   - Reduces user errors significantly

4. **Gym-Specific Booking Scripts**
   - Pluggable architecture for different gym booking flows
   - Each gym has its own Puppeteer script
   - Common interface for all gym types
   - Easy to add new gym support

### Benefits
- **Reduces user errors:** Dropdowns vs free text input
- **Supports multiple gym systems:** Not limited to YMCA
- **Easier to maintain:** Gym-specific logic is isolated
- **Better user experience:** Forms match what users see on gym websites
- **Scalable:** Easy to add new gyms

### Implementation Notes

**Database Changes:**
- Add `gym_type` field to `gym_credentials` table (e.g., 'ymca', 'planet_fitness', 'golds_gym')
- Store gym-specific configuration as JSON

**Code Structure:**
```
scripts/
  ├── booking-automation/
  │   ├── base.ts           # Common interface
  │   ├── ymca-daxko.ts     # Current implementation
  │   ├── planet-fitness.ts # Future
  │   └── golds-gym.ts      # Future
  └── gym-scrapers/
      ├── ymca-branches.ts  # Scrape YMCA branch list
      └── ...
```

**UI Updates:**
- Add gym type selector on gym credentials form
- Conditional form fields based on gym type
- Branch dropdown populated via API (scraped from gym website)

### Code Location
- Database migration: `supabase/migrations/` - Add `gym_type` field
- Booking scripts: `scripts/booking-automation/` directory (refactor)
- UI: `components/GymCredentialsForm.tsx`, `components/RecurringClassForm.tsx`
- API: `app/api/gym-branches/route.ts` (new endpoint)

### Testing Considerations
- Test with multiple gym types
- Test branch scraping accuracy
- Test gym-specific booking flows
- Verify fallback behavior if scraping fails

### Dependencies
- Current YMCA implementation working first ✅
- Each new gym requires:
  - Understanding their booking flow
  - Puppeteer script development
  - Testing with real account

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium (future enhancement)
**Last Updated**: 2025-11-13
**Dependencies**: Complete YMCA implementation and test in production first

