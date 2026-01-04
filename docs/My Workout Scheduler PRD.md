# My Workout Scheduler \- Product Requirements Document

**Version:** 2.21
**Product Owner:** Brock Busby
**Last Updated:** January 4, 2026
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
- ✅ **COMPLETED: Booking Window Detection with Fast Retry Loop (v2.7)**
  - Detects disabled RESERVE buttons (booking window not yet open)
  - Extracts button disabled states and tooltip messages
  - Fast retry loop: 9 attempts × 5s = 45s coverage of critical first minute
  - **Optimized timing (v2.10)**: Checks immediately after detection, then waits only if still disabled
  - Catches window opening up to 5 seconds faster (immediate retry after detection)
  - Page reload and re-check every 5 seconds until window opens
  - Breaks immediately when booking window opens
  - Meets <60s booking KPI even with early triggers
  - Priority order: reserved > disabled button > cancelled > not reservable > full > available
  - Prevents "Booking result unclear" errors
- ✅ **COMPLETED: Retry Architecture Simplification (v2.10)**
  - Removed outer retry loop (3×15s) - complexity reduction
  - Single retry strategy: Fast retry (9×5s) in Puppeteer + Class full retry (15min) in Inngest
  - Re-navigate to correct day after page reload (fixes day navigation bug)
  - Prevent outer retry loop for "booking window not open" errors (infinite loop fix)
  - Cleaner code: -74 lines, simpler logic, easier debugging
- ✅ **COMPLETED: Failure Scenarios Audit (v2.10)**
  - Comprehensive audit of all 16 failure scenarios
  - Documented retry behavior for each failure type
  - Error message catalog with root causes and user actions
  - Identified need for user-friendly error messages and notification system
  - See `docs/FAILURE_SCENARIOS_AUDIT.md` for complete reference
- ✅ **COMPLETED: Error Messaging & User Notifications Design (v2.10)**
  - Rewrote all 16 error messages in user-friendly language
  - Categorized errors by action needed (no action / action recommended / action required)
  - Created comprehensive notification system design with email templates
  - Designed daily digest feature for batched notifications
  - Updated booking-automation.ts with improved error messages
  - Implementation-ready documentation for future notification system
  - See `docs/ERROR_MESSAGES.md`, `docs/NOTIFICATIONS_DESIGN.md`, `docs/NOTIFICATIONS_IMPLEMENTATION.md`
- ✅ **COMPLETED: Skip Functionality Database Migration Fix (v2.11)**
  - Fixed migration 004 for skip functionality with proper DATE/TIME type casting
  - Migrated from single-field `next_skip_date` (DATE) to two-field approach
  - New fields: `skip_next_occurrence` (boolean flag) + `skip_target_datetime` (timestamptz)
  - Simplified business logic: boolean check instead of date comparison (eliminates timezone bugs)
  - Clear separation: flag for backend logic, datetime for UI display with timezone formatting
  - Lifecycle: flag cleared immediately after skip, datetime cleared at next booking attempt
  - Database migration now handles PostgreSQL DATE and TIME types correctly with `::TEXT` casting
- ✅ **COMPLETED: User Profile Management (v2.8)**
  - Email update with password verification and email confirmation
  - Password change with current password verification
  - Account deletion with two-step confirmation
  - Email verification notifications (success/error messages)
  - Support for Supabase "Double Confirm Email Changes" setting
  - Comprehensive documentation for email configuration
- ✅ **COMPLETED: Authentication Security & UX Improvements (v2.9)**
  - Password confirmation field on signup page (prevents typo lockouts)
  - Resend verification feature on login page (unverified email recovery)
  - Bot protection with Cloudflare Turnstile (prevents automated signups)
  - Persistent notifications (no auto-dismiss, user-controlled dismissal only)
  - Email change verification notifications (context-aware messaging)
  - Consistent 1-hour expiration across all auth links
  - Fixed Turnstile duplicate widget rendering in React Strict Mode
  - Auth workflow grade: A- (up from B+)

**Major Changes from v1.0:**

- Pivoted from standalone automation script to web application
- Scoped to 2-week prototype with minimal viable features
- Simplified tech stack (all free tier tools)
- Focus on core automation over polish
- **v2.3:** Migrated to event-driven architecture for better reliability and cost savings
- **v2.4:** Production deployment with Inngest → GitHub Actions hybrid architecture
- **v2.5:** Production testing complete, retry logic validated, removed artificial max retry limits
- **v2.6:** Enhanced class status detection with fuzzy matching and badge/pill detection
- **v2.7:** Booking window detection with fast retry loop (disabled button detection)
- **v2.8:** User profile management with email verification and account controls
- **v2.9:** Authentication security improvements with bot protection and better UX
- **v2.10:** Error messaging improvements and notification system design
  - Rewrote all error messages in user-friendly language
  - Categorized errors by action needed (no action / recommended / required)
  - Designed comprehensive email notification system with templates
  - Created implementation-ready documentation for future rollout
- **v2.11:** Skip functionality database migration fix
  - Fixed migration 004 for proper DATE/TIME type casting in PostgreSQL
  - Migrated from single-field to two-field skip approach (boolean flag + timestamptz)
  - Simplified business logic and eliminated timezone bugs in skip checks
  - Clear lifecycle: flag cleared after skip, datetime cleared at next booking attempt
- **v2.12:** Skip functionality enhancements
  - Skip edit confirmation modal prevents accidental skip removal when changing schedule
  - Three-zone cleanup logic for intelligent pause/inactive interaction
  - Disabled skip buttons with helpful tooltips when paused or inactive
  - Time-based skip field management (preserve future skips, clear past skips)
- **v2.20:** Email handling UX improvements
  - Hedged messaging on verify-email page (handles existing email gracefully)
  - "Already have an account?" section with sign-in guidance
  - 1-hour link expiration notice
  - Duplicate email detection on profile email change with warning alert
- **v2.21:** NextClassCard logic improvements
  - Filters out inactive classes (empty state when no active classes)
  - Skipped classes show occurrence 7 days later (user IS going, just not this week)
  - Countdown threshold changed: hours until 48h, then days (matches human time perception)
  - Day rounding uses Math.round (88 hours = 4 days, not 3)
  - Booking status only shows for current occurrence (fixes stale status from previous week)
- ✅ **COMPLETED: UX/UI Refresh & Design System v2 (v2.13)**
  - Complete design system with editorial diagonal-cut design language
  - **15 reusable UI components** in `components/ui/`:
    - Core: Button, Badge, Card, Modal
    - Form: Input, Select, Checkbox, FormField
    - Navigation: DropdownMenu, Tabs (with TabPanel)
    - Feedback: Toast, Skeleton (+ SkeletonCard, SkeletonClassCard presets)
    - Display: StatusIndicator, StatCard
  - Typography: **Sora** (headings) + **DM Sans** (body) - fresher than generic AI fonts
  - Extended Tailwind config with design tokens: colors, gradients, shadows, clip-paths
  - Prototype pages for visual reference:
    - `/dashboard/prototype` - Design system showcase
    - `/dashboard/prototype/scheduler-v2` - Scheduler redesign
    - `/dashboard/prototype/design-system-components` - Component showcase
  - **Use `/frontend-design` skill** for any new visual design work (UI, emails, components)
  - Email templates follow design system colors and aesthetic
  - Component documentation (DESIGN_SYSTEM.md, COMPONENT_LIBRARY.md)
- ✅ **COMPLETED: Immediate scheduling on unpause, activate, and unskip (v2.13)**
  - Silent scheduling: Classes with future booking windows scheduled automatically in background
  - User prompts: "Book Now" dialogs for classes with already-open booking windows
  - Prevents missed bookings when user actions occur between now and midnight UTC
  - Consistent UX: All three scenarios (unpause/activate/unskip) use same dialog pattern
  - Sequential dialogs: Multiple classes with open windows presented one-by-one with progress indicator
  - Real-world fix: User unpauses Sunday 11:30 AM → event scheduled for Monday 2:15 PM → booking succeeds
- ✅ **COMPLETED: Email Handling UX Improvements (v2.20)**
  - **Signup with existing email:** Hedged messaging prevents email enumeration while improving UX
    - "Check your inbox" headline (not "We sent an email")
    - "If this is a new account..." conditional language
    - "Already have an account?" section with "Sign in instead" button
    - Collapsible troubleshooting tips
    - 1-hour link expiration notice with clock icon
  - **Profile email change:** Duplicate email detection with user-friendly warning
    - Catches Supabase duplicate email errors
    - Shows amber warning alert (not error) for duplicate emails
    - Clear message: "This email is already associated with another account"
  - Balances security (no email enumeration on signup) with UX (clear feedback when authenticated)

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

| Feature | Description | Priority | Status |
| :---- | :---- | :---- | :---- |
| **Account Creation** | Email/password registration via Supabase Auth | High | ✅ |
| **Login** | Basic login page | High | ✅ |
| **Credential Storage** | Securely store gym website login credentials (Supabase encrypted) | High | ✅ |
| **Gym Configuration** | Set gym URL and default branch | High | ✅ |
| **Profile Management** | Update email, password, and account settings | High | ✅ |
| **Email Update** | Change email with password verification and email confirmation | High | ✅ |
| **Password Update** | Change password with current password verification | High | ✅ |
| **Account Deletion** | Delete account with two-step confirmation and password verification | Medium | ✅ |
| **Email Verification Notifications** | Show success/error messages after email verification | Medium | ✅ |
| **Password Confirmation** | Confirm password on signup to prevent typo lockouts | High | ✅ |
| **Resend Verification on Login** | Resend verification email from login page for unverified accounts | High | ✅ |
| **Bot Protection** | Cloudflare Turnstile captcha on signup page | High | ✅ |
| **Persistent Notifications** | User-controlled dismissal for all auth notifications | Medium | ✅ |
| **Existing Email Handling** | Hedged messaging on verify-email page for signup with existing email | High | ✅ |
| **Duplicate Email Detection** | Warning alert when changing email to one already in system | High | ✅ |

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
| **Skip Next Occurrence** | Skip a single upcoming class with edit confirmation and intelligent pause/inactive cleanup | High | ✅ |

#### 3.2.1 Skip Functionality Details

**Skip Edit Confirmation**

When editing a class with an active skip:
- Changing **day_of_week** or **class_time** triggers confirmation modal
- Modal displays formatted skip date being cleared (e.g., "Mon, Dec 2")
- User must explicitly click "Continue" to proceed
- Prevents accidental skip removal during schedule changes
- Two-pass server action pattern: first call returns warning, second call with `confirmSkipClear=true` clears skip
- Modal appears BEFORE booking window check

**Skip Cleanup with Pause/Inactive (Three-Zone Logic)**

Intelligent skip field management when pausing or deactivating:

**Zone A (Before Booking Window):**
- Condition: `now < booking_window_open_time`
- Action: Preserve both `skip_next_occurrence` and `skip_target_datetime`
- Rationale: Future skip still valid, user may unpause/reactivate before window

**Zone B (Inside Booking Window):**
- Condition: `booking_window_open_time <= now < class_time`
- Action: Clear `skip_next_occurrence` flag only, keep `skip_target_datetime` for UI
- Rationale: Scheduled trigger time passed (no automatic booking), clear flag so manual booking can proceed

**Zone C (Past Class Time):**
- Condition: `class_time <= now`
- Action: Clear both fields completely
- Rationale: Data hygiene - occurrence already passed

**UI Behavior:**
- Skip buttons disabled when schedule paused or class inactive
- Tooltips explain why: "Cannot skip while schedule is paused" or "Cannot skip inactive class"
- Skip badge remains visible but cancel (×) button disabled

**Example Configuration:**

- Monday 4:15 PM BODYPUMP @ Downtown YMCA (books 26 hours prior)
- Wednesday 4:15 PM BODYPUMP @ Downtown YMCA (books 26 hours prior)
- Saturday 9:30 AM BODYPUMP @ Downtown YMCA (books 26 hours prior)

#### 3.2.2 Immediate Scheduling (v2.13)

**Problem Solved:**
Users could miss bookings if they unpause, activate a class, or remove a skip between the current time and midnight UTC (when the daily scheduler runs).

**Real-world example:**
- Sunday 11:30 AM: User unpauses schedule
- Sunday 2:15 PM: Booking window opens for Monday 4:15 PM class
- Before v2.13: Nothing scheduled until midnight UTC → booking missed ❌
- With v2.13: Event scheduled immediately at 11:30 AM → booking succeeds at 2:15 PM ✓

**How It Works:**

**Silent Scheduling (No User Interaction):**
- When booking window is NOT yet open (future)
- System calls `scheduleBooking()` silently in background
- User sees no dialogs, classes scheduled automatically
- Common case: Most schedules don't have open booking windows

**User Prompts (Book Now Dialogs):**
- When booking window IS already open
- System shows "Book Now" dialog with class details
- User chooses: "Yes, Book Now" (triggers immediate booking) or "Skip This Week" (no action)
- Dialog includes: Class type, day, time, branch (e.g., "BODYPUMP - Monday 4:15 PM @ Downtown YMCA")

**Three Trigger Scenarios:**

1. **Global Unpause** (`updateSchedulePaused(false)`)
   - Checks all active classes
   - Schedules classes with future windows silently
   - Shows sequential dialogs for classes with open windows
   - Progress indicator: "Class 1 of 3" when multiple dialogs

2. **Individual Class Activate** (`toggleRecurringClassActive(true)`)
   - Checks single class booking window
   - Silent schedule or single dialog based on window status

3. **Skip Removal** (`setSkipNextOccurrence(null)`)
   - Checks single class booking window (only if class is active)
   - Silent schedule or single dialog based on window status

**Duplicate Prevention:**
- `scheduleBooking()` sends `booking/cancel` event FIRST
- Cancels any existing event for that class+date combination
- Then sends new `booking/attempt` event
- Only one event exists per class+date at any time

**Error Handling:**
- Scheduling failures don't break user actions
- Errors logged to console but don't throw
- Daily scheduler at midnight UTC provides fallback safety net

**Implementation:**
- Backend: `app/actions/user-settings.ts`, `app/actions/recurring-classes.ts`
- Frontend: `components/PauseToggle.tsx`, `components/SkipButton.tsx`, `components/ScheduleList.tsx` (activate), `components/RecurringClassForm.tsx` (existing dialog updated)
- Scheduling: Uses existing `scheduleBooking()` and `calculateBookingWindowOpen()` from `lib/inngest/scheduler.ts`

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
| **Immediate Scheduling** | Schedule bookings immediately on unpause/activate/unskip (silent or user prompt) | High | ✅ |

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

### 3.4 Dashboard & Monitoring ✅ ENHANCED (v2.13)

| Feature | Description | Priority | Status |
| :---- | :---- | :---- | :---- |
| **Rich Dashboard Overview** | Stat widgets, upcoming classes, recent activity, action items | High | ✅ |
| **Upcoming Classes View** | Next 7 days with booking status badges | High | ✅ |
| **Booking Status Badges** | Visual indicators: Confirmed, Pending, Waitlisted, Failed, Skipped | High | ✅ |
| **Quick Stats** | Classes this week, active classes, success rate, action items count | High | ✅ |
| **Recent Activity Timeline** | Last 5 booking attempts with results | High | ✅ |
| **Action Items** | Failed bookings and credential issues requiring attention | High | ✅ |
| **Email Notifications** | Designed and ready for integration (Phase 4) | High | 🔜 |
| **Basic History** | Show last 30 days of booking attempts | Medium | 📋 |

### 3.5 What's NOT Included / Future Enhancements

- ✅ ~~Pretty design (functional Bootstrap/Tailwind only)~~ → **COMPLETED in v2.13** (Modern fitness app design system)
- ❌ Calendar view (currently list view with next booking dates)
- ❌ Manual trigger buttons (edit schedule to retry)
- ❌ Multi-branch fallback (add to v2)
- ❌ Advanced error recovery (manual intervention required)
- ❌ Mobile app (responsive web only)
- ❌ Class listing scraper (manual entry for now)
- 🔜 Email notifications (designed in v2.13, ready for integration)

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
  skip\_next\_occurrence (boolean),  -- Flag checked by Inngest; cleared by pause/inactive based on three-zone logic
  skip\_target\_datetime (timestamptz),  -- Full datetime for UI; preserved in Zone B, cleared in Zone C
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

## 6.5. Inngest Function Configuration Sync (CRITICAL for Development)

When modifying Inngest function configurations (especially `cancelOn` patterns, retries, or any function metadata), Inngest must be manually synced to pick up changes:

**Problem:** Code changes deployed to Vercel are not automatically reflected in Inngest's cached function definitions. Old function configurations may persist in Inngest until manually synced.

**Solution - After updating any Inngest function in `lib/inngest/functions.ts`:**

1. **Deploy code to Vercel** (via `git push`)
2. **Verify Vercel deployment** is complete and marked "Ready"
3. **Manually sync Inngest:**
   - Navigate to Inngest Dashboard → Apps section
   - Find your application (your Vercel deployment)
   - Locate the "Sync" or refresh button
   - Click to force Inngest to fetch latest function definitions
   - Wait for sync to complete (usually 10-30 seconds)
4. **Verify changes took effect** before testing new functionality

**Why this matters:** Function configuration changes (like `cancelOn` CEL expressions) won't be active until Inngest syncs. Runs created before sync will have the old configuration embedded. Always clear old runs after deploying function config changes.

**Automatic sync:** Inngest typically auto-syncs within 5-10 minutes, but manual sync ensures immediate update for testing.

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

**Design System v2 & Component Library (v2.13):**

- **Tailwind CSS Extended:** Design tokens for colors, gradients (`bg-gradient-primary`), shadows (`shadow-card`), clip-paths (`clip-diagonal-badge`)
- **Component Library:** **15 reusable UI components** in `components/ui/`:
  - Core: Button, Badge, Card, Modal
  - Form: Input, Select, Checkbox, FormField
  - Navigation: DropdownMenu, Tabs (with TabPanel)
  - Feedback: Toast, Skeleton (+ SkeletonCard, SkeletonClassCard presets)
  - Display: StatusIndicator, StatCard
- **Typography:** Sora (headings) + DM Sans (body) - editorial, non-generic aesthetic
- **Visual Language:** Diagonal-cut badges, rounded buttons, corner-clipped cards
- **Colors:** Primary (#1a6fff), Success (#00c853), Warning (#ff9500), Danger (#f43f5e), Purple (#8B5CF6)
- **Component Documentation:** `docs/DESIGN_SYSTEM.md` and `docs/COMPONENT_LIBRARY.md`
- **Prototype Pages:** `/dashboard/prototype`, `/scheduler-v2`, `/design-system-components`
- **Frontend Design Skill:** Use `/frontend-design` for any new visual work (UI, emails, components)
- **Benefits:** Eliminates duplicate implementations, ensures UI consistency, faster feature development
- **Responsive:** Desktop-first with mobile optimization
- **Accessible:** WCAG AA compliant, keyboard navigation, proper ARIA labels

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