# My Workout Scheduler \- Product Requirements Document

**Version:** 2.3  
**Product Owner:** Brock Busby  
**Last Updated:** November 13, 2025  
**Status:** Active Development (2-Week Prototype)

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
- ✅ **COMPLETED: Booking Automation System**
  - Puppeteer scripts for YMCA Daxko platform (login, navigation, class finding)
  - GitHub Actions workflow (runs every 15 minutes)
  - Parallel processing for multiple users (<60s total booking time)
  - Database integration (booking attempts tracking)
  - Error handling and screenshot capture
  - Two-step booking flow (class list → description page with checkbox selection)
  - Duplicate prevention logic (prevents re-booking already confirmed/waitlisted classes)
  - Fuzzy matching for class names (handles minor spelling variations)
  - Booking window detection (checks if window is open before attempting)
  - Timezone-aware date calculations (uses gym's local timezone)
- ⚠️ **KNOWN ISSUE: GitHub Actions Cron Reliability**
  - Cron schedules may not auto-trigger reliably for frequent intervals (every 15 minutes)
  - Manual triggers work and may help "prime" the schedule
  - Consider event-driven trigger architecture based on booking window times (backlogged)

**Major Changes from v1.0:**

- Pivoted from standalone automation script to web application  
- Scoped to 2-week prototype with minimal viable features  
- Simplified tech stack (all free tier tools)  
- Focus on core automation over polish

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

### MVP Users (n=5)

- **Primary:** Brock (Asheville YMCA, Downtown \+ Woodfin branches)  
- **Secondary:** Nicole (same gyms/branches)  
- **Additional:** Up to 3 more users
- **Characteristics:** Tech-savvy, want automation, attend recurring weekly classes, willing to use functional-over-pretty UI
- **Typical Usage:** Each user will likely have 2-5 recurring classes scheduled

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

### 3.3 Automated Booking Engine

| Feature | Description | Priority |
| :---- | :---- | :---- |
| **Scheduled Execution** | GitHub Actions runs every 15 minutes, checks for booking windows | High |
| **Browser Automation** | Puppeteer logs into gym site and completes booking flow | High |
| **Booking Logic** | Reserve if available, waitlist if full, skip if already booked | High |
| **Duplicate Prevention** | Checks if class occurrence already booked/waitlisted before attempting | High |
| **Fuzzy Matching** | Handles minor spelling variations in class names (case-insensitive) | Medium |
| **Booking Window Detection** | Verifies booking window is open before attempting (checks button tooltip/disabled state) | High |
| **Error Handling** | Detect failures, log errors, send notification | High |
| **Status Updates** | Write booking results back to database | High |

**Booking Flow:**

1. GitHub Action runs every 15 minutes  
2. Queries database: "Any classes with booking windows currently open?"  
3. For each booking due:  
   - **Duplicate Check:** Skip if class occurrence already confirmed/waitlisted  
   - Launch Puppeteer in headless mode  
   - Login with stored credentials  
   - Navigate to class schedule  
   - Verify correct branch (select from dropdown if needed)  
   - Navigate to target day schedule  
   - Find target class using fuzzy matching (day \+ time \+ class name)  
   - **Booking Window Check:** Verify window is open (button not disabled, no tooltip indicating future time)  
   - **Step 1:** Click "RESERVE" button on class list page  
   - **Step 2:** Navigate to class description page  
   - **Step 3:** Select checkbox next to user name in "Active Members" section  
   - **Step 4:** Determine if class is full (check for "Accepting Spot in WaitList" text)  
   - **Step 5:** Click final "RESERVE" or "WAITLIST" button  
   - **Step 6:** Wait for confirmation page and detect result:
     - Confirmed: "Now that reservation is complete"  
     - Waitlisted: "Now that you are in waitlist"  
   - Update database with result  
   - Send email notification

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

**3\. Automation Worker**

- **Platform:** GitHub Actions (paid tier, ~$4-8/month)  
- **Schedule:** Runs every 15 minutes via cron (`*/15 * * * *`)  
- **Tool:** Puppeteer (headless Chrome)  
- **Process:** Query DB → Launch browser → Book classes → Update DB
- **Clock Drift Handling:** Retry logic (6 attempts, 30-second intervals) if booking button not found
- **Configuration Note:** To disable automatic booking (e.g., for testing), comment out the `schedule` section in `.github/workflows/booking-automation.yml`. To re-enable, uncomment the schedule section and push the change.

**3.1 Clock Drift Handling**

To handle timing discrepancies between our system clock and the gym website clock:

- **Retry Logic:** If booking button not found (window may not be open on gym site yet), retry up to 6 times
- **Retry Interval:** 30 seconds between attempts (2-3 minute total retry window)
- **Page Refresh:** On each retry, refresh page and re-navigate to get latest state
- **Fallback:** If retries fail, next cron run (15 minutes later) will attempt again

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

### Data Flow

1. **User configures schedule** → Next.js form → Supabase DB  
2. **GitHub Action runs every 15 minutes** → Queries Supabase for due bookings  
3. **Puppeteer script executes** → Books class → Writes result to DB  
4. **Email sent** → Via Resend/SendGrid → User notified  
5. **User checks dashboard** → Next.js queries Supabase → Shows status

### Security

- Supabase Row Level Security (RLS) policies ensure users only see their own data  
- Gym credentials encrypted using application-level AES-256-GCM encryption (Node.js crypto module)
  - Encryption key stored in environment variables (never sent to database)
  - Password encrypted before storage, decrypted only when needed for automation
- GitHub Actions secrets for API keys  
- HTTPS everywhere (Vercel default)

---

## 6\. Non-Functional Requirements

| Category | Requirement | Details |
| :---- | :---- | :---- |
| **Reliability** | 90%+ uptime | Acceptable for prototype; GitHub Actions is reliable |
| **Performance** | \<60s booking latency | From registration open to booking submitted |
| **Security** | Encrypted credentials | Supabase Vault for gym passwords |
| **Scalability** | Support up to 5 users | MVP limit; free tiers handle this easily |
| **Maintainability** | Simple codebase | Prioritize readability over cleverness |
| **Cost** | Free tier (mostly) | MVP should use free tiers where possible. GitHub Actions paid tier (~$4-8/month) required for 15-minute schedule; all other services use free tier |

---

## 7\. Implementation Timeline (2 Weeks)

### Week 1: Core Functionality

**Days 1-2: Setup & Auth**

- [x] Create Next.js project  
- [x] Set up Supabase project  
- [x] Connect Supabase Auth  
- [x] Build login/signup pages  
- [ ] Deploy to Vercel

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
- [x] Implement two-step booking flow (class list → description page with checkbox)
- [x] Add duplicate prevention logic
- [x] Implement fuzzy matching for class names
- [x] Add booking window detection
- [x] Implement timezone-aware date calculations

### Week 2: Automation & Polish

**Days 8-10: GitHub Actions Scheduler** ✅ COMPLETE

- [x] Create GitHub Action workflow  
- [x] Set up 15-minute cron trigger (`*/15 * * * *`)  
- [x] Query Supabase for due bookings  
- [x] Run Puppeteer in GitHub Actions  
- [x] Write results back to database  
- [x] Test end-to-end automation with parallel processing
- [x] Document GitHub Actions cron reliability issues

**Days 11-12: Dashboard & Notifications**

- [ ] Build status dashboard page  
- [ ] Show booking history (last 30 days)  
- [ ] Set up email service (Resend/SendGrid)  
- [ ] Send booking confirmation emails  
- [ ] Send failure alert emails

**Days 13-14: Testing & Launch**

- [ ] Test with up to 5 user accounts  
- [ ] Real booking attempts for upcoming classes (2-5 classes per user)  
- [ ] Fix any critical bugs  
- [ ] Document setup for additional users  
- [ ] Verify free tier limits are sufficient  
- [ ] Launch MVP

---

## 8\. Out of Scope (Prototype)

### Deferred to Post-Prototype

- ❌ Pretty UI design (functional only for now)  
- ❌ Mobile app (responsive web works)  
- ❌ Calendar view (list view sufficient)  
- ❌ Multi-branch fallback logic  
- ❌ Manual "Book Now" button  
- ❌ SMS notifications  
- ❌ Advanced analytics dashboard  
- ❌ Scraping gym site for class listings  
- ❌ Support for multiple gym systems  
- ❌ Social features  
- ❌ Payment processing  
- ❌ Class cancellation detection

### Constraints

- MVP limited to 5 users  
- Each user typically has 2-5 recurring classes scheduled  
- Manual class schedule entry (no auto-import)  
- Email notifications only  
- Single gym system (YMCA Daxko platform)  
- Basic error handling (manual retry required)  
- Functional UI (not polished design)  
- Free tier services where possible (GitHub Actions paid tier exception for frequent scheduling)

---

## 9\. Success Criteria (MVP Launch)

### Must Have ✅

- Up to 5 users can create accounts and log in  
- Users can add/edit/delete recurring classes (2-5 classes per user typical)  
- GitHub Action runs on schedule and attempts bookings  
- System books at least 1 class successfully for each user  
- Users receive email notifications  
- Dashboard shows accurate booking status  
- No security vulnerabilities (credentials encrypted)  
- MVP runs on free tier services (GitHub Actions paid tier exception acceptable)

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
| GitHub Actions timeout (6hr limit) | Medium | Each booking takes \<5 min; fine for up to 5 users |
| GitHub Actions cron reliability | Medium | Cron schedules may not auto-trigger reliably for frequent intervals (every 15 minutes). Manual triggers work and may help "prime" the schedule. Consider event-driven trigger architecture based on booking window times (backlogged) |
| Gym website changes layout | High | Version selectors, alert on failures, manual fix |
| Puppeteer fails in GitHub Actions | High | Test thoroughly, add detailed logging |
| Free tier limits exceeded | Low | Up to 5 users with 2-5 classes each well under all limits |
| Timezone calculation errors | Medium | Use date-fns-tz, thorough testing |
| Concurrent booking conflicts | Low | Up to 5 users booking different times/branches |
| Duplicate bookings | Low | Duplicate prevention logic checks if class occurrence already booked/waitlisted before attempting |

---

## 11\. Future Enhancements (Post-Prototype)

### Phase 2 (Weeks 3-4)

- Polish UI design with better styling  
- Multi-branch fallback logic  
- Manual "Book Now" trigger button  
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

- [x] What's the exact timing window for YMCA bookings? (Test and document) - **ANSWERED:** Booking windows are configurable per class (e.g., 26 hours prior). System checks if window is open before attempting (button disabled/tooltip indicates future time).  
- [x] Should waitlist be automatic or require confirmation? - **ANSWERED:** Waitlist is automatic. System detects if class is full and automatically joins waitlist.  
- [ ] Do we need to handle class cancellations from gym side?  
- [ ] What happens if multiple users book the same class/time? (Unlikely but possible) - **NOTE:** Duplicate prevention logic prevents re-booking, but doesn't prevent different users from booking the same class  
- [ ] What's the best solution for GitHub Actions cron reliability? (Event-driven triggers? Different scheduling service?)

---

## Appendix A: YMCA Booking Flow (Daxko Platform)

**Target URL:** `https://ops1.operations.daxko.com/Online/4032/GXP/ClassSchedule.mvc`

**Manual Booking Steps (Two-Step Process):**

1. Navigate to URL → Login page appears  
2. Enter username/password → Submit  
3. Select branch from dropdown (e.g., "Asheville \- Downtown")  
4. Navigate to class schedule for target day  
5. Find target class (e.g., "BODYPUMP 4:15 PM")  
6. **Step 1:** Check button text on class list page:  
   - "RESERVE" → Click to proceed (button may be disabled with tooltip "Reservation starts at [DATE] at [TIME]" if window not open)  
   - "RESERVED" → Already booked, stop  
   - "FULL" → No action available  
7. **Step 2:** After clicking "RESERVE", navigate to class description page  
8. **Step 3:** On description page, locate "Active Members" section  
9. **Step 4:** Select checkbox next to user's name  
10. **Step 5:** Check if class is full (look for "Accepting Spot in WaitList" text)  
11. **Step 6:** Click final button:
    - "RESERVE" → If class has spots available  
    - "WAITLIST" → If class is full (button text may still say "RESERVE" but page indicates waitlist)  
12. **Step 7:** Confirmation page appears with one of:
    - **Confirmed:** "Now that reservation is complete"  
    - **Waitlisted:** "Now that you are in waitlist"  
13. Verify confirmation text → Done

**Automation Considerations:**

- Must handle dynamic JavaScript-rendered content  
- Branch selection is critical (wrong branch \= wrong class)  
- Two-step booking process requires navigation between pages  
- Checkbox selection is required before final booking button  
- Final button text may not change for waitlist scenarios (check page text instead)  
- Confirmation page text is the source of truth for booking status  
- Session can timeout (need to detect and re-login)  
- Page layout may vary by branch  
- Booking window detection: Check if "RESERVE" button is disabled or has tooltip indicating future time

**Guardrails:**

- Never proceed if "RESERVED" status showing  
- Stop if wrong branch detected in dropdown  
- Halt on login failure or unexpected page  
- Skip if booking window not yet open (button disabled or tooltip shows future time)  
- Skip if class occurrence already booked/waitlisted (duplicate prevention)  
- Verify checkbox is selected before clicking final button  
- Use confirmation page text (not button text) to determine waitlist vs. confirmed  
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

**GitHub Actions:**

- Free for public repos (paid tier required for frequent cron schedules)  
- Cron scheduling (may be unreliable for frequent intervals like every 15 minutes; manual triggers work as workaround)  
- Runs Puppeteer headless  
- Easy secrets management  
- No separate server needed

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

- Vercel: 100GB bandwidth/month  
- Supabase: 500MB database, 50k auth users  
- GitHub Actions: 2,000 minutes/month (free tier) - **Note:** 15-minute schedule requires paid tier (~$4-8/month)  
- Resend: 100 emails/day

With up to 5 users, each booking 2-5 classes/week (average 3 classes/user) \= \~15 classes/week total \= \~60 bookings/month:

- ✅ Well under all limits  
- ✅ Free tier services sufficient for MVP  
- ✅ Could scale to 10-20 users if needed (may require paid tiers)