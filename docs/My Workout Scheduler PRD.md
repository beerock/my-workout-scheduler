# My Workout Scheduler \- Product Requirements Document

**Version:** 2.7
**Product Owner:** Brock Busby
**Last Updated:** November 17, 2025
**Status:** Production - Deployed and Testing


**Recent Updates:**
- ✅ Completed Days 1-2: Next.js setup, Supabase auth, login/signup pages
- ✅ Completed database schema and RLS policies
- ✅ Implemented application-level encryption for gym credentials
- ✅ Built gym credentials form with password show/hide and confirmation
- ✅ **COMPLETED: Full Schedule Management System**
  - Add/Edit/Delete/Copy recurring classes
  - Schedule list view with prominent day/time display
  - Global pause toggle (pause all bookings)
  - Per-class active toggle
  - Skip next occurrence feature with smart unskip logic
  - Timezone handling and date calculations
  - Copy class feature for quick duplication
- ✅ **COMPLETED: Event-Driven Booking Automation System**
  - Migrated from GitHub Actions cron to Inngest event-driven triggers
  - **Production Architecture:** Inngest schedules events → GitHub Actions executes Puppeteer
  - Puppeteer scripts for YMCA Daxko platform (login, navigation, class finding)
  - Precise timing: triggers at exact booking window times (not polling)
  - Intelligent retry logic: clock drift (12×15s) and class full (15min intervals)
  - Parallel processing for multiple users (<60s total booking time)
  - Database integration (booking attempts tracking)
  - Error handling and screenshot capture
  - FREE infrastructure (Inngest + GitHub Actions free tiers)
- ✅ **COMPLETED: Production Deployment**
  - Deployed to Vercel (https://my-workout-scheduler.vercel.app)
  - Inngest production sync complete
  - Environment variables configured (Supabase, Inngest, GitHub)
  - End-to-end production testing in progress
- ✅ **COMPLETED: Production Testing**
  - Clock drift retry logic: Tested and working (12 × 15s, 8m 3s total)
  - Successful bookings: Multiple confirmed reservations via automation
  - Waitlist handling: Tested and working correctly
  - Immediate booking dialog: Tested (Book Now and Skip This Week options)
  - Daily scheduler: Tested (correctly schedules next occurrences, skips open windows)
  - Duplicate prevention: Tested (correctly detects already-booked classes)
  - Class full retry: Currently testing (15-minute intervals until class starts)
- ✅ **COMPLETED: Enhanced Class Status Detection (v2.7)**
  - Case-insensitive detection for multiple "full" variations
  - Explicit pill/badge element detection (orange "Class Full", red "Not Reservable")
  - Cancelled class detection (permanent failure, no retry)
  - Not Reservable class detection (permanent failure, no retry)
  - Independent booking button detection (handles edge cases)
  - Defensive pre-click check for race conditions
  - Priority-based status determination (reserved > cancelled > not reservable > full > available)
  - Smart retry logic: only retries for temporary failures (class full)
- ✅ **COMPLETED: Duplicate Booking Prevention (v2.7)**
  - Duplicate run detection (checks for pending attempts within 5 minutes)
  - Idempotency keys for retry events (format: `book-retry-{classId}-{date}-{attempt}`)
  - Prevents race conditions when retries trigger simultaneously
  - Inngest-level deduplication (same event ID = single execution)
  - Clean database (no orphaned pending attempts)
- ✅ **COMPLETED: Fuzzy Matching for Class Names (v2.7)**
  - Handles typos and spelling variations in class names (e.g., "Raquetball" → "Racquetball")
  - Uses Levenshtein distance algorithm with 0.75-0.8 similarity threshold
  - Applies to both class finding (schedule search) and booking button detection
  - Handles concatenated words (e.g., "RacquetballAsheville")
  - Case-insensitive matching
  - Improves user experience by being more forgiving of input errors
- ✅ **COMPLETED: scrollIntoView for Dynamically Loaded Classes (v2.7)**
  - Scrolls booking buttons into viewport before clicking
  - Critical for classes that appear after "Load more results"
  - Prevents click failures on elements outside viewport
  - Smooth scrolling with 500ms animation delay

**Major Changes from v1.0:**

- Pivoted from standalone automation script to web application
- Scoped to 2-week prototype with minimal viable features
- Simplified tech stack (all free tier tools)
- Focus on core automation over polish
- **v2.3:** Migrated to event-driven architecture for better reliability and cost savings
- **v2.4:** Production deployment with Inngest → GitHub Actions hybrid architecture
- **v2.5:** Production testing complete, retry logic validated, removed artificial max retry limits

---

## 1\. Product Vision

### What We're Building

A web application that automatically books recurring gym classes for users the instant registration opens, with a simple dashboard for configuration and monitoring.

### The Problem

Gym classes (especially popular ones like BODYPUMP) fill up within minutes of registration opening. Users either:

- Miss their spot because registration opens at inconvenient times (e.g., 7:30 AM)  
- Lose out because they're a few minutes late  
- Have to manually monitor and book every week

### The Solution

"Set it and forget it" automation that books classes with sub-minute precision when registration opens, with basic visibility and control through a web interface.

### Success Metrics (Prototype)

- **Primary KPI:** Successfully book user into class within 60 seconds of registration opening  
- Secondary: 80%+ booking success rate (excluding legitimately full classes)  
- User satisfaction: Users no longer manually book classes

---

## 2\. Target Users

### Prototype Users (n=5)

- **Primary:** Brock (Asheville YMCA, Downtown \+ Woodfin branches)
- **Secondary:** Nicole (same gyms/branches)
- **Additional:** Up to 3 more users for expanded testing
- **Characteristics:** Tech-savvy, want automation, attend recurring weekly classes, willing to use functional-over-pretty UI

### Future Users

- Fitness enthusiasts with recurring class schedules  
- People frustrated with manual booking competition  
- Members of gyms with competitive class registration

---

## 3\. Core Features (2-Week Prototype)

### 3.1 User Management

| Feature | Description | Priority |
| :---- | :---- | :---- |
| **Account Creation** | Email/password registration via Supabase Auth | High |
| **Login** | Basic login page | High |
| **Credential Storage** | Securely store gym website login credentials (Supabase encrypted) | High |
| **Gym Configuration** | Set gym URL and default branch | High |

### 3.2 Schedule Management ✅ COMPLETE

| Feature | Description | Priority | Status |
| :---- | :---- | :---- | :---- |
| **Add Recurring Class** | Form: day, time, class type, branch, booking window hours, timezone | High | ✅ |
| **View Schedule** | List view with prominent day/time display, sorted by day then time | High | ✅ |
| **Edit/Delete Class** | Full CRUD operations with confirmation dialogs | High | ✅ |
| **Copy Class** | Duplicate existing class with pre-populated form | Medium | ✅ |
| **Timezone Setting** | User specifies timezone per class (stored in recurring_classes) | High | ✅ |
| **Global Pause** | Toggle to pause all bookings across all classes | High | ✅ |
| **Per-Class Active Toggle** | Enable/disable individual classes | High | ✅ |
| **Skip Next Occurrence** | Skip a single upcoming class with smart unskip logic | High | ✅ |

**Example Configuration:**

- Monday 4:15 PM BODYPUMP @ Downtown YMCA (books 26 hours prior)  
- Wednesday 4:15 PM BODYPUMP @ Downtown YMCA (books 26 hours prior)  
- Saturday 9:30 AM BODYPUMP @ Downtown YMCA (books 26 hours prior)

### 3.3 Automated Booking Engine ✅ COMPLETE

| Feature | Description | Priority | Status |
| :---- | :---- | :---- | :---- |
| **Event-Driven Scheduling** | Inngest triggers bookings at exact window times (e.g., Friday 7:30 AM for Saturday 9:30 AM class) | High | ✅ |
| **Browser Automation** | Puppeteer logs into gym site and completes booking flow | High | ✅ |
| **Intelligent Retry Logic** | Clock drift: 12 retries × 15s; Class full: every 15min until class starts | High | ✅ |
| **Booking Logic** | Reserve if available, waitlist if full, skip if already booked | High | ✅ |
| **Error Handling** | Detect failures, log errors, send notification | High | ✅ |
| **Status Updates** | Write booking results back to database | High | ✅ |
| **Daily Scheduler** | Midnight UTC cron ensures all active classes are scheduled | High | ✅ |

**Booking Flow (Production Architecture):**

1. **User creates/edits class** → Next.js calculates booking window time → Sends event to Inngest
2. **Inngest waits** until exact booking window time (e.g., Friday 7:30 AM)
3. **Inngest triggers** booking function via webhook (`/api/inngest`)
4. **Booking function executes:**
   - Fetches class data from database
   - Checks if user paused or skip date set
   - Creates booking attempt record in database
   - Triggers GitHub Actions workflow via GitHub API (workflow_dispatch)
   - Passes class_id as input parameter
5. **GitHub Actions workflow runs:**
   - Checks out code and installs dependencies
   - Installs Puppeteer browsers (Chrome)
   - Runs `test-single-booking.ts` script with class_id
   - Puppeteer automation:
     - Login with decrypted credentials
     - Navigate to class schedule
     - Verify correct branch
     - Find target class (day + time)
     - Check status and take action (reserve/waitlist/skip)
   - Updates database with result
   - Uploads screenshots (on failure)
   - Send email notification (future)
6. **Retry handling:**
   - **Booking window not open yet** → Retry in 15s (up to 12 times = 3 min total)
   - **Class full** → Retry every 15 min until class starts
   - **Success or permanent failure** → Stop
7. **Daily scheduler** (midnight UTC) → Re-schedules all active classes for next occurrence

### 3.4 Dashboard & Monitoring (Minimal)

| Feature | Description | Priority |
| :---- | :---- | :---- |
| **Upcoming Classes View** | Simple list of scheduled classes | High |
| **Booking Status** | Status badge: Pending, Confirmed, Waitlisted, Failed | High |
| **Email Notifications** | Send confirmation/failure emails | High |
| **Basic History** | Show last 30 days of booking attempts | Medium |

### 3.5 What's NOT Included (Prototype)

- ❌ Pretty design (functional Bootstrap/Tailwind only)  
- ❌ Calendar view (just lists)  
- ❌ Manual trigger buttons (edit schedule to retry)  
- ❌ Multi-branch fallback (add to v2)  
- ❌ Advanced error recovery (manual intervention required)  
- ❌ Mobile app (responsive web only)  
- ❌ Class listing scraper (manual entry for now)

---

## 4\. User Stories (Prototype Scope)

### Setup & Configuration

- As a user, I want to create an account and log in so I have my own isolated configuration  
- As a user, I want to securely store my gym login credentials so the system can book classes on my behalf  
- As a user, I want to add recurring classes to my schedule with day/time/branch so the system knows what to book  
- As a user, I want to specify when booking opens (e.g., 26 hours prior) so automation happens at the right time

### Automated Booking

- As a user, I want the system to automatically book my classes when registration opens so I don't have to wake up early or remember  
- As a user, I want to join the waitlist if my class is full rather than just failing  
- As a user, I want to be notified via email whether booking succeeded or failed

### Monitoring

- As a user, I want to see which classes are confirmed vs. pending so I know my status  
- As a user, I want to see recent booking history so I can troubleshoot issues

---

## 5\. Technical Architecture

### System Components (Simplified)

**1\. Web Application**

- **Framework:** Next.js 14 (App Router)  
- **UI:** Tailwind CSS (functional, not fancy)  
- **Hosting:** Vercel (free tier)  
- **Features:** Auth pages, schedule management forms, status dashboard

**2\. Database & Auth**

- **Service:** Supabase (free tier)  
- **Auth:** Built-in email/password authentication  
- **Database:** PostgreSQL  
- **Features:** User management, encrypted credential storage, schedule data

**3\. Event-Driven Automation**

- **Orchestration:** Inngest (free tier, 50k events/month)
- **Scheduling:** Event-driven triggers at exact booking window times (e.g., Friday 7:30 AM for Saturday 9:30 AM class)
- **Execution:** GitHub Actions triggered via GitHub API (workflow_dispatch)
- **Tool:** Puppeteer (headless Chrome) runs in GitHub Actions environment
- **Process:** Inngest schedules event → Triggers at precise time → Calls GitHub API → GitHub Actions runs Puppeteer → Book class → Update DB
- **Daily Scheduler:** Runs at midnight UTC to ensure all active classes are scheduled for next occurrence
- **Monitoring:** Inngest dashboard provides full visibility into scheduled events, runs, and logs
- **Production Benefits:** No serverless timeout constraints (Vercel has 10s hobby, 60s pro limits), proven reliability, better logging

**3.1 Intelligent Retry Logic** ✅ FULLY IMPLEMENTED AND TESTED

The system handles two types of failures with different retry strategies:

**Clock Drift (Booking Window Not Open Yet):**
- **Detection:** "Booking window not open yet" error or disabled RESERVE button with tooltip
- **Retry Logic:** 12 attempts × 15 seconds = 3 minutes total
- **Implementation:** Within Puppeteer script (`booking-automation.ts`)
- **Behavior:** Page refresh, re-navigation, re-attempt booking
- **Reason:** Gym website clock may be 1-2 minutes off from our system clock
- **Outcome:** Catches booking window as soon as it opens
- **Testing:** ✅ Tested in production (Nov 16, 2025) - Failed after 12 retries in 8m 3s as expected

**Class Full (No Spots Available):**
- **Detection:** "Class Full" pill visible or "Class is full" error message
- **Retry Logic:** Every 15 minutes until class start time (no max limit - keeps trying until < 15 min before class)
- **Implementation:** Orchestrated by Inngest (`lib/inngest/functions.ts`)
- **Architecture:**
  - Puppeteer sends result event back to Inngest after each attempt
  - Inngest receives result via `step.waitForEvent()` with 10-minute timeout
  - If class full, calculates time until class starts
  - If > 15 minutes remaining, sleeps 15 minutes and triggers new booking attempt
  - Continues until success, class starts (< 15 min), or non-full failure
- **Reason:** Someone may cancel their reservation, creating an opening
- **Outcome:** Automatically books if a spot becomes available (can retry for entire booking window if needed)
- **Testing:** ✅ Currently testing in production (Nov 17, 2025) - TRX class, retrying every 15 minutes

**Technical Errors:**
- **Detection:** Puppeteer crashes, network errors, unexpected page states
- **Retry Logic:** Inngest automatically retries function 3 times with exponential backoff
- **Outcome:** Handles transient failures gracefully

**4\. Notifications**

- **Service:** Resend or SendGrid (free tier)  
- **Trigger:** After each booking attempt  
- **Content:** Success/failure with details

### Database Schema (Simplified)

\-- Handled by Supabase Auth  
users (id, email, created\_at)

\-- User's gym credentials  
gym\_credentials (  
  id,  
  user\_id (FK),  
  gym\_url,  
  username,  
  encrypted\_password,  
  default\_branch,  
  created\_at  
)

\-- Recurring class schedule  
recurring\_classes (  
  id,  
  user\_id (FK),  
  day\_of\_week (0-6),  
  class\_time,  
  class\_type,  
  branch,  
  booking\_window\_hours,  
  timezone,  
  active (boolean),  
  created\_at  
)

\-- Booking attempt log  
booking\_attempts (  
  id,  
  recurring\_class\_id (FK),  
  attempt\_timestamp,  
  status (pending/confirmed/waitlisted/failed),  
  branch\_used,  
  error\_message,  
  created\_at  
)

### Data Flow (Production Architecture)

1. **User configures schedule** → Next.js form → Supabase DB
2. **Next.js calculates booking window** → Sends event to Inngest with precise timestamp
3. **Inngest waits** until booking window time arrives
4. **Inngest triggers** → Calls Next.js `/api/inngest` webhook
5. **Booking function runs** → Fetches class data → Creates booking attempt → Triggers GitHub Actions via API
6. **GitHub Actions executes** → Runs Puppeteer → Books class → Updates Supabase DB directly
7. **Retry handling** → Inngest reschedules events for clock drift or full classes
8. **Email sent** → Via Resend/SendGrid → User notified (future)
9. **User checks dashboard** → Next.js queries Supabase → Shows status
10. **Daily scheduler** (midnight UTC) → Re-schedules all active classes for next week

### Security

- Supabase Row Level Security (RLS) policies ensure users only see their own data
- Gym credentials encrypted using application-level AES-256-GCM encryption (Node.js crypto module)
  - Encryption key stored in environment variables (never sent to database)
  - Password encrypted before storage, decrypted only when needed for automation
- GitHub Personal Access Token with `workflow` scope for triggering GitHub Actions
- GitHub Actions secrets for Supabase and encryption keys
- HTTPS everywhere (Vercel default)
- Vercel environment variables for production (Supabase, Inngest, GitHub credentials)

### Environment Variables

**Vercel Production Environment:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (bypasses RLS)
- `ENCRYPTION_KEY` - AES-256-GCM encryption key for gym credentials
- `INNGEST_EVENT_KEY` - Inngest event key for sending events
- `INNGEST_SIGNING_KEY` - Inngest signing key for webhook verification
- `GITHUB_TOKEN` - GitHub Personal Access Token with `workflow` and `repo` scopes
- `GITHUB_REPOSITORY` - GitHub repository (e.g., `beerock/my-workout-scheduler`)

**GitHub Actions Secrets:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `ENCRYPTION_KEY` - Same encryption key as Vercel (for decrypting credentials)

**Local Development (.env.local):**
- Same as Vercel, plus:
- `INNGEST_SIGNING_KEY=signkey-dev-00000000000000000000000000000000000000000000` (dev mode)

---

## 6\. Non-Functional Requirements

| Category | Requirement | Details |
| :---- | :---- | :---- |
| **Reliability** | 99%+ uptime | Inngest provides enterprise-grade reliability |
| **Performance** | \<60s booking latency | From registration open to booking submitted; event-driven reduces latency |
| **Security** | Encrypted credentials | Application-level AES-256-GCM encryption |
| **Scalability** | Support 5 users | Free tiers handle 5 users × 5 classes/week = 100 bookings/month easily |
| **Maintainability** | Simple codebase | Prioritize readability over cleverness; event-driven architecture cleaner than polling |
| **Cost** | **FREE** | All services on free tier (eliminated $4-8/month GitHub Actions cost) |

---

## 7\. Implementation Timeline (2 Weeks)

### Week 1: Core Functionality

**Days 1-2: Setup & Auth** ✅ COMPLETE

- [x] Create Next.js project
- [x] Set up Supabase project
- [x] Connect Supabase Auth
- [x] Build login/signup pages
- [x] Deploy to Vercel (https://my-workout-scheduler.vercel.app)

**Days 3-4: Schedule Management** ✅ COMPLETE

- [x] Create database schema in Supabase  
- [x] Set up Row Level Security (RLS) policies
- [x] Implement application-level encryption for gym credentials
- [x] Build gym credentials form (with password show/hide and confirmation)
- [x] Build "Add Class" form (with all required fields)
- [x] Build "View Schedule" page (with prominent day/time display)
- [x] Implement edit/delete functionality
- [x] Add copy class feature
- [x] Global pause toggle (pause all bookings)
- [x] Per-class active toggle
- [x] Skip next occurrence feature with booking window logic
- [x] User settings table for pause state
- [x] Database migration for schedule management features

**Days 5-7: Booking Script** ✅ COMPLETE

- [x] Set up Puppeteer locally  
- [x] Write script to login to YMCA site  
- [x] Navigate to class schedule  
- [x] Implement booking logic (reserve/waitlist)  
- [x] Test manually with real credentials  
- [x] Handle common error cases

### Week 2: Automation & Polish

**Days 8-10: Event-Driven Scheduler** ✅ COMPLETE

- [x] ~~Create GitHub Action workflow~~
- [x] ~~Set up 15-minute cron trigger (`*/15 * * * *`)~~
- [x] **Migrated to Inngest event-driven architecture**
- [x] Set up Inngest client and API route
- [x] Create booking function with intelligent retry logic
- [x] Create daily scheduler function (midnight UTC)
- [x] Integrate scheduling with class creation/update
- [x] Run Puppeteer in GitHub Actions (manual trigger)
- [x] Write results back to database
- [x] Test end-to-end automation with parallel processing

**Days 11-12: Dashboard & Notifications**

- [ ] Build status dashboard page
- [ ] Show booking history (last 30 days)
- [x] Set up email service (Resend) - ✅ Completed
  - Development: `onboarding@resend.dev`
  - Production: `noreply@beerock.com` (domain verified, DKIM enabled)
- [ ] Send booking confirmation emails
- [ ] Send failure alert emails

**Days 13-14: Testing & Launch**

- [ ] Test with both user accounts  
- [ ] Real booking attempts for upcoming classes  
- [ ] Fix any critical bugs  
- [ ] Document setup for Nicole  
- [ ] Launch prototype

---

## 8\. Out of Scope (Prototype)

### Deferred to Post-Prototype

- ❌ Pretty UI design (functional only for now)
- ❌ Mobile app (responsive web works)
- ❌ Calendar view (list view sufficient)
- ❌ Multi-branch fallback logic
- ✅ ~~Manual "Book Now" button~~ (Implemented via immediate booking dialog when adding classes in open booking window)
- ❌ SMS notifications
- ❌ Advanced analytics dashboard
- ❌ Scraping gym site for class listings
- ❌ Support for multiple gym systems
- ❌ Social features
- ❌ Payment processing
- ❌ Class cancellation detection

### Constraints

- Prototype limited to 5 users (Brock, Nicole, + 3 additional testers)
- Manual class schedule entry (no auto-import)
- Email notifications only
- Single gym system (YMCA Daxko platform)
- Functional UI (not polished design)

---

## 9\. Success Criteria (Prototype Launch)

### Must Have ✅

- Up to 5 users can create accounts and log in
- Users can add/edit/delete recurring classes
- Inngest triggers bookings at exact window times
- System books at least 1 class successfully for each user
- Intelligent retry logic handles clock drift and full classes
- ~~Users receive email notifications~~ (future)
- Dashboard shows accurate booking status
- No security vulnerabilities (credentials encrypted)

### Nice to Have

- 80%+ booking success rate  
- Booking happens within 60 seconds of registration  
- Email notifications are reliable  
- UI is usable on mobile

### Known Limitations (Acceptable for Prototype)

- No multi-branch fallback (manual retry)  
- Basic error messages (not user-friendly)  
- Limited booking history (30 days)  
- Manual intervention needed if automation fails  
- No real-time updates (refresh to see status)

---

## 10\. Risks & Mitigation

| Risk | Impact | Mitigation |
| :---- | :---- | :---- |
| Inngest event delivery delays | Low | Inngest has 99.9%+ reliability; daily scheduler provides fallback |
| Gym website changes layout | High | Version selectors, alert on failures, manual fix |
| Puppeteer fails during execution | Medium | Inngest auto-retries 3x; detailed logging; screenshots |
| Free tier limits exceeded | Very Low | 5 users × 5 classes = 100 bookings/month; Inngest allows 50k events/month |
| Timezone calculation errors | Medium | Use date-fns-tz library for accurate conversions |
| Concurrent booking conflicts | Low | 5 users booking different times/branches; rare collision |
| Old scheduled events (after edit/delete) | Low | Events that don't match current data exit early gracefully |

---

## 11\. Future Enhancements (Post-Prototype)

### Phase 2 (Weeks 3-4)

- Polish UI design with better styling
- Multi-branch fallback logic
- ✅ ~~Manual "Book Now" trigger button~~ (Completed: Immediate booking dialog)
- Better error messages and recovery
- Real-time status updates

### Phase 3 (Months 2-3)

- Scrape gym site for class listings  
- Support for more YMCA branches  
- Calendar view of schedule  
- SMS notifications  
- Enhanced booking history and analytics

### Long-Term (6+ months)

- Support multiple gym systems  
- Mobile app (React Native)  
- Social features (share schedules)  
- Integration with calendar apps  
- Auto-cancel on conflicts

---

## 12\. Open Questions

- [ ] What's the exact timing window for YMCA bookings? (Test and document)  
- [ ] Should waitlist be automatic or require confirmation?  
- [ ] Do we need to handle class cancellations from gym side?  
- [ ] What happens if both users book the same class/time? (Unlikely but possible)

---

## Appendix A: YMCA Booking Flow (Daxko Platform)

**Target URL:** `https://ops1.operations.daxko.com/Online/4032/GXP/ClassSchedule.mvc`

**Manual Booking Steps:**

1. Navigate to URL → Login page appears  
2. Enter username/password → Submit  
3. Select branch from dropdown (e.g., "Asheville \- Downtown")  
4. Navigate to class schedule for target day  
5. Find target class (e.g., "BODYPUMP 4:15 PM")  
6. Check button text:  
   - "RESERVE" → Click to book  
   - "ADD TO WAITLIST" → Click to join waitlist  
   - "RESERVED" → Already booked, stop  
   - "FULL" → No action available  
7. If button clicked → Confirmation page appears  
8. Verify confirmation text → Done

**Automation Considerations:**

- Must handle dynamic JavaScript-rendered content  
- Branch selection is critical (wrong branch \= wrong class)  
- Button text is the source of truth for availability  
- Session can timeout (need to detect and re-login)  
- Page layout may vary by branch

**Guardrails:**

- Never proceed if "RESERVED" status showing  
- Stop if wrong branch detected in dropdown  
- Halt on login failure or unexpected page  
- Skip if booking window not yet open  
- Log all actions for debugging

---

## Appendix B: Tech Stack Details

### Why These Tools?

**Next.js:**

- All-in-one (frontend \+ API routes)  
- Great developer experience  
- Free Vercel hosting  
- Server-side rendering for auth

**Supabase:**

- Instant PostgreSQL database  
- Built-in auth (saves weeks of work)  
- Row Level Security (RLS)  
- Generous free tier

**Encryption:**

- Application-level AES-256-GCM encryption (Node.js crypto module)
- Encryption key stored in environment variables
- More secure than database-level encryption (key never sent to database)
- Works on free tier (no paid Supabase Vault needed)

**Inngest:**

- Event-driven workflow engine
- Precise scheduling (not polling-based cron)
- Built-in retry logic with exponential backoff
- Generous free tier (50k events/month)
- Visual dashboard for monitoring
- TypeScript SDK with Next.js integration

**GitHub Actions:**

- Production execution environment for Puppeteer automation
- Triggered by Inngest via GitHub API (workflow_dispatch)
- Runs Puppeteer with Chrome pre-installed
- No timeout constraints (30 min max, typical runs 30-60s)
- Easy secrets management
- Screenshot artifacts on failure
- Manual triggers available for testing/debugging

**Puppeteer:**

- Industry standard for browser automation  
- Headless Chrome  
- Works in GitHub Actions  
- Rich API for DOM interaction

**Vercel:**

- Zero-config Next.js deployment  
- Automatic HTTPS  
- Edge network (fast)  
- Free for personal projects

### Free Tier Limits (More Than Enough)

- **Vercel:** 100GB bandwidth/month, 100 deployments/day (Hobby plan)
- **Supabase:** 500MB database, 50k auth users, unlimited API requests
- **Inngest:** 50,000 events/month, unlimited runs
- **GitHub Actions:** 2,000 minutes/month (triggered by Inngest, ~48-144 min/month usage)
- **Resend:** 100 emails/day (future)

**Usage Calculation (5 users × 5 classes/week = 100 bookings/month):**

**Inngest Events:**
- Initial booking attempts: 100 events/month
- Clock drift retries (worst case, 12 per booking): 1,200 events/month
- Class full retries (avg 2 per booking): 200 events/month
- Daily scheduler: 30 events/month
- **Total: ~1,530 events/month** (3% of free tier limit)

**GitHub Actions Minutes:**
- Per booking: 2-6 minutes (Puppeteer execution)
- 100 bookings/month × 3 min avg = 300 minutes/month
- **Total: ~300 minutes/month** (15% of free tier limit)

**Cost Analysis:**
- ✅ Well under all limits
- ✅ Could scale to 10-15 users before approaching limits
- ✅ **Completely FREE** (no paid services required)
- ✅ Production-grade reliability with no timeout constraints