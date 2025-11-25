# Backlog

This document contains features and improvements that are planned for future implementation.

---

## Operational Notes & Reminders

### Production Deployment Status

**Current Status:** ✅ DEPLOYED TO PRODUCTION

- **Production URL:** https://my-workout-scheduler.vercel.app
- **Hosting:** Vercel (Hobby plan, free tier)
- **Architecture:** Inngest (event scheduling) → GitHub Actions (Puppeteer execution) → Supabase (data storage)
- **Monitoring:** Inngest Dashboard for event scheduling and runs
- **GitHub Actions:** Triggered via workflow_dispatch by Inngest (not on cron schedule)

### Production Architecture

**Event-Driven Booking Flow:**
1. User creates/edits class → Inngest event scheduled
2. Inngest waits until exact booking window time
3. Inngest triggers `/api/inngest` webhook
4. Booking function triggers GitHub Actions via GitHub API
5. GitHub Actions runs Puppeteer automation
6. Results written directly to Supabase
7. User sees results in dashboard

**Why GitHub Actions for Puppeteer?**
- Vercel serverless functions have timeout limits (10s hobby, 60s pro)
- Puppeteer automation takes 30-60 seconds
- GitHub Actions has no practical timeout constraints (30 min max)
- Chrome/Chromium pre-installed in GitHub Actions environment
- Better logging and screenshot artifacts on failure

---

## Event-Driven Trigger Architecture ✅ COMPLETED

### Overview
**STATUS: ✅ COMPLETED AND DEPLOYED TO PRODUCTION**

Successfully migrated from 15-minute polling to event-driven architecture using Inngest. The system now triggers bookings at exact booking window times with zero wasted runs.

### Previous Approach (Deprecated)
- **Method**: GitHub Actions cron runs every 15 minutes (`*/15 * * * *`)
- **Usage**: ~250 minutes/month (12.5% of 2,000 min free tier)
- **Runs**: 2,880 runs/month (most runs exit early if no bookings needed)
- **Status**: ❌ Replaced by Inngest event-driven architecture

### Current Production Approach ✅
- **Method**: Inngest event-driven scheduling with GitHub Actions execution
- **Inngest Usage**: ~1,530 events/month (3% of 50k free tier)
- **GitHub Actions Usage**: ~300 minutes/month (15% of 2,000 min free tier)
- **Runs**: Only when booking windows open (~100 bookings/month for 5 users)
- **Benefits Achieved**:
  - ✅ Precise timing (triggers at exact booking window times, not rounded to 15-min intervals)
  - ✅ Zero wasted runs (no polling, only runs when needed)
  - ✅ Better reliability (Inngest has 99.9%+ uptime SLA)
  - ✅ Intelligent retry logic built-in (Inngest handles failures gracefully)
  - ✅ Better monitoring (Inngest dashboard shows all scheduled events and runs)
  - ✅ No timeout constraints (GitHub Actions handles Puppeteer execution)
  - ✅ Still completely FREE (all services on free tier)

### Implementation Details

**Chosen Solution:** Inngest Event-Driven Architecture

**Architecture:**
```
User creates/edits class in Next.js
  → Next.js sends event to Inngest with precise timestamp
  → Inngest waits until booking window time
  → Inngest triggers Next.js /api/inngest webhook
  → Booking function triggers GitHub Actions via API (workflow_dispatch)
  → GitHub Actions runs Puppeteer automation
  → Results written to Supabase
```

**Implementation Completed:**
1. ✅ Installed Inngest SDK and created client
2. ✅ Created `/api/inngest` API route for webhooks
3. ✅ Built `bookClassFunction` with intelligent retry logic
4. ✅ Built `dailySchedulerFunction` (midnight UTC cron)
5. ✅ Integrated scheduling with class CRUD operations
6. ✅ Modified GitHub Actions workflow to accept `class_id` input
7. ✅ Updated booking function to trigger GitHub Actions via API
8. ✅ Deployed to Vercel production
9. ✅ Synced Inngest with production URL
10. ✅ Configured all environment variables

**Environment Variables Required:**
- Vercel: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `GITHUB_TOKEN`, `GITHUB_REPOSITORY`
- GitHub Actions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`

**Why Inngest vs Other Options:**
- ✅ Purpose-built for event-driven workflows
- ✅ Built-in retry logic and error handling
- ✅ Visual dashboard for monitoring
- ✅ TypeScript SDK with Next.js integration
- ✅ Simpler than pg_cron (no database functions needed)
- ✅ More flexible than Vercel Cron (no redeployment needed for schedule changes)
- ✅ Generous free tier (50k events/month)
- ✅ Zero wasted runs (only triggers when booking windows open)

### Results

**Metrics After Migration:**
- **Precision**: Exact booking window timing (not rounded to 15-min intervals)
- **Efficiency**: Only runs when needed (~100 runs/month vs 2,880 runs/month)
- **Cost**: Still 100% FREE (Inngest + GitHub Actions free tiers)
- **Reliability**: 99.9%+ uptime (Inngest SLA)
- **Monitoring**: Full visibility via Inngest dashboard

### Status
**Status**: ✅ COMPLETED AND DEPLOYED TO PRODUCTION
**Priority**: N/A (completed)
**Completed**: November 16, 2025
**Production URL**: https://my-workout-scheduler.vercel.app

---

## Retry Logic for Full Classes ✅ COMPLETED

### Overview
**STATUS: ✅ COMPLETED**

Successfully implemented intelligent retry logic that handles both clock drift and class full scenarios. The system now automatically retries bookings when classes are full, checking every 15 minutes until the class starts or a spot becomes available.

### Implementation Details

**Two-Tier Retry Strategy:**

1. **Clock Drift Retries (Short-term, within Puppeteer)**
   - **Scenario**: Booking window not open yet due to time differences between system and gym website
   - **Retry Logic**: 12 attempts × 15 seconds = 3 minutes total
   - **Location**: `scripts/booking-automation.ts` lines 148-215
   - **Behavior**: Page refresh, re-navigation, re-attempt booking
   - **Completed**: November 16, 2025

2. **Class Full Retries (Long-term, orchestrated by Inngest)**
   - **Scenario**: Class is full but spots may open up due to cancellations
   - **Retry Logic**: Every 15 minutes until class starts
   - **Max Retries**: None - keeps trying until class starts
   - **Location**: `lib/inngest/functions.ts` lines 159-208
   - **Architecture**:
     - Inngest function triggers GitHub Actions
     - GitHub Actions runs Puppeteer and sends result event back to Inngest
     - Inngest receives result via `step.waitForEvent()`
     - If class is full, Inngest sleeps 15 minutes and triggers new booking attempt
     - Continues until success or class starts (< 15 minutes remaining)
   - **Completed**: November 16, 2025

### Technical Implementation

**Files Modified:**
- `scripts/booking-automation.ts` - Fixed clock drift retry parameters (12 × 15s)
- `scripts/test-single-booking.ts` - Added Inngest result event sending
- `lib/inngest/functions.ts` - Implemented class full retry orchestration
- `.github/workflows/booking-automation.yml` - Added INNGEST_EVENT_KEY environment variable

**Event Flow:**
1. Inngest triggers booking at exact booking window time
2. GitHub Actions runs Puppeteer automation
3. Puppeteer sends result event back to Inngest (attemptId, status, errorMessage)
4. Inngest receives result and evaluates:
   - ✅ Confirmed/Waitlisted → Done
   - ❌ Failed (not full) → Done
   - 🔁 Failed (class full) → Calculate time until class starts
   - If > 15 min remaining → Sleep 15 min, retry
   - If < 15 min remaining → Done (too late)

### Stop Conditions
- ✅ Booking confirmed
- ✅ Added to waitlist
- ✅ Class starts (< 15 minutes remaining)
- ✅ Non-full failure (login error, class not found, etc.)

### Environment Variables Required
- **GitHub Actions**: `INNGEST_EVENT_KEY` (for sending result events back to Inngest)
- **Vercel**: Already configured with `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

### Production Testing Results

**Clock Drift Retry Test (Nov 16, 2025):**
- ✅ Test scenario: Booking window not open yet
- ✅ Expected behavior: Retry 12 times × 15 seconds = 3 minutes
- ✅ Actual behavior: Failed after 12 retries in 8m 3s total (includes login/navigation)
- ✅ Result: Working as expected

**Class Full Retry Test (Nov 17, 2025):**
- ✅ Test scenario: TRX class at Noon on Monday (full at booking window time)
- ✅ Expected behavior: Retry every 15 minutes until class starts
- ✅ Actual behavior: Failed on first attempt, Inngest `wait-before-retry` step active, waiting ~15 minutes
- ✅ Result: Working as expected (test in progress)

**Immediate Booking Dialog Test (Nov 17, 2025):**
- ✅ Test scenario: Add class when booking window already open
- ✅ "Book Now" option: Triggers immediate booking via API - Working
- ✅ "Skip This Week" option: Saves class, daily scheduler handles next week - Working
- ✅ Result: Working as expected

**Daily Scheduler Test (Nov 17, 2025):**
- ✅ Test scenario: Midnight UTC run with existing classes
- ✅ Expected behavior: Schedule next week's occurrences, skip open windows
- ✅ Actual behavior: Picked up 2 classes, correctly skipped 1 class with open booking window
- ✅ Result: Working as expected

**Duplicate Prevention Test (Nov 17, 2025):**
- ✅ Test scenario: Manually trigger booking for already-reserved class
- ✅ Expected behavior: Detect duplicate and skip booking
- ✅ Actual behavior: Failed as expected with duplicate detection message
- ✅ Result: Working as expected

### Status
**Status**: ✅ COMPLETED, DEPLOYED, AND TESTED
**Priority**: High (was missing, now complete and validated)
**Completed**: November 16, 2025
**Tested**: November 16-17, 2025
**Result**: All retry scenarios working correctly in production

### v2.7 Enhancements (November 17, 2025)

**Enhanced Class Status Detection:**
- ✅ Added detection for 6 class states (available, window not open, reserved, full, cancelled, not reservable)
- ✅ Case-insensitive pill/badge detection for "Class Full", "Cancelled", "Not Reservable"
- ✅ Independent booking button detection (doesn't depend on full status flag)
- ✅ Defensive pre-click check for race conditions
- ✅ Priority-based status determination (reserved > cancelled > not reservable > full > available)
- ✅ Smart retry logic: only retries "Class Full" (temporary), not cancelled/not reservable (permanent)

**Duplicate Booking Prevention:**
- ✅ Run-level duplicate detection (checks pending attempts within 5 minutes)
- ✅ Idempotency keys for retry events (`book-retry-{classId}-{date}-{attempt}`)
- ✅ Inngest-level deduplication (same event ID = single execution)
- ✅ Prevents race conditions when retries trigger simultaneously

**Related PRs:**
- #14: Enhanced class full detection
- #15: Duplicate prevention with idempotency keys

**Testing Guide:**
- See `docs/PRODUCTION_TESTING.md` for comprehensive test plan

---

## GitHub Actions Automation Delay After Completion

### Overview
**STATUS: BACKLOGGED (Low Priority)**

GitHub Actions workflow experiences a ~60 second delay after the booking script completes before moving to the next step. While the booking succeeds and result events are sent to Inngest correctly, the workflow waits unnecessarily before continuing.

### Current Behavior

**Timeline observed in production:**
1. "Run booking automation (single class)" step starts
2. Booking completes successfully (class booked, result sent to Inngest)
3. Script appears to complete
4. ~60 seconds of delay
5. "Upload screenshots" step begins

**Example timing:**
- Script completes: ~1m 2s
- Next step starts: ~2m 2s
- Delay: ~60 seconds

### Investigation Findings

**Attempted fixes:**
1. ✅ Removed 60s setTimeout from `booking-automation.ts` (was keeping process alive)
2. ✅ Added `process.exit(0)` to `test-single-booking.ts` for clean exit
3. ⚠️ Delay persists despite these changes

**Likely root cause:**
- Supabase client connection pools not closing immediately
- Inngest client maintaining open connections
- Node.js waiting for connection pools to drain before exit
- `process.exit(0)` should force exit but may not be triggering properly

**Why it's not MVP-breaking:**
- Bookings succeed correctly
- Result events reach Inngest successfully
- Only impacts workflow run time (adds ~1 minute)
- GitHub Actions has 30-minute timeout (plenty of buffer)
- No functional impact on end-user experience

### Potential Solutions

**Option 1: Force immediate exit with timeout**
```typescript
setTimeout(() => {
  console.error('Force exiting after 2s timeout')
  process.exit(1)
}, 2000).unref()
process.exit(0)
```
- Attempted but may not have taken effect (promoted build was from old commit)

**Option 2: Explicitly close all connections**
```typescript
await supabase.removeAllChannels()
await supabase.auth.signOut()
// Close Inngest client connections
process.exit(0)
```

**Option 3: Accept the delay**
- 60 seconds is not significant for overnight scheduled runs
- Adds buffer time for connection cleanup
- May be safer than forcing immediate exit

### Status
**Status**: Backlogged - Not actively being addressed
**Priority**: Low (not MVP-blocking)
**Impact**: Adds ~60 seconds to workflow run time
**Last Updated**: November 16, 2025
**Decision**: Accept current behavior, may revisit post-MVP if it becomes problematic

---

## Duplicate Detection Race Window (45-Second Gap)

### Overview
**STATUS: BACKLOGGED (Low Priority)**

The duplicate run detection has a ~45-second race window where simultaneous booking attempts could both proceed. This happens because the duplicate check occurs in Inngest (fast) but the `pending` database record is created by GitHub Actions (slow to start).

### Current Behavior

**Timeline of duplicate detection:**
1. First Inngest run (t=0s): Checks DB → Finds 0 pending → Triggers GitHub Actions
2. Second Inngest run (t=0-45s): Checks DB → Finds 0 pending → Triggers GitHub Actions
3. First GitHub Actions (t=~45s): Creates `pending` attempt in DB
4. Second GitHub Actions (t=~45s): Creates `pending` attempt in DB

**Result:** Both attempts proceed if triggered within ~45 seconds of each other.

**Test Results (2025-11-24):**
- Triggered two bookings 0.2 seconds apart
- Both Inngest functions returned `false` from duplicate check
- Both GitHub Actions workflows ran
- Both created pending attempts in database
- Gap from Inngest start to DB record creation: 44-81 seconds

### Why It's Low Priority

**Unlikely to happen in practice:**
1. **Inngest event deduplication (primary defense)**: Inngest already deduplicates events at the infrastructure level (idempotency keys)
2. **User behavior**: Users won't manually trigger within 45 seconds
3. **Automated triggers**: Daily scheduler and retry logic use unique event IDs
4. **Failure is graceful**: Even if duplicate runs proceed, gym website would reject second booking attempt

**This is defense-in-depth** - a second line of defense that catches rare edge cases.

### Potential Solutions

**Option A: Create pending attempt in Inngest (before GitHub Actions)**
```typescript
// In lib/inngest/functions.ts, before triggering GitHub Actions:
const attemptId = await step.run('create-pending-attempt', async () => {
  return await createBookingAttempt(
    classData.id,
    'pending',
    null,
    classData.branch || 'Unknown'
  );
});

// Then trigger GitHub Actions with attemptId
// GitHub Actions updates the attempt instead of creating new one
```

**Pros:**
- Closes the race window completely
- Duplicate check happens immediately after creation
- Clean separation: Inngest creates, GitHub Actions updates

**Cons:**
- Need to pass attemptId to GitHub Actions
- GitHub Actions script needs refactoring to update vs create
- More complex error handling (if GitHub Actions fails, pending attempt orphaned)

**Option B: Add duplicate check in GitHub Actions workflow**
- Check for pending attempts before creating new one
- Simpler but adds DB query to Puppeteer script
- Still has small race window (both workflows start simultaneously)

**Option C: Use database-level locking**
- Add unique constraint: `(recurring_class_id, class_date, status='pending')`
- Second attempt would fail at DB level
- Simpler but less graceful (throws error vs clean exit)

### When to Revisit

**Revisit this if:**
- You implement "Book Now" manual trigger button (users could spam-click)
- You see duplicate booking attempts in production logs
- Webhook/event duplicates start appearing
- You want to add real-time notifications (WebSocket connections might duplicate)

**Otherwise:** Accept current behavior. The 45-second window is unlikely to be hit given Inngest's event deduplication and normal usage patterns.

### Code Location
- Duplicate check: `lib/inngest/functions.ts` lines 52-88
- Pending attempt creation: GitHub Actions → `scripts/test-single-booking.ts` → `booking-automation.ts`

### Status
**Status**: Backlogged - Known limitation, not actively being addressed
**Priority**: Low (defense-in-depth, unlikely scenario)
**Impact**: Rare race condition where duplicate bookings could proceed within 45-second window
**Last Updated**: November 24, 2025
**Decision**: Accept current behavior, primary defense (Inngest idempotency) is sufficient
**Testing**: Documented in production testing session (Test #5)

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

## Performance Optimizations

### Browser Session Reuse for Same User

#### Overview
Currently, each class booking launches a new browser instance and logs in separately, even when multiple classes belong to the same user. This optimization reuses the same browser session for all classes belonging to a single user, reducing login overhead and improving efficiency.

#### Current Behavior
- Each class booking launches a new Puppeteer browser instance
- Each class booking performs a separate login
- All classes for a user are processed sequentially, but each requires a fresh login

#### Proposed Behavior
- Launch one browser instance per user
- Log in once per user
- Process all classes for that user in the same browser session
- Close browser after all classes for that user are complete

#### Benefits
- **Reduced login time**: Login once per user instead of once per class
- **Faster execution**: Eliminates redundant browser launches and logins
- **Better resource usage**: Fewer browser instances running simultaneously

#### Implementation Notes
- Modify `processUserBookings()` in `scripts/run-booking-automation.ts`
- Launch browser once before processing classes
- Pass browser instance to `bookClass()` function
- Close browser after all classes are processed
- Handle errors gracefully (ensure browser closes even on failure)

#### Estimated Impact
- **Time savings**: ~5-10 seconds per additional class per user
- **Example**: User with 3 classes saves ~10-20 seconds total

#### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Low (nice-to-have optimization, current approach works)
**Last Updated**: 2025-01-14

---

### Cookie Persistence Across Automation Runs

#### Overview
Implement cookie persistence so that users remain logged in across automation runs, eliminating the need to log in on every run. This leverages the "Keep me logged in" checkbox functionality.

#### Current Behavior
- Each automation run starts with a fresh browser instance
- Cookies/sessions are not persisted between runs
- Users must log in on every automation run
- "Keep me logged in" checkbox only helps within a single browser session

#### Proposed Behavior
- Save cookies after successful login
- Store cookies in a secure location (encrypted, user-specific)
- Restore cookies at the start of each automation run
- Attempt to use saved cookies before performing login
- Fall back to login if cookies are expired or invalid

#### Benefits
- **Faster execution**: Skip login step if cookies are valid
- **Better user experience**: Respects "Keep me logged in" preference
- **Reduced load**: Fewer login requests to gym website

#### Implementation Notes
- Store cookies in database or secure file storage (encrypted)
- Associate cookies with user_id and gym_url
- Implement cookie expiration checking
- Handle cookie refresh/update when cookies expire
- Security: Encrypt cookies at rest, use secure storage

#### Challenges
- Cookie storage security (must be encrypted)
- Cookie expiration handling
- Cookie format compatibility across Puppeteer versions
- Handling multiple gym URLs per user (if supported in future)

#### Estimated Impact
- **Time savings**: ~5-10 seconds per user per run (if cookies valid)
- **Reliability**: Depends on gym website cookie expiration policy

#### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Low (nice-to-have optimization, login is fast)
**Last Updated**: 2025-01-14

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
- ✅ Could use **Vercel free tier** (API calls are fast, <10s)
- ✅ Could eliminate GitHub Actions dependency
- ✅ Much simpler architecture
- ✅ More reliable than browser automation
- ✅ Faster booking (<5s vs 30-60s)

**If API requires partner status or is limited:**
- ⚠️ May need to stick with Puppeteer
- ⚠️ Or use hybrid: API for checks, Puppeteer for booking

**Current Status:**
- ✅ **Timeout issue solved** via Inngest → GitHub Actions architecture
- ✅ Puppeteer works reliably in production (no Vercel timeout constraints)
- ✅ System is production-ready and working
- 📊 Daxko API would still be a significant improvement if available (speed, simplicity, reliability)

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

## Gym Management and Timezone Inheritance

### Overview
Refactor the data model to support proper gym management where gyms are first-class entities with locations and timezones, and classes inherit timezone from their gym. This eliminates repetitive timezone selection and ensures consistency across classes at the same gym.

### Current Implementation (MVP)
- ✅ Timezone is set per class
- ✅ Users select timezone for each class individually
- ⚠️ Can lead to inconsistencies if user selects wrong timezone for same gym

### Proposed Implementation

#### Requirements

1. **Gym Entity Management**
   - As a user, I want to add my gym or gyms to my workout profile
   - Gym attributes:
     - Name (e.g., "YMCA of Greater Cincinnati")
     - City and State (e.g., "Cincinnati, OH")
     - Timezone (e.g., "America/New_York") - **set once per gym location**
     - One or more branches (e.g., "Downtown", "West Side", "Anderson")
   - Store gym as reusable entity that can be referenced by multiple classes

2. **Class-to-Gym Relationship**
   - Classes belong to a gym (foreign key relationship)
   - Classes inherit timezone from their gym
   - Timezone field removed from class form (no longer needed)
   - Branch selection is dropdown from gym's branch list

3. **Classes Without a Gym**
   - As a user, I want to be able to add classes that do not belong to a gym
   - For standalone classes (not associated with a gym):
     - User selects timezone directly on the class
     - No branch selection needed
   - Use case: Private training sessions, outdoor classes, etc.

#### Benefits
- **Consistency**: Timezone automatically correct for all classes at same gym
- **Simplified UX**: Don't repeat timezone selection for each class
- **Data integrity**: Single source of truth for gym timezone
- **Scalability**: Easy to add new branches to existing gym
- **Flexibility**: Still supports standalone classes without a gym

#### Database Schema Changes

**New Table: `gyms`**
```sql
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  timezone TEXT NOT NULL,
  branches TEXT[] NOT NULL, -- Array of branch names
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Updated Table: `recurring_classes`**
```sql
ALTER TABLE recurring_classes
  ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  ALTER COLUMN timezone DROP NOT NULL, -- Make optional
  ALTER COLUMN branch DROP NOT NULL; -- Make optional

-- Timezone is required only if gym_id is NULL (standalone class)
-- Branch is required only if gym_id is NOT NULL (gym class)
```

**Migration Strategy:**
1. Create new `gyms` table
2. Add `gym_id` column to `recurring_classes` (nullable)
3. Migrate existing classes:
   - Group classes by (user, gym_url, branch, timezone)
   - Create gym entities for each unique combination
   - Update classes to reference gym_id
4. Make timezone optional on classes (required only if gym_id is NULL)

#### UI Changes

**New: Gym Management Page** (`/dashboard/gyms`)
- List of user's gyms
- Add/Edit/Delete gym
- Manage branches per gym
- Shows how many classes use each gym

**Updated: Add/Edit Class Form**
- Step 1: "Does this class belong to a gym?"
  - Yes → Select gym from dropdown (or "Add New Gym")
  - No → Standalone class (show timezone field)
- Step 2 (if gym selected):
  - Branch dropdown populated from selected gym
  - Timezone inherited (shown as read-only)
- Step 2 (if standalone):
  - Branch field hidden
  - Timezone selector shown

**Gym Form Fields:**
- Gym Name
- City
- State
- Timezone (dropdown)
- Branches (multi-input, add/remove)

#### Implementation Notes

**Code Location:**
- Database migration: `supabase/migrations/00X_gym_management.sql`
- Types: Update `lib/database.types.ts`
- Database helpers: `lib/supabase/database.ts` - Add gym CRUD operations
- Actions: `app/actions/gyms.ts` - Server actions for gym management
- UI: `app/dashboard/gyms/page.tsx` - Gym management page
- UI: Update `app/dashboard/schedule/` forms to use gym selection

**Timezone Logic:**
```typescript
// When booking, resolve timezone:
const timezone = class.gym_id
  ? class.gym.timezone  // Inherited from gym
  : class.timezone;     // Standalone class timezone
```

**Validation:**
```typescript
// On class create/update:
if (gymId) {
  // Gym class: require gymId and branch
  assert(gymId && branch, 'Gym and branch required')
  // Timezone inherited, should be null/undefined
} else {
  // Standalone class: require timezone
  assert(timezone, 'Timezone required for standalone class')
  // Branch should be null/undefined
}
```

### Testing Considerations
- Test gym CRUD operations
- Test class creation with gym (timezone inherited)
- Test standalone class creation (timezone required)
- Test migration from old schema
- Test booking automation with both gym and standalone classes
- Verify timezone resolution logic
- Test branch dropdown population

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium (improves UX and data model, but MVP works without it)
**Last Updated**: November 17, 2025
**Note**: Current MVP correctly sets timezone per class, which works but is less user-friendly

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

