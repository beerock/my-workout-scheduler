# Backlog

This document contains features and improvements that are planned for future implementation.

---

## 🚀 Pre-Launch Requirements

**⚠️ BEFORE LAUNCHING TO PRODUCTION:** Complete all items below

### Configuration & Infrastructure
See [PRE_LAUNCH_CHECKLIST.md](PRE_LAUNCH_CHECKLIST.md) for system configuration, rate limits, environment variables, and testing.

**Status:** 🚧 NOT PRODUCTION READY

---

### Pre-MVP Development Tasks

**These features/tasks require code implementation before MVP launch:**

1. **Password Security Requirements** (BACKLOG line ~2603)
   - **Status:** PRE-MVP - MUST COMPLETE BEFORE LAUNCH
   - **Priority:** High (security requirement)
   - **Summary:** Implement industry-standard password requirements (currently only requires 8 chars)
   - **Location:** See "Password Security Improvements (v2.10)" section below

2. **Contact/Support Form** (BACKLOG line ~3028)
   - **Status:** PRE-MVP - MUST COMPLETE BEFORE LAUNCH
   - **Priority:** High (required for user support and trust)
   - **Summary:** Add help@beerock.com contact form or direct email link
   - **Location:** See "Add Contact/Support Form Page" section below

3. **Skip/Pause Interaction Behavior** (BACKLOG line ~3604)
   - **Status:** PRE-MVP - MUST DETERMINE BEFORE LAUNCH
   - **Summary:** Define behavior when skip_next_occurrence interacts with pause/unpause
   - **Location:** See "Skip Next Interaction with Pause/Unpause" section below

4. **Three-Zone Skip Cleanup Testing** (BACKLOG line ~3918)
   - **Status:** PRE-MVP - PRODUCTION TESTING REQUIRED
   - **Priority:** High (must verify before MVP launch)
   - **Summary:** Test skip cleanup logic in production with real time-based zones
   - **Location:** See "Test Three-Zone Skip Cleanup Logic" section below

5. **Review Support Email** (BACKLOG line ~4252)
   - **Status:** PRE-MVP - MUST REVIEW BEFORE LAUNCH
   - **Priority:** Low (quick review, not blocking)
   - **Summary:** Confirm help@beerock.com is correct or update if needed
   - **Location:** See "Review Support Email Before MVP Launch" section below

**Note:** This list is maintained manually. When adding new pre-MVP development tasks to the backlog, add them to this section AND mark the full section with "PRE-MVP" status.

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
- Vercel: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_REPOSITORY`
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

## Booking Automation Improvements

### Early Exit on Page Load Failure

#### Overview
Currently, when the schedule page fails to load after a reload during the fast retry loop, the automation continues attempting to search for the class. This could lead to incorrect results or wasted retry attempts on incomplete data.

#### Current Behavior
- Fast retry loop reloads page every 5 seconds
- If schedule doesn't load within 10 seconds, a warning is logged
- Automation continues with potentially incomplete data
- Class search might fail or return incorrect results

#### Proposed Behavior
- Detect when schedule fails to load after reload
- Break out of retry loop early with specific error
- Avoid searching on incomplete page data
- Return clear error message indicating page load failure

#### Benefits
- Prevents false negatives (missing classes due to incomplete page load)
- Saves retry attempts for actual checks
- Clearer error messages for debugging
- Better handling of network issues

#### Implementation Notes
- Location: `scripts/booking-automation.ts` around line 1432-1443
- Add counter for consecutive page load failures
- Break after 2-3 consecutive failures
- Return specific error: "Schedule page failed to load after multiple attempts"

#### Status
**Status**: Backlogged - Nice-to-have improvement
**Priority**: Low
**Last Updated**: November 27, 2025

---

### Exponential Backoff for Outer Retry Loop

#### Overview
The outer retry loop (handles cases like class not found, network issues) currently uses fixed 15-second intervals between retries. Implementing exponential backoff could improve resource usage and handle transient failures more gracefully.

#### Current Behavior
- Outer retry loop: 3 attempts with 15-second fixed delay
- Timeline: 0s → 15s → 30s (total 30 seconds)
- Same delay regardless of failure type
- Located in `scripts/booking-automation.ts` around line 148-154

#### Proposed Behavior
- Use exponential backoff: 15s → 30s → 60s
- Timeline: 0s → 15s → 45s (total 45 seconds)
- Adjust delay based on failure type (optional):
  - Network errors: longer delays
  - Class not found: shorter delays

#### Benefits
- Better handling of transient network issues
- Reduces load on gym website during issues
- More sophisticated retry strategy
- Industry best practice for retry logic

#### Implementation Notes
- Simple approach: Multiply delay by 2 each retry
- Formula: `delay = baseDelay * Math.pow(2, retryAttempt)`
- Example: 15s × 2^0 = 15s, 15s × 2^1 = 30s, 15s × 2^2 = 60s
- Consider max delay cap (e.g., 60 seconds)

#### Code Location
```typescript
// Current (scripts/booking-automation.ts ~line 154)
const retryDelay = 15000 // Fixed 15 seconds

// Proposed
const baseDelay = 15000
const retryDelay = baseDelay * Math.pow(2, attempt)
```

#### Status
**Status**: Backlogged - Nice-to-have optimization
**Priority**: Low
**Last Updated**: November 27, 2025

---

### Booking Performance Metrics

#### Overview
Add instrumentation to track booking performance metrics, helping optimize retry logic and identify bottlenecks. This will provide data-driven insights for future improvements.

#### Proposed Metrics

**Timing Metrics:**
- Time from trigger to booking window opening
- Time from window opening to successful booking
- Average time spent in fast retry loop
- Page load times during retries

**Retry Metrics:**
- Number of fast retries before window opens
- Number of outer retries before success/failure
- Success rate by retry attempt number
- Percentage of bookings needing retries

**Detection Metrics:**
- Frequency of disabled button detection
- Frequency of class full detection
- Frequency of class not found
- Cancelled/not reservable class frequency

**Outcome Metrics:**
- Overall booking success rate
- Waitlist vs confirmed booking ratio
- Failure reasons (categorized)
- Time of day distribution for failures

#### Implementation Approaches

**Option A: Database Table**
```sql
CREATE TABLE booking_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_attempt_id UUID REFERENCES booking_attempts(id),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT, -- 'seconds', 'count', 'boolean'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Option B: Enhanced booking_attempts Table**
```sql
ALTER TABLE booking_attempts ADD COLUMN metrics JSONB;
-- Example: {"retry_count": 3, "time_to_book_ms": 15234, "page_loads": 4}
```

**Option C: Application Logging**
- Enhanced console.log with structured JSON
- Parse logs for analysis
- Use existing Inngest/GitHub Actions logs
- No database changes needed

#### Data to Capture

```typescript
interface BookingMetrics {
  // Timing
  trigger_time: string
  window_open_time: string | null
  booking_complete_time: string
  total_duration_ms: number

  // Retries
  fast_retry_count: number
  fast_retry_duration_ms: number
  outer_retry_count: number

  // Detection
  disabled_button_detected: boolean
  class_full_detected: boolean
  class_cancelled_detected: boolean

  // Page loads
  page_reload_count: number
  avg_page_load_ms: number
  schedule_load_failures: number
}
```

#### Benefits
- Identify optimal retry intervals through real data
- Detect patterns in booking success/failure
- Optimize fast retry loop parameters (count, interval)
- Better understanding of gym website behavior
- Support data-driven decision making

#### Implementation Notes
- Start simple: Add basic timing metrics to booking_attempts JSONB column
- Instrument key points in booking-automation.ts
- Add metrics collection without changing core logic
- Store metrics in booking_attempts.metadata or new metrics column
- Create dashboard view later (post-MVP)

#### Status
**Status**: Backlogged - Planned before MVP release
**Priority**: Medium (valuable for optimization)
**Last Updated**: November 27, 2025
**Note**: User plans to implement before MVP release

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

## User Troubleshooting Guide

### Overview
Create comprehensive user-facing documentation to help users diagnose and fix common booking failures. This guide would be linked from error messages and dashboard to provide self-service support.

### Context
From failure scenarios audit (v2.10), we identified 16 different failure types. Many have simple fixes (typos in class name, wrong time, etc.) but users currently don't know how to debug these issues.

### Requirements

**1. Common Failure Scenarios Section**
For each of the 16 failure types, provide:
- What this error means (plain language)
- Why it happens (common causes)
- How to fix it (step-by-step)
- When to contact support

**2. Self-Service Debugging Tools**
- Class name validator (check if class exists on gym website)
- Time zone checker (verify class time in your timezone)
- Booking window calculator (show when window opens)
- Credentials tester (verify gym login works)

**3. Quick Fixes Checklist**
```markdown
Before contacting support, check:
□ Class name matches gym website exactly (case-sensitive)
□ Class time is correct (AM/PM, timezone)
□ Day of week is correct
□ Branch name is accurate
□ Your gym credentials are up to date
□ Class hasn't been cancelled by gym
```

**4. Screenshots & Examples**
- Show gym website screenshots with labels
- Point out where to find class name, time, branch
- Example of correct vs incorrect configuration

### Proposed Sections

**Troubleshooting Guide Structure:**
1. Introduction (how to use this guide)
2. Quick Fixes Checklist
3. Common Errors by Category
   - Configuration Errors (class not found, wrong time, wrong branch)
   - Credential Issues (login failed, password changed)
   - Temporary Failures (class full, booking window not open)
   - Permanent Failures (class cancelled, not reservable)
4. Self-Service Tools
5. When to Contact Support
6. FAQ

### Implementation Notes

**Location:** Create `docs/USER_TROUBLESHOOTING_GUIDE.md`

**Link from:**
- Error messages (include URL to specific section)
- Dashboard help button
- Email notifications (future)
- 404/error pages

**Dependencies:**
- Failure scenarios audit (completed in v2.10)
- Error message improvements (future session)
- User notifications system (future)

### Example Entry

```markdown
### Error: "Class not found on schedule"

**What this means:**
We couldn't find your class when searching the gym's class schedule. This usually means there's a small difference between your configuration and what the gym website shows.

**Common causes:**
• Class name has a typo or different spelling
• Class time is incorrect (AM/PM mix-up)
• Wrong day of week selected
• Wrong branch selected

**How to fix:**
1. Go to your gym's website and find the class
2. Copy the exact class name (including capitalization)
3. Note the exact time (verify AM/PM)
4. Verify the day and branch
5. Update your recurring class in the dashboard
6. Try booking again

**Still not working?**
Check our [Class Name Examples](#class-name-examples) or [contact support](#support).
```

### Benefits
- Reduces support burden (users can self-serve)
- Faster problem resolution (no wait for support)
- Better user experience (empowering vs frustrating)
- Lower churn (users don't give up due to confusion)

### Status
**Status**: Backlogged - Recommended after error messaging improvements
**Priority**: Medium (post-MVP, but important for UX)
**Dependencies**: Error messaging improvement session, failure scenarios audit
**Last Updated**: November 28, 2025
**Estimated Effort**: 4-6 hours (writing + examples + screenshots)

---

## Retry Status Indicators in Dashboard

### Overview
Show real-time retry status in the dashboard so users know when the system is actively retrying a booking and when they need to take action. Currently, users must guess whether failures are temporary or permanent.

### Context
From failure scenarios audit (v2.10):
- 2 scenarios trigger automatic retries (booking window not open, class full)
- 14 scenarios fail immediately (permanent failures)
- Users have no visibility into which category their failure falls into

### Requirements

**1. Status Badge on Booking History**
```
✅ Confirmed          (green badge)
⏳ Retrying           (yellow badge, animated)
❌ Failed - Action Needed  (red badge)
⏭️ Skipped            (gray badge)
```

**2. Retry Information Panel**
When status is "Retrying", show:
- What we're retrying for (e.g., "Class is full - waiting for spots to open")
- Retry schedule (e.g., "Checking every 15 minutes")
- Next retry time (e.g., "Next attempt: Friday 3:45 PM")
- Time remaining (e.g., "Will retry until class starts (2h 15m remaining)")
- Attempts so far (e.g., "Attempt 3 of unlimited")

**3. Action Required Callout**
When status is "Failed - Action Needed", show:
- Clear description of problem
- Why it needs manual action
- Step-by-step fix instructions
- Link to troubleshooting guide

### Proposed UI

```
┌─────────────────────────────────────────────────────┐
│ BODYPUMP • Monday 4:15 PM                           │
│ ⏳ Retrying - Class is full                         │
├─────────────────────────────────────────────────────┤
│ We're automatically checking for open spots.        │
│                                                     │
│ 📅 Next attempt: Monday 3:00 PM                     │
│ ⏱️ Checking every 15 minutes until 4:15 PM         │
│ 🔄 Attempt 8 (no limit)                            │
│                                                     │
│ [Cancel Retry] [View Details]                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Racquetball • Saturday 12:30 PM                     │
│ ❌ Failed - Action Needed                           │
├─────────────────────────────────────────────────────┤
│ Class "Raquetball" not found on schedule.          │
│                                                     │
│ This usually means:                                 │
│ • Typo in class name (check spelling)              │
│ • Wrong time or day selected                       │
│                                                     │
│ Quick fix:                                          │
│ 1. Check gym website for exact class name          │
│ 2. Update class name in settings                   │
│ 3. We'll try again at next scheduled time          │
│                                                     │
│ [Edit Class] [Troubleshooting Guide]               │
└─────────────────────────────────────────────────────┘
```

### Implementation Notes

**Database Changes:**
```sql
ALTER TABLE booking_attempts ADD COLUMN retry_status TEXT;
-- Values: 'no_retry', 'retrying', 'retry_exhausted'

ALTER TABLE booking_attempts ADD COLUMN next_retry_at TIMESTAMPTZ;
ALTER TABLE booking_attempts ADD COLUMN retry_count INTEGER DEFAULT 0;
```

**Frontend Components:**
- `<RetryStatusBadge />` - Colored badge with icon
- `<RetryInfoPanel />` - Expandable details panel
- `<ActionRequiredCallout />` - Error with fix steps

**Real-time Updates:**
- Polling: Refresh every 30 seconds when retry active
- Or: WebSocket for real-time status (post-MVP)

**Code Locations:**
- `app/dashboard/page.tsx` - Booking history list
- `components/BookingAttemptCard.tsx` - Individual attempt display
- `lib/inngest/functions.ts` - Update retry_status, next_retry_at

### User Stories

**As a user with a full class:**
- I want to see that the system is still trying
- I want to know when the next attempt will be
- I want to cancel the retry if I change my mind

**As a user with a config error:**
- I want to know immediately that I need to fix something
- I want clear instructions on what to fix
- I want to easily access settings to make the fix

### Benefits
- Reduces anxiety (users know system is working)
- Clearer action items (know when manual intervention needed)
- Better trust (transparency in automation)
- Fewer support requests ("Is it still trying?")

### Status
**Status**: Backlogged - Recommended after user notifications
**Priority**: Medium (post-MVP UX improvement)
**Dependencies**:
- Failure scenarios audit (completed)
- User notifications system (for retry status updates)
- Error messaging improvements
**Last Updated**: November 28, 2025
**Estimated Effort**: 6-8 hours (DB changes + UI components + integration)

---

## NextClassCard Failure Handling (Phase 2)

### Overview
Enhance the NextClassCard component to handle failure states and retry scenarios. Phase 1 (v2.17) added booking status display (confirmed/waitlisted/pending). Phase 2 adds failure handling.

### Context
From v2.17 implementation:
- NextClassCard now shows booking status (confirmed ✓, waitlisted ⏳, pending countdown)
- Currently does NOT handle failed bookings or retry states
- User requested failure handling be deferred to Phase 2

### Requirements

**1. Retrying State Display**
When a booking is being retried (e.g., class full, window not open):
- Show "Retrying" state on the card
- Display next retry attempt time
- Example: `🔄 Retrying | at 3:15 PM`

**2. Failed Booking Handling**
When a booking permanently fails:
- Skip the failed class in NextClassCard
- Show the next bookable class instead
- Display failure alert banner above the card with:
  - Class name, day, time
  - Error message
  - Optional "Retry" button (consider for future)

**3. Waitlist Promotion Check**
Currently if user is waitlisted, system doesn't check if they got promoted to confirmed:
- Consider adding periodic check to scrape YMCA for status
- Update booking_attempts status from "waitlisted" → "confirmed" if promoted
- Email notification when promoted off waitlist

### Proposed UI

**Retrying State:**
```
┌──────────────────────────────────────────────┐
│ 🟡 NEXT CLASS                                │
│ Saturday 9:30 AM                             │
│ 💪 BODYPUMP • Woodfin YMCA                   │
│                              🔄 | Retrying   │
│                                 | 3:15 PM    │
└──────────────────────────────────────────────┘
```

**Failed Alert Banner (above card):**
```
┌──────────────────────────────────────────────┐
│ ⚠️ Booking failed for BODYPUMP - Saturday    │
│ 9:30 AM @ Woodfin YMCA                       │
│ Class not found on schedule.                 │
│                            [Dismiss] [Retry] │
└──────────────────────────────────────────────┘
```

### 4. Pending State Design Refinement
Current pending state uses primary-300 blue accent on unit text with white number. Works but feels generic/boring compared to confirmed (green) and waitlisted (amber) states. Revisit design to find something more distinctive that:
- Stays within design system (no off-brand colors like coral)
- No italics (not used elsewhere in system)
- Creates anticipation/energy for upcoming class
- Doesn't feel like "AI slop" or trying too hard

Ideas explored but rejected:
- Warm coral gradient (off-brand, inconsistent)
- Blue tint background + white text (generic)
- Lightning bolt icon (too icon-heavy with emoji above)

### Status
**Status**: Backlogged - Phase 2 of NextClassCard improvements
**Priority**: Medium (post-MVP UX improvement)
**Dependencies**:
- Phase 1 completed (v2.17 - booking status display)
- Retry status tracking in database
- Email notifications system (for waitlist promotion)
**Last Updated**: January 2, 2026
**Estimated Effort**: 4-6 hours

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


## Production Email Configuration

### Overview
Configure production email sending with verified domain to replace the development test email address (`onboarding@resend.dev`) with a custom domain email.

### Current Status
- ✅ Resend SDK installed and working
- ✅ Development testing complete with `onboarding@resend.dev`
- ✅ Email utilities created (`lib/env-utils.ts`)
- ✅ Environment variables configured
- ✅ Production domain `beerock.com` verified in Resend
- ✅ Production `RESEND_FROM_EMAIL` set to `noreply@beerock.com`
- ✅ DKIM signing enabled
- ✅ Production email tested and working

### Requirements

1. **Domain Verification in Resend**
   - Go to Resend Dashboard → Domains
   - Add domain (e.g., `yourworkoutscheduler.com` or `busby.dev`)
   - Add DNS records (TXT, MX, CNAME) to domain provider
   - Wait for verification (usually < 1 hour)
   - Verify domain is showing as "Verified" in Resend

2. **Update Production Environment Variables**
   - Update `RESEND_FROM_EMAIL` in Vercel production environment
   - Change from: `onboarding@resend.dev`
   - Change to: `noreply@yourdomain.com` (or your preferred sender)
   - Optionally update `RESEND_FROM_NAME` if desired

3. **Test Production Email Sending**
   - Deploy changes to production
   - Run test email script in production environment
   - Verify emails are delivered from custom domain
   - Check spam scores and deliverability

### Implementation Notes

**Resend Domain Setup Steps:**
1. Login to Resend Dashboard: https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Copy DNS records provided by Resend
5. Add DNS records to your domain provider:
   - **TXT record**: For domain verification
   - **MX records**: For receiving bounces (optional but recommended)
   - **CNAME records**: For DKIM signing (required for deliverability)
6. Wait for DNS propagation and verification
7. Test sending from `noreply@yourdomain.com`

**Environment Variable Update:**
```env
# Vercel Production Environment Variables
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Change from onboarding@resend.dev
RESEND_FROM_NAME=My Workout Scheduler     # Optional: customize
```

**Email Best Practices:**
- Use `noreply@` or `notifications@` for automated emails
- Don't use personal email addresses (better deliverability)
- Enable DKIM signing (automatic with Resend domain verification)
- Monitor bounce rates in Resend dashboard
- Keep sender name consistent across all emails

### Testing

**Test checklist after domain verification:**
- [x] Verify domain shows "Verified" in Resend dashboard
- [x] Update `RESEND_FROM_EMAIL` in Vercel production
- [x] Deploy to production
- [x] Send test email from production
- [x] Verify email arrives in inbox (not spam)
- [x] DKIM signature enabled
- [ ] Test booking confirmation email (pending implementation)
- [ ] Test failure notification email (pending implementation)

### Code Location
- Environment config: `.env.example` (already configured)
- Email utilities: `lib/env-utils.ts` (already implemented)
- Vercel env vars: Vercel Dashboard → Settings → Environment Variables
- Resend setup: https://resend.com/domains

### Benefits
- **Professional emails**: Send from your own domain instead of test address
- **Better deliverability**: Custom domain with DKIM improves inbox placement
- **Brand consistency**: Emails come from your application domain
- **Production ready**: Meets email sending best practices

### Status
**Status**: Backlogged - Pending domain verification
**Priority**: Medium (required before sending production notifications)
**Blocked by**: Domain selection and DNS access
**Last Updated**: November 18, 2025
**Next Steps**:
1. Decide on domain to use (purchase if needed)
2. Access DNS settings for domain
3. Complete Resend domain verification
4. Update production environment variables

---

## User Profile Management - Email Verification Notifications

### Overview
**STATUS: ✅ COMPLETED** (November 19, 2025)

Email verification success notifications are now displayed on both the dashboard and profile pages. When users click the email verification link sent to their new email address, they see a prominent success message confirming the update.

### Implementation Details

**Email Verification Detection:**
- Detects multiple Supabase redirect patterns:
  - `type=email_change` (when double confirm is disabled)
  - `type=signup` (initial signup verification)
  - `message=Confirmation link accepted` (when double confirm is enabled)
- Works with both Supabase configuration modes
- Shows success message on dashboard AND profile pages
- Auto-dismisses after 10 seconds

**Component Location:**
- `components/EmailVerificationNotification.tsx` - Success notification component
- `app/dashboard/page.tsx` - Dashboard displays notification
- `app/dashboard/profile/page.tsx` - Profile page displays notification

**Related Features:**
- Email update requires password verification (security)
- Only ONE email sent when properly configured (see below)

### Status
**Status**: ✅ COMPLETED
**Priority**: High (better UX)
**Completed**: November 19, 2025

---

## Supabase "Double Confirm Email Changes" Configuration

### Overview
**STATUS: BACKLOGGED** - Requires Supabase configuration change

By default, Supabase sends emails to BOTH the old and new email addresses when users change their email. This can be disabled to send only ONE email (to the new address), since our app already requires password verification for security.

### Issue
- Users currently receive TWO emails when changing email:
  1. Notification to old email: "Your email is being changed"
  2. Verification link to new email: "Confirm your new email"
- This is confusing and unnecessary since password verification already proves identity

### Solution
Disable "Secure Email Change" (aka "Double Confirm Email Changes") in Supabase settings:

**Steps:**
1. Go to Supabase Dashboard → Authentication → Settings
2. Find **"Secure email change (require verification from both emails)"** setting
3. **Toggle OFF** (disable)
4. Save changes

**After disabling:**
- ✅ Only ONE email sent (to new address with verification link)
- ✅ Password verification still required (security maintained)
- ✅ Better user experience (simpler flow)

### Documentation
- Comprehensive guide: `docs/SUPABASE_EMAIL_SETTINGS.md`
- Includes step-by-step instructions, security considerations, troubleshooting

### Why It's Secure Without Double Confirmation
Our implementation requires **password verification** before email changes:
- User must enter current password in profile form
- Server verifies password is correct (`app/actions/profile.ts`)
- This proves user identity before any email is sent
- Double confirmation adds no additional security in this case

### Code References
- Password verification: `app/actions/profile.ts:80-93`
- Profile form: `components/ProfileForm.tsx:180-215`
- Configuration guide: `docs/SUPABASE_EMAIL_SETTINGS.md`

### Status
**Status**: Backlogged - Pending Supabase configuration
**Priority**: Medium (UX improvement, not critical)
**Last Updated**: November 19, 2025
**Action Required**: Toggle off "Secure email change" in Supabase dashboard
**Reference Session**: See other email session for related work

---

## "Stay Logged In" Checkbox on Login Page

### Overview
**STATUS: BACKLOGGED**

Add a "Keep me logged in" checkbox to the login page that allows users to control session persistence. Currently, users stay logged in indefinitely with no indication or control over this behavior.

### Current Behavior
- Users stay logged in indefinitely (session persists across browser restarts)
- No user control over session persistence
- No indication to users about login behavior

### Expected Behavior

**Checkbox Checked (Stay logged in):**
- Session persists indefinitely (across browser restarts)
- User remains logged in until they explicitly sign out

**Checkbox Unchecked (Default):**
- Session ends when browser closes
- User must log in again on next browser session

### Requirements

1. **Login Page UI**
   - Add checkbox below password field on login page
   - Label: "Keep me logged in"
   - Default state: **Unchecked**
   - Only appears on login page (NOT on signup page)

2. **Session Persistence Logic**
   - Checked: Use Supabase persistent session storage (localStorage)
   - Unchecked: Use Supabase temporary session storage (sessionStorage)
   - Supabase supports this via `storage` option in `createBrowserClient()`

3. **User Experience**
   - Clear indication of what "Keep me logged in" means
   - Checkbox state remembered if login fails (don't reset form)
   - Consider adding tooltip or help text explaining behavior

### Implementation Notes

**Supabase Session Storage:**

Supabase client supports session persistence configuration:

```typescript
// lib/supabase/client.ts or login action
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      // ... existing cookie config
    },
    auth: {
      storage: rememberMe ? window.localStorage : window.sessionStorage,
      // or use storageKey to differentiate
    }
  }
)
```

**Alternative Approach:**

Use Supabase's built-in session configuration:

```typescript
// When user logs in
await supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    // This isn't a direct option, but session persistence is controlled by storage type
  }
})
```

**Recommended Implementation:**

1. **Client-side approach (simplest):**
   - Create separate Supabase clients based on "remember me" choice
   - Use localStorage for persistent sessions
   - Use sessionStorage for temporary sessions

2. **Server Action approach:**
   - Pass `rememberMe` boolean to login server action
   - Configure cookie options based on preference
   - Set appropriate cookie maxAge (indefinite vs session)

### Code Location

**Files to modify:**
- `app/(auth)/login/page.tsx` - Add checkbox to login form
- `lib/supabase/client.ts` - Support configurable session storage (optional)
- Login form component - Handle checkbox state
- May need to modify Supabase middleware if using cookie-based approach

**UI Updates:**
```tsx
// app/(auth)/login/page.tsx
<div className="flex items-center">
  <input
    id="remember-me"
    name="remember-me"
    type="checkbox"
    className="h-4 w-4 rounded border-gray-300"
  />
  <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
    Keep me logged in
  </label>
</div>
```

### Testing Considerations

1. **Checked checkbox:**
   - [ ] User logs in with "Keep me logged in" checked
   - [ ] Close browser completely
   - [ ] Reopen browser and navigate to app
   - [ ] Verify user is still logged in

2. **Unchecked checkbox (default):**
   - [ ] User logs in without checking "Keep me logged in"
   - [ ] Close browser tab (session should persist in same browser window)
   - [ ] Close browser completely
   - [ ] Reopen browser and navigate to app
   - [ ] Verify user is logged out (redirected to login)

3. **Login failure:**
   - [ ] Check "Keep me logged in"
   - [ ] Enter wrong password
   - [ ] Verify checkbox state is preserved after error

4. **Manual logout:**
   - [ ] Verify logout works regardless of checkbox state
   - [ ] Session cleared properly in both cases

### Security Considerations

- **Indefinite sessions**: Consider if indefinite sessions pose security risk
- **Shared computers**: Users on shared computers should NOT check "Keep me logged in"
- **Session hijacking**: Ensure session tokens are still secure with persistent storage
- **Consider**: Adding help text warning about shared computer usage

### Alternative Enhancements (Future)

- Add "Remember me for 30 days" option (middle ground)
- Add session timeout for inactive users (even with "Keep me logged in")
- Show last login time in user profile
- Add "Active sessions" management page

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium (UX improvement, security consideration)
**Last Updated**: November 19, 2025
**Next Steps**:
1. Research Supabase session storage configuration options
2. Decide on client-side vs server-side implementation
3. Implement checkbox UI on login page
4. Test session persistence behavior

---

## Authentication Security & UX Improvements - Priority 2 & 3

### Overview
**STATUS: PARTIALLY COMPLETED (Priority 1 Complete, Priority 2/3 Backlogged)**

Following a comprehensive audit of the signup and authentication workflow, several improvements were identified and prioritized. Priority 1 improvements have been completed and deployed to production (v2.9). This section tracks the remaining Priority 2 and Priority 3 enhancements.

### Completed (Priority 1) ✅

The following critical improvements have been implemented:

1. **Password Confirmation Field on Signup** ✅
   - Prevents users from locking themselves out due to password typos
   - Validates passwords match before submission
   - Clear error messaging if passwords don't match

2. **Resend Verification on Login Page** ✅
   - Detects unverified email errors on login attempt
   - Shows blue banner with "Resend Verification Email" button
   - Helps users recover from unverified account lockout
   - Success feedback after resending

3. **Bot Protection with Cloudflare Turnstile** ✅
   - Prevents automated bot signups
   - Uses Cloudflare Turnstile (privacy-friendly alternative to reCAPTCHA)
   - Invisible in production (visible test widget in development)
   - Fixed duplicate widget rendering in React Strict Mode

4. **Persistent Notifications** ✅
   - Removed auto-dismiss timers from ALL auth notifications
   - Users manually dismiss with X button or by refreshing page
   - Applied to: verify-email, login, profile (email/password changes)
   - Context-aware messaging (signup vs email change)

5. **Consistent Expiration Times** ✅
   - All verification links expire in 1 hour (Supabase default)
   - Documented in verify-email page instructions

**Auth Workflow Grade:** A- (up from B+)

### Remaining (Priority 2 - Post-MVP)

1. **Password Strength Meter**
   - **Status**: Backlogged
   - **Description**: Visual indicator showing password strength (Weak/Fair/Good/Strong)
   - **Library**: Consider using zxcvbn for strength calculation
   - **UI**: Progress bar below password field with color coding
   - **Feedback**: Real-time strength updates as user types
   - **Benefit**: Encourages stronger passwords without enforcing strict rules

2. **Unverified Account Cleanup Job**
   - **Status**: Backlogged
   - **Description**: Automated job to delete stale unverified accounts
   - **Implementation**: Daily cron job (could use Inngest scheduled function)
   - **Logic**: Delete accounts where `email_confirmed_at IS NULL AND created_at > 48 hours old`
   - **Notification**: Optional email 24 hours before deletion ("verify your email or your account will be deleted")
   - **Benefit**: Keeps database clean, prevents email squatting

3. **Password Complexity Requirements**
   - **Status**: Backlogged
   - **Description**: Enforce minimum password complexity rules
   - **Requirements**:
     - At least 1 uppercase letter
     - At least 1 lowercase letter
     - At least 1 number
     - Optional: At least 1 special character
   - **Current**: Only minimum 8 characters enforced
   - **UI**: Show checklist below password field
   - **Benefit**: Improves account security

### Remaining (Priority 3 - Nice to Have)

1. **Expiration Timer on verify-email Page**
   - **Status**: Backlogged
   - **Description**: Countdown showing time until verification link expires
   - **UI**: "Link expires in: 45:32" with live countdown
   - **Implementation**: JavaScript countdown starting from 1 hour (3600 seconds)
   - **Edge Case**: Handle page refresh (calculate time from URL timestamp if available)
   - **Benefit**: Creates urgency, reduces support tickets about expired links

2. **App-Level Rate Limiting**
   - **Status**: Backlogged
   - **Description**: Prevent signup abuse and brute force attacks
   - **Implementation**: Use Upstash Redis for rate limiting
   - **Limits**:
     - Signup: 3 attempts per IP per hour
     - Login: 5 attempts per IP per 15 minutes
     - Resend verification: 3 attempts per email per hour
   - **Current**: Relying on Supabase built-in rate limiting + Cloudflare Turnstile
   - **Benefit**: Additional layer of protection against abuse

3. **Social Login Integration**
   - **Status**: Backlogged (see separate section below for full details)
   - **Description**: Google/GitHub OAuth as alternative to email/password
   - **Benefit**: Faster signup, no password to remember
   - **Note**: See "OAuth Login (Google and Apple Sign-In)" section for complete specification

### Files Modified (Priority 1 Implementation)

- `app/(auth)/signup/page.tsx` - Password confirmation, Turnstile integration
- `app/(auth)/login/page.tsx` - Resend verification feature
- `app/(auth)/verify-email/page.tsx` - Removed auto-dismiss from resend success
- `components/EmailVerificationNotification.tsx` - Persistent notifications, context-aware messaging
- `components/ProfileForm.tsx` - Removed auto-dismiss from email/password success
- `.env.example` - Added NEXT_PUBLIC_TURNSTILE_SITE_KEY documentation

### Environment Variables (Priority 1)

**Required for Cloudflare Turnstile:**
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key
  - Test key: `1x00000000000000000000AA` (always passes, visible widget)
  - Production: Custom site key from Cloudflare dashboard (invisible)

### Status
**Priority 1 Status**: ✅ COMPLETED AND DEPLOYED (v2.9)
**Priority 2 Status**: Backlogged (Post-MVP)
**Priority 3 Status**: Backlogged (Nice to Have)
**Last Updated**: November 23, 2025
**Completed**: November 23, 2025 (Priority 1)

### Next Steps (Priority 2/3)
1. Evaluate password strength meter libraries (zxcvbn vs alternatives)
2. Design unverified account cleanup job (determine notification timing)
3. Decide on password complexity requirements (with or without special characters)
4. Research rate limiting solutions (Upstash Redis vs Vercel Edge Config)
5. Test expiration timer UX (decide if it adds value or creates anxiety)

---

## OAuth Login (Google and Apple Sign-In)

### Overview
**STATUS: BACKLOGGED**

Add Google and Apple OAuth authentication as the **preferred login method**, allowing users to sign up and log in with their existing Google or Apple accounts. Users can also link multiple OAuth providers to their account and manage these connections in their profile settings.

### Current Behavior
- Only email/password authentication available
- Users must create and remember a password
- No social login options

### Expected Behavior

**OAuth as Preferred Method:**
- Google and Apple OAuth buttons prominently displayed on login/signup pages
- Unified experience: OAuth can create new account if user doesn't exist
- Email/password still available as alternative method
- Users can add password later via profile management

**Account Linking:**
- Users who sign up with email/password can later add Google/Apple OAuth
- Users who sign up with OAuth can later add password
- Users can link multiple OAuth providers to one account (both Google AND Apple)
- Profile page shows all connected authentication methods

**Account Security:**
- Users must have at least ONE login method at all times
- Can disconnect OAuth providers only if another method exists (password or other OAuth)
- Can convert from OAuth-only to email/password by adding password in profile
- OAuth emails are pre-verified (skip email verification step)

### Requirements

#### 1. OAuth Providers Setup

**Google OAuth:**
- Configure Google Cloud Console OAuth 2.0 credentials
- Set authorized redirect URIs for Supabase
- Request scopes: email, profile, openid
- Pull: email, name, profile photo

**Apple OAuth:**
- Configure Apple Developer account OAuth credentials
- Set up Sign in with Apple service ID
- Request scopes: email, name
- Pull: email, name, profile photo (if available)

**Supabase Configuration:**
- Enable Google provider in Supabase Auth settings
- Enable Apple provider in Supabase Auth settings
- Configure OAuth redirect URLs
- Set up provider credentials (client ID, secret)

#### 2. Login/Signup Page UI

**OAuth Buttons:**
- Display Google and Apple sign-in buttons prominently
- Position above email/password form
- Use official brand guidelines (Google/Apple button styles)
- Divider: "Or continue with email" between OAuth and email/password

**Unified Experience:**
- Same OAuth buttons on both login and signup pages
- OAuth flow automatically creates account if user doesn't exist
- No separate "sign up with Google" vs "log in with Google" flows

**Example Layout:**
```
┌─────────────────────────────────┐
│  [G] Continue with Google       │
│  [A] Continue with Apple        │
│                                 │
│  ─────── Or continue with ───── │
│                                 │
│  Email: [____________]          │
│  Password: [____________]       │
│  [ ] Keep me logged in          │
│  [Login]                        │
└─────────────────────────────────┘
```

#### 3. Profile Management - Connected Accounts

**New Section in Profile Page:**
- "Connected Accounts" or "Login Methods" section
- List all connected authentication methods:
  - Email/Password (if set)
  - Google (if connected) - show email and profile photo
  - Apple (if connected) - show email
- "Add" buttons for methods not yet connected
- "Disconnect" buttons for connected methods (disabled if it's the only method)

**Add OAuth Provider:**
- Click "Connect Google" or "Connect Apple" button
- OAuth flow links provider to existing account
- Success message: "Google account connected successfully"
- Profile photo updated if OAuth provides one

**Remove OAuth Provider:**
- Click "Disconnect" button
- Confirmation dialog: "Are you sure you want to disconnect Google?"
- Validate user has another login method before allowing disconnect
- Error if trying to remove last login method: "You must have at least one way to log in"

**Add Password (for OAuth-only users):**
- "Set Password" button if user has no password
- Form: New password + Confirm password
- Allows OAuth-only users to add email/password login

**Profile Photo:**
- Pull profile photo from Google/Apple on first OAuth login
- Store profile photo URL in user metadata
- Display in header/navbar and profile page
- Allow user to change/remove later (future enhancement)

#### 4. Data Pulled from OAuth

**From Google:**
- ✅ Email (required) - used as primary identifier
- ✅ Full name (optional) - stored in user profile
- ✅ Profile photo URL (optional) - displayed in UI

**From Apple:**
- ✅ Email (required) - may be privacy relay email
- ✅ Full name (optional) - only provided on first sign-in
- ✅ Profile photo (rarely available) - fallback to initials

**Data Storage:**
- Email: `auth.users.email`
- Name: `auth.users.user_metadata.full_name`
- Photo: `auth.users.user_metadata.avatar_url`
- Provider: `auth.users.app_metadata.provider` (google, apple, email)

#### 5. Email Verification

**OAuth Users:**
- ✅ Skip email verification (Google/Apple already verified)
- Mark `email_confirmed_at` automatically
- No verification email sent

**Email/Password Users:**
- ⚠️ Require email verification (existing behavior)
- Send verification email on signup
- Block login until verified

#### 6. Security and Edge Cases

**Account Merging:**
- If user signs up with email `user@gmail.com` via password
- Then tries to log in with Google using same `user@gmail.com`
- Supabase automatically links accounts (if configured correctly)
- Or show error: "Email already registered. Please log in with password or link Google in profile."

**Multiple OAuth Same Provider:**
- Users cannot link multiple Google accounts (one per provider)
- Users cannot link multiple Apple IDs (one per provider)
- But can have both Google AND Apple linked simultaneously

**Last Login Method Protection:**
- UI disables "Disconnect" button if it's the only method
- Backend validation prevents removal of last method
- Error message: "Cannot disconnect. You must have at least one way to log in."

**Apple Email Hiding:**
- Apple may provide privacy relay email (`randomstring@privaterelay.appleid.com`)
- Store and accept these emails
- User can update to real email later in profile

### Implementation Notes

#### Supabase OAuth Setup

**Enable Providers:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Google" provider:
   - Add Google OAuth Client ID
   - Add Google OAuth Client Secret
   - Copy Redirect URL for Google Cloud Console
3. Enable "Apple" provider:
   - Add Apple Service ID
   - Add Apple Team ID
   - Add Apple Key ID
   - Upload Apple Private Key (.p8 file)
   - Copy Redirect URL for Apple Developer Console

**Google Cloud Console:**
1. Create OAuth 2.0 Client ID
2. Add authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Configure OAuth consent screen
4. Request scopes: email, profile, openid

**Apple Developer Console:**
1. Create Sign in with Apple Service ID
2. Configure Sign in with Apple capability
3. Add redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Generate private key (.p8)

#### Code Changes

**Files to Create/Modify:**

```typescript
// app/(auth)/login/page.tsx - Add OAuth buttons
import { signInWithOAuth } from '@/app/actions/auth'

<button onClick={() => signInWithOAuth('google')}>
  Continue with Google
</button>
<button onClick={() => signInWithOAuth('apple')}>
  Continue with Apple
</button>

// app/actions/auth.ts - OAuth sign-in action
'use server'
export async function signInWithOAuth(provider: 'google' | 'apple') {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  if (error) throw error
  redirect(data.url)
}

// app/auth/callback/route.ts - OAuth callback handler (may already exist)
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return redirect('/dashboard')
}

// app/dashboard/profile/page.tsx - Add Connected Accounts section
// Show list of connected providers
// Add/remove OAuth connections
// Set password for OAuth-only users

// components/ConnectedAccounts.tsx - New component
// Displays connected authentication methods
// Buttons to add/remove providers
// Validation for last method protection
```

**Database Schema Updates:**

```sql
-- Store provider information in user metadata (Supabase handles this automatically)
-- auth.users.user_metadata: { full_name, avatar_url, ... }
-- auth.users.app_metadata: { provider, providers: ['google', 'apple'], ... }

-- Optional: Create table to track provider connections
CREATE TABLE user_oauth_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'apple'
  provider_user_id TEXT NOT NULL, -- OAuth provider's user ID
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);
```

**UI Components Needed:**

1. **OAuth Buttons Component** (`components/OAuthButtons.tsx`)
   - Google button with official styling
   - Apple button with official styling
   - Handle OAuth flow initiation
   - Loading states

2. **Connected Accounts Component** (`components/ConnectedAccounts.tsx`)
   - List connected providers
   - Add/remove provider buttons
   - Profile photo display
   - Validation and error handling

3. **Set Password Component** (`components/SetPassword.tsx`)
   - For OAuth-only users to add password
   - Password strength validation
   - Confirmation dialog

### Code Location

**New Files:**
- `app/actions/auth.ts` - OAuth sign-in actions
- `components/OAuthButtons.tsx` - Google/Apple sign-in buttons
- `components/ConnectedAccounts.tsx` - Profile connected accounts section
- `components/SetPassword.tsx` - Set password for OAuth-only users

**Modified Files:**
- `app/(auth)/login/page.tsx` - Add OAuth buttons
- `app/(auth)/signup/page.tsx` - Add OAuth buttons (same as login)
- `app/auth/callback/route.ts` - Handle OAuth callback (may need to create)
- `app/dashboard/profile/page.tsx` - Add Connected Accounts section
- `middleware.ts` - May need to handle OAuth callback routes

**Environment Variables:**
```env
# Google OAuth (from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Apple OAuth (from Apple Developer Console)
NEXT_PUBLIC_APPLE_CLIENT_ID=...
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
APPLE_PRIVATE_KEY=... (or path to .p8 file)
```

**Note**: Supabase handles most OAuth configuration in their dashboard, so these environment variables may not be needed if configured in Supabase settings.

### Testing Considerations

#### OAuth Sign-In Flow:
- [ ] Click "Continue with Google" on login page
- [ ] Redirected to Google OAuth consent screen
- [ ] Grant permissions
- [ ] Redirected back to app dashboard
- [ ] User logged in successfully
- [ ] Profile photo and name populated

- [ ] Click "Continue with Apple" on login page
- [ ] Redirected to Apple OAuth consent screen
- [ ] Grant permissions
- [ ] Redirected back to app dashboard
- [ ] User logged in successfully

#### Account Linking:
- [ ] Sign up with email/password
- [ ] Go to profile → Connected Accounts
- [ ] Click "Connect Google"
- [ ] Google account linked successfully
- [ ] Both email/password and Google shown as connected

- [ ] Sign up with Google
- [ ] Go to profile → Connected Accounts
- [ ] Click "Set Password"
- [ ] Password added successfully
- [ ] Both Google and email/password shown as connected

#### Account Disconnection:
- [ ] User with both Google and password connected
- [ ] Click "Disconnect Google"
- [ ] Confirmation dialog shown
- [ ] Disconnect successful
- [ ] Can still log in with password

- [ ] User with ONLY Google connected (no password)
- [ ] "Disconnect Google" button is disabled
- [ ] Tooltip: "You must have at least one way to log in"
- [ ] Cannot disconnect

#### Email Verification:
- [ ] Sign up with Google → Email auto-verified (no verification email sent)
- [ ] Sign up with Apple → Email auto-verified (no verification email sent)
- [ ] Sign up with email/password → Verification email sent (existing behavior)

#### Edge Cases:
- [ ] Sign up with email `test@gmail.com` via password
- [ ] Try to log in with Google using same `test@gmail.com`
- [ ] Accounts merged or error shown appropriately
- [ ] No duplicate accounts created

- [ ] Sign up with Apple using privacy relay email
- [ ] Email stored correctly (`xyz@privaterelay.appleid.com`)
- [ ] Can update to real email in profile later

#### Profile Photo:
- [ ] Sign up with Google → Profile photo pulled and displayed
- [ ] Sign up with Apple → Fallback to initials if no photo
- [ ] Profile photo shown in navbar/header
- [ ] Profile photo shown in profile page

### Security Considerations

**OAuth Security:**
- Use HTTPS for all OAuth redirects (required in production)
- Validate OAuth state parameter to prevent CSRF attacks (Supabase handles this)
- Store OAuth tokens securely (Supabase handles this)
- Use short-lived access tokens with refresh tokens

**Account Takeover Prevention:**
- Require password verification before disconnecting OAuth (optional enhancement)
- Email notification when OAuth provider is added/removed
- Show "Last connected" timestamp for OAuth providers

**Privacy:**
- Only request minimum required OAuth scopes
- Allow users to disconnect OAuth at any time (if not last method)
- Don't store unnecessary OAuth data
- Handle Apple privacy relay emails correctly

**Last Method Protection:**
- UI disables disconnect button if only method
- Backend validates at least one method remains
- Transaction: only remove method if another exists
- Error handling for edge cases

### Alternative Enhancements (Future)

- Add more OAuth providers (GitHub, Microsoft, Facebook)
- Show "Last used" timestamp for each login method
- Email notification when new OAuth provider is connected
- Two-factor authentication (2FA) for OAuth accounts
- "Preferred login method" setting (auto-select on login page)
- Active sessions management (see which devices are logged in)
- Profile photo upload/change (independent of OAuth photo)

### Dependencies

**Required:**
- Supabase OAuth provider configuration (Google, Apple)
- Google Cloud Console OAuth setup
- Apple Developer Console OAuth setup
- Domain verification for OAuth redirects (production)

**Optional:**
- Profile photo storage (use OAuth URLs or upload to storage bucket)
- Email notification system (for OAuth connection changes)

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: High (major UX improvement, preferred login method)
**Last Updated**: November 19, 2025
**Next Steps**:
1. Set up Google OAuth in Google Cloud Console
2. Set up Apple OAuth in Apple Developer Console
3. Configure providers in Supabase dashboard
4. Implement OAuth buttons on login/signup pages
5. Create Connected Accounts section in profile
6. Test OAuth flows thoroughly
7. Document OAuth setup process

---

## Password Security Requirements (Pre-MVP)

### Overview
**STATUS: PRE-MVP - MUST COMPLETE BEFORE LAUNCH**

Implement industry-standard password security requirements to protect user accounts. Currently, passwords only require 8 characters with no complexity requirements. While this is a casual site without highly sensitive data, basic password security is essential.

### Current Behavior
- Minimum password length: 8 characters (enforced programmatically)
- No complexity requirements (no uppercase, digits, or symbols required)
- No password strength indicator
- No validation for existing weak passwords

### Expected Behavior

**Password Requirements:**
- **Minimum length**: 8 characters (keep current)
- **Complexity**: Must contain at least:
  - Lowercase letters (a-z)
  - Uppercase letters (A-Z)
  - Digits (0-9)
  - Symbols NOT required (better mobile UX)

**Enforcement:**
- **App-level validation only** (client-side + server-side)
- Skip Supabase auth settings (to avoid complex error handling)
- Clear, user-friendly error messages

**Existing Users:**
- **Force password reset on next login** if password doesn't meet new requirements
- Show message: "We've updated our password requirements. Please create a new password."
- Redirect to password reset flow

**Password Strength Indicator (Post-MVP):**
- Visual feedback while typing (Weak/Medium/Strong)
- Helpful but not critical for MVP
- Can be added after launch

### Requirements

#### 1. Password Validation Logic

**Validation Rules:**
```typescript
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

**Where to Enforce:**
- ✅ Signup page (client + server)
- ✅ Password change in profile (client + server)
- ✅ Password reset flow (client + server)
- ✅ OAuth users adding password (client + server)

#### 2. User Interface Updates

**Signup Page:**
- Add password requirements text below password field:
  ```
  Password must contain:
  • At least 8 characters
  • Lowercase and uppercase letters
  • At least one digit
  ```
- Show inline validation errors if password doesn't meet requirements
- Disable submit button until password is valid (optional, or allow submit with clear error)

**Profile Password Change:**
- Same requirements text as signup
- Validate new password meets requirements
- Show clear error messages if validation fails

**Error Messages:**
- Clear, specific messages for each missing requirement
- Example: "Password must contain at least one uppercase letter"
- Group errors in a list if multiple requirements missing

#### 3. Existing User Migration

**Force Password Reset Flow:**

**Option A: Check on login (Recommended)**
1. User logs in with email/password
2. After successful auth, check if password meets new requirements
3. If password is weak:
   - Set flag in session or database: `requires_password_reset: true`
   - Redirect to password reset page (not dashboard)
   - Show message: "We've updated our password requirements for better security. Please create a new password that meets the requirements."
4. User must reset password before accessing dashboard
5. After successful reset, clear flag and allow dashboard access

**Option B: Background migration with soft deadline**
1. Show banner on dashboard: "Your password doesn't meet our updated security requirements. Please update it in your profile."
2. Allow continued use for 30 days
3. After 30 days, force password reset on login
4. More user-friendly but adds complexity

**Recommended: Option A** (simpler, immediate security improvement)

**Implementation:**
```typescript
// After successful login
const passwordMeetsRequirements = await checkPasswordStrength(userId)

if (!passwordMeetsRequirements) {
  // Set flag requiring password reset
  await setRequiresPasswordReset(userId, true)

  // Redirect to forced password reset page
  redirect('/auth/reset-password?reason=security_update')
}
```

**Database Changes (Optional):**
```sql
-- Add flag to track users requiring password reset
ALTER TABLE auth.users
ADD COLUMN requires_password_reset BOOLEAN DEFAULT FALSE;

-- Or use user_metadata:
-- auth.users.user_metadata.requires_password_reset = true
```

**Challenge: Detecting Weak Passwords**
- Supabase stores password hashes, not plaintext
- **Cannot directly check existing password strength**
- **Solution**: Check on next login attempt:
  - User enters password
  - Before hashing, validate against new requirements
  - If weak, force reset after successful login

#### 4. Client-Side Validation

**Real-time Feedback:**
- Validate as user types (debounced, e.g., 500ms delay)
- Show green checkmarks for met requirements
- Show red X or grey text for unmet requirements

**Visual Design:**
```
Password must contain:
✓ At least 8 characters
✓ Lowercase letters
✗ Uppercase letters
✓ At least one digit
```

**Code Example:**
```tsx
// components/PasswordInput.tsx
const [password, setPassword] = useState('')
const validation = validatePassword(password)

<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

<ul className="text-sm mt-2">
  <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
    {password.length >= 8 ? '✓' : '○'} At least 8 characters
  </li>
  <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
    {/[a-z]/.test(password) ? '✓' : '○'} Lowercase letters
  </li>
  <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
    {/[A-Z]/.test(password) ? '✓' : '○'} Uppercase letters
  </li>
  <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
    {/[0-9]/.test(password) ? '✓' : '○'} At least one digit
  </li>
</ul>
```

#### 5. Server-Side Validation

**Validate in Server Actions:**
- Always validate on server even if client validates
- Never trust client-side validation alone
- Return clear error messages to client

**Code Example:**
```typescript
// app/actions/auth.ts (or similar)
'use server'

import { validatePassword } from '@/lib/password-validation'

export async function signup(email: string, password: string) {
  const validation = validatePassword(password)

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors
    }
  }

  // Proceed with signup
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  // ...
}
```

### Implementation Notes

**Files to Create/Modify:**

**New Files:**
- `lib/password-validation.ts` - Password validation utility functions
- `components/PasswordRequirements.tsx` - Visual requirements checklist component (optional)

**Modified Files:**
- `app/(auth)/signup/page.tsx` - Add password requirements, validation
- `app/(auth)/login/page.tsx` - Check for weak password after login, force reset if needed
- `app/actions/profile.ts` - Add password validation to password change action
- `components/ProfileForm.tsx` - Add password requirements to password change form
- Server actions for signup/password reset - Add validation

**Password Validation Utility:**
```typescript
// lib/password-validation.ts
export interface PasswordValidation {
  valid: boolean
  errors: string[]
  checks: {
    minLength: boolean
    hasLowercase: boolean
    hasUppercase: boolean
    hasDigit: boolean
  }
}

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password)
  }

  const errors: string[] = []

  if (!checks.minLength) {
    errors.push('Password must be at least 8 characters')
  }
  if (!checks.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!checks.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!checks.hasDigit) {
    errors.push('Password must contain at least one digit')
  }

  return {
    valid: errors.length === 0,
    errors,
    checks
  }
}
```

### Code Location

**New Files:**
- `lib/password-validation.ts` - Validation logic
- `components/PasswordRequirements.tsx` - Visual checklist (optional)
- `app/auth/reset-password/page.tsx` - Forced password reset page (may already exist)

**Modified Files:**
- `app/(auth)/signup/page.tsx` - Add requirements and validation
- `app/(auth)/login/page.tsx` - Check weak password, force reset
- `app/actions/profile.ts` - Validate password on change
- `components/ProfileForm.tsx` - Show requirements
- Any password reset flows

### Testing Considerations

#### Password Validation:
- [ ] Try password "password" → Rejected (no uppercase, no digit)
- [ ] Try password "Password" → Rejected (no digit)
- [ ] Try password "Password1" → Accepted ✓
- [ ] Try password "Pass123" → Rejected (less than 8 characters)
- [ ] Try password "PASSWORD123" → Rejected (no lowercase)

#### Client-Side Validation:
- [ ] Type weak password → See error messages
- [ ] Type strong password → See green checkmarks
- [ ] Submit with weak password → Blocked or show error
- [ ] Client-side validation matches server-side

#### Server-Side Validation:
- [ ] Bypass client validation (direct API call) → Server rejects weak password
- [ ] Server returns clear error messages
- [ ] Error messages displayed in UI

#### Existing User Migration:
- [ ] User with weak password (e.g., "password") logs in
- [ ] Successful login, but redirected to password reset page
- [ ] Message shown: "Please create a new password..."
- [ ] User creates strong password → Allowed to dashboard
- [ ] User tries weak password again → Validation error

- [ ] User with strong password (e.g., "Password123") logs in
- [ ] No interruption, goes straight to dashboard

#### All Password Entry Points:
- [ ] Signup with weak password → Rejected
- [ ] Signup with strong password → Accepted
- [ ] Change password in profile with weak password → Rejected
- [ ] Change password in profile with strong password → Accepted
- [ ] OAuth user adding password with weak password → Rejected
- [ ] OAuth user adding password with strong password → Accepted
- [ ] Password reset with weak password → Rejected
- [ ] Password reset with strong password → Accepted

### Security Considerations

**Why These Requirements:**
- **8 characters minimum**: Industry baseline, good balance of security and usability
- **Lowercase + Uppercase + Digits**: Increases password complexity significantly
- **No symbols required**: Better mobile UX, still secure with other requirements
- **Force reset for weak passwords**: Immediate security improvement for existing users

**Why NOT Supabase Settings:**
- Avoids complex error handling between Supabase and app
- Gives us full control over error messages and UX
- Simpler to test and debug
- Can customize validation logic if needed

**Additional Security (Future):**
- Password strength meter (visual indicator)
- Check against common password databases (Have I Been Pwned API)
- Enforce password rotation (change every 90 days)
- Rate limiting on password attempts
- Two-factor authentication (2FA)

### Why This Matters (Even for Casual Site)

**User Data at Risk:**
- Gym login credentials (stored encrypted)
- Email address
- Booking history
- Personal schedule information

**Attack Vectors:**
- Weak passwords enable brute-force attacks
- Credential stuffing (reused passwords from other breaches)
- Unauthorized access to gym account credentials

**Industry Standard:**
- Even casual sites should enforce basic password security
- Users expect minimum security standards
- Protects both user and application reputation

### Alternative Enhancements (Post-MVP)

**Password Strength Meter:**
- Visual indicator: Weak (red) / Medium (yellow) / Strong (green)
- Real-time feedback as user types
- More engaging UX than just checkboxes

**Breach Detection:**
- Integrate with Have I Been Pwned API
- Check if password appears in known breaches
- Warn user if password is compromised

**Passphrase Support:**
- Allow longer passwords (passphrases) without complexity requirements
- Example: "correct horse battery staple" (4 random words)
- More secure and easier to remember

**Password Manager Integration:**
- Auto-generate secure passwords
- Browser password manager compatibility
- "Suggest Strong Password" button

### Status
**Status**: Pre-MVP - Must be completed before launch
**Priority**: High (security requirement)
**Last Updated**: November 19, 2025
**Blocks**: MVP launch
**Next Steps**:
1. Create password validation utility (`lib/password-validation.ts`)
2. Update signup page with requirements and validation
3. Update profile password change with validation
4. Implement forced password reset for existing users with weak passwords
5. Add server-side validation to all password entry points
6. Test all password flows thoroughly
7. Document password requirements for users

**Timeline:** Should be completed before MVP ships to production users

---

## Contact/Support Form (Pre-MVP)

### Overview
**STATUS: PRE-MVP - MUST COMPLETE BEFORE LAUNCH**

Add a contact/support system to allow users to reach out for help with issues, questions, or feedback. Users can submit a contact form or email directly. This builds trust and provides a critical support channel for users.

### Current Behavior
- No way for users to contact support
- No support email displayed anywhere
- Users have no recourse if they encounter issues

### Expected Behavior

**Contact Methods:**
- **Primary:** Contact form on dedicated `/contact` page
- **Fallback:** Direct email link (`mailto:help@beerock.com`)
- Both methods available and visible to users

**Contact Form:**
- Dedicated page at `/contact`
- Pre-fills user info if logged in (name, email)
- Fields: Name, Email, Subject/Topic (dropdown), Message
- On-page confirmation after successful submission
- Sends email to `help@beerock.com` via Resend

**Footer Link:**
- Add "Contact" or "Support" link to existing footer
- Place in appropriate section (e.g., "Help" or "Support" section)
- Link to `/contact` page
- Available throughout entire site

**Email Setup:**
- Use `help@beerock.com` as support email
- Same domain setup as `noreply@beerock.com` (already configured)
- DKIM signing enabled (beerock.com domain)

### Requirements

#### 1. Contact Page (`/contact`)

**Page Layout:**
- Clean, simple form
- Welcoming heading: "Contact Us" or "Get Help"
- Subtitle: "Have a question or need help? We're here for you."
- Contact form (primary)
- Alternative: "Or email us directly at help@beerock.com"

**Form Fields:**

**Name (required):**
- Text input
- Pre-filled if user is logged in (`user.user_metadata.full_name` or from OAuth)
- Placeholder: "Your name"

**Email (required):**
- Email input
- Pre-filled if user is logged in (`user.email`)
- Validated format (email regex)
- Placeholder: "your@email.com"

**Subject/Topic (required):**
- Dropdown select
- Options:
  - Bug Report
  - Feature Request
  - Account Issue
  - Booking Problem
  - General Question
  - Other
- Default: "Select a topic"

**Message (required):**
- Textarea (multi-line)
- Minimum 10 characters
- Placeholder: "Tell us how we can help..."
- Rows: 6-8 lines

**User ID (hidden, auto-populated):**
- If user is logged in, include user ID in submission
- Helps with support lookup and context
- Not visible to user

**Submit Button:**
- "Send Message" or "Submit"
- Loading state while submitting
- Disabled until form is valid

#### 2. Form Submission Flow

**Validation:**
- Client-side: Real-time validation as user types
- Server-side: Always validate before sending email
- Required fields: Name, Email, Subject, Message
- Email format validation
- Message minimum length (10 chars)

**Email Sending (via Resend):**
- Send to: `help@beerock.com`
- From: User's email (reply-to user email)
- Subject: `[${subject}] Contact Form Submission from ${name}`
- Body: Include all form data + user ID (if logged in)

**Email Template:**
```
New contact form submission:

From: ${name} (${email})
User ID: ${userId || 'Not logged in'}
Subject: ${subject}

Message:
${message}

---
Submitted at: ${timestamp}
```

**Success Response:**
- Show success message on page (inline, not separate page)
- Message: "Thanks for reaching out! We'll get back to you within 24 hours."
- Clear form after successful submission
- Option to submit another message

**Error Handling:**
- Show error message if submission fails
- Message: "Sorry, something went wrong. Please try emailing us directly at help@beerock.com"
- Don't clear form on error (preserve user input)
- Log error for debugging

#### 3. Footer Integration

**Add Contact Link:**
- Link text: "Contact" or "Support"
- URL: `/contact`
- Placement: In existing footer, proper section
  - Suggestion: Create "Support" or "Help" section in footer
  - Or add to existing "Company" section

**Footer Structure (Example):**
```
┌─────────────────────────────────────────┐
│  My Workout Scheduler                   │
│                                         │
│  [Logo/Brand]                           │
│                                         │
│  Product         Support       Legal    │
│  --------        -------       -----    │
│  Features        Contact       Privacy  │
│  Pricing         FAQ           Terms    │
│  Docs            Status                 │
│                                         │
│  © 2025 My Workout Scheduler            │
└─────────────────────────────────────────┘
```

**Existing Footer Check:**
- Review current footer implementation
- Add "Contact" link in appropriate location
- Ensure footer appears on all pages

#### 4. Email Configuration

**Email Address: `help@beerock.com`**

**Setup in Resend:**
- Use existing beerock.com domain (already verified)
- Same DNS/DKIM setup as `noreply@beerock.com`
- No additional domain verification needed

**Email Sending:**
- Use Resend API to send contact form submissions
- From: `help@beerock.com` or `noreply@beerock.com`
- Reply-To: User's email address (so you can reply directly)
- To: `help@beerock.com` (your support inbox)

**Environment Variables (existing):**
```env
RESEND_API_KEY=...  # Already configured
RESEND_FROM_EMAIL=noreply@beerock.com  # Use this for "From"
SUPPORT_EMAIL=help@beerock.com  # New: where to send contact form submissions
```

#### 5. Auto-Response (Post-MVP)

**For MVP:**
- Show confirmation message on page after submission
- No email confirmation sent to user
- Keep it simple

**Post-MVP Enhancement:**
- Send confirmation email to user
- Subject: "We received your message"
- Body: "Thanks for contacting us. We'll respond within 24 hours."
- Include copy of their original message

#### 6. Database Tracking (Optional - Discuss)

**Options:**

**Option A: No database (simpler for MVP)**
- Just send email to help@beerock.com
- Support team handles via email
- Pros: Simpler, faster to implement
- Cons: No tracking, no history in app

**Option B: Store submissions in database (better for scaling)**
- Create `contact_submissions` table
- Track submission history
- Allow users to view their past submissions in profile
- Pros: Full audit trail, better support workflow
- Cons: More complex, requires additional UI

**Recommendation for MVP: Option A (email only)**
- Start simple with email-only
- Add database tracking later if needed
- Can always migrate emails to database if desired

**If you want database tracking for MVP:**
```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'resolved'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Implementation Notes

**Files to Create:**

**New Page:**
```typescript
// app/contact/page.tsx - Contact form page
'use client'

import { useState } from 'react'
import { submitContactForm } from '@/app/actions/contact'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const result = await submitContactForm(formData)

    if (result.success) {
      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' }) // Clear form
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>Contact Us</h1>
      <p>Have a question or need help? We're here for you.</p>

      {status === 'success' && (
        <div className="bg-green-50 p-4 rounded">
          Thanks for reaching out! We'll get back to you within 24 hours.
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 p-4 rounded">
          Sorry, something went wrong. Please try emailing us directly at{' '}
          <a href="mailto:help@beerock.com">help@beerock.com</a>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Form fields... */}
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <p className="mt-8 text-sm text-gray-600">
        Or email us directly at{' '}
        <a href="mailto:help@beerock.com" className="text-blue-600">
          help@beerock.com
        </a>
      </p>
    </div>
  )
}
```

**New Server Action:**
```typescript
// app/actions/contact.ts - Contact form submission
'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function submitContactForm(data: ContactFormData) {
  // Validation
  if (!data.name || !data.email || !data.subject || !data.message) {
    return { success: false, error: 'All fields are required' }
  }

  if (data.message.length < 10) {
    return { success: false, error: 'Message must be at least 10 characters' }
  }

  // Get user ID if logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Send email via Resend
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.SUPPORT_EMAIL || 'help@beerock.com',
      replyTo: data.email,
      subject: `[${data.subject}] Contact Form from ${data.name}`,
      text: `
New contact form submission:

From: ${data.name} (${data.email})
User ID: ${user?.id || 'Not logged in'}
Subject: ${data.subject}

Message:
${data.message}

---
Submitted at: ${new Date().toISOString()}
      `.trim()
    })

    return { success: true }
  } catch (error) {
    console.error('Contact form error:', error)
    return { success: false, error: 'Failed to send message' }
  }
}
```

**Footer Update:**
```typescript
// components/Footer.tsx (or wherever footer is)
// Add Contact link to footer

<footer>
  {/* ... existing footer content ... */}
  <div className="footer-section">
    <h3>Support</h3>
    <ul>
      <li><Link href="/contact">Contact</Link></li>
      {/* Other support links */}
    </ul>
  </div>
  {/* ... */}
</footer>
```

**Environment Variables:**
```env
# Add to .env.local and Vercel
SUPPORT_EMAIL=help@beerock.com
```

### Code Location

**New Files:**
- `app/contact/page.tsx` - Contact form page
- `app/actions/contact.ts` - Contact form submission server action
- `components/ContactForm.tsx` - Contact form component (optional, can be inline)

**Modified Files:**
- `components/Footer.tsx` - Add Contact link (or wherever footer is implemented)
- `.env.example` - Document SUPPORT_EMAIL variable

**Optional (if database tracking):**
- `supabase/migrations/00X_contact_submissions.sql` - Database schema
- `lib/supabase/database.ts` - Database helpers for contact submissions

### Testing Considerations

#### Contact Form:
- [ ] Navigate to `/contact` page
- [ ] Form displays correctly
- [ ] All fields present (Name, Email, Subject, Message)

**Logged In User:**
- [ ] User is logged in
- [ ] Name and email are pre-filled
- [ ] Can edit pre-filled values
- [ ] User ID is included in email (verify in received email)

**Not Logged In User:**
- [ ] User is not logged in
- [ ] Form fields are empty
- [ ] Can fill out all fields manually
- [ ] Email sent successfully

**Form Validation:**
- [ ] Try to submit with empty name → Error
- [ ] Try to submit with empty email → Error
- [ ] Try to submit with invalid email format → Error
- [ ] Try to submit with empty subject → Error
- [ ] Try to submit with short message (< 10 chars) → Error
- [ ] Submit with all fields valid → Success

**Email Sending:**
- [ ] Submit form with valid data
- [ ] Email received at help@beerock.com
- [ ] Email contains: name, email, subject, message, user ID, timestamp
- [ ] Reply-To is set to user's email
- [ ] Can reply directly to user

**Success/Error States:**
- [ ] Successful submission → Success message shown
- [ ] Form cleared after success
- [ ] Failed submission → Error message shown
- [ ] Form data preserved after error
- [ ] Mailto link visible as fallback

**Footer Integration:**
- [ ] "Contact" link appears in footer
- [ ] Link appears on all pages (auth pages, dashboard, etc.)
- [ ] Link navigates to `/contact` page
- [ ] Footer layout looks correct

**Email Configuration:**
- [ ] help@beerock.com is set up to receive emails
- [ ] DKIM signing working (check email headers)
- [ ] Emails not going to spam
- [ ] Can reply to user emails

### Security Considerations

**Spam Prevention:**
- Rate limiting (prevent spam submissions)
- Honeypot field (hidden field to catch bots)
- reCAPTCHA (optional, adds friction but prevents abuse)

**Data Validation:**
- Server-side validation (never trust client)
- Email format validation
- Message length limits (min 10, max 5000 chars?)
- Sanitize input to prevent XSS

**Privacy:**
- Don't expose user emails publicly
- Only send user email in Reply-To header
- Don't store sensitive info in contact submissions (if using database)

**For MVP (Keep Simple):**
- Basic validation only
- No rate limiting (add if abused)
- No CAPTCHA (add if spam becomes issue)
- Focus on getting it working

### Email Inbox Setup

**help@beerock.com Configuration:**

**Option A: Email forwarding (simplest)**
- Forward help@beerock.com to your personal email
- Receive contact form submissions in existing inbox
- Reply from personal email (or set up email client with help@beerock.com)

**Option B: Dedicated inbox**
- Set up help@beerock.com as real mailbox (Gmail, Outlook, etc.)
- Access via webmail or email client
- More professional but requires email provider setup

**Option C: Use Resend to receive (if supported)**
- Check if Resend supports receiving emails
- Store in Resend dashboard
- May have limitations

**Recommendation: Option A (forwarding) for MVP**
- Simplest to set up
- Start receiving contact submissions immediately
- Can upgrade to dedicated inbox later

### Why This Matters

**User Trust:**
- Users need a way to get help
- Shows you care about user experience
- Professional appearance

**Support Channel:**
- Critical for handling issues
- Collect bug reports and feedback
- User retention (help users when stuck)

**Legal/Compliance:**
- Some jurisdictions require contact information
- Terms of Service often reference support contact
- Privacy policies need contact email

### Alternative Enhancements (Post-MVP)

**Auto-Response Email:**
- Send confirmation email to user
- "We received your message" notification
- Set expectations (response within 24 hours)

**Database Tracking:**
- Store contact submissions in database
- Track status (new, in progress, resolved)
- Allow users to view submission history in profile

**Support Ticket System:**
- Full ticket tracking system
- Status updates for users
- Internal notes for support team

**FAQ Page:**
- Common questions and answers
- Reduce support volume
- Link from contact page

**Live Chat:**
- Real-time chat support (Intercom, Zendesk, etc.)
- Better user experience
- Higher cost and maintenance

**Contact Form Improvements:**
- File attachments (screenshots)
- Urgency/priority selector
- Department routing (billing, technical, etc.)

### Status
**Status**: Pre-MVP - Must be completed before launch
**Priority**: High (required for user support and trust)
**Last Updated**: November 19, 2025
**Blocks**: MVP launch
**Next Steps**:
1. Create `/contact` page with form
2. Implement contact form server action
3. Configure help@beerock.com email forwarding
4. Add Contact link to footer
5. Test form submission and email delivery
6. Verify emails not going to spam
7. Set up help@beerock.com inbox access

**Timeline:** Should be completed before MVP ships to production users

**Discussion Needed:**
- Database tracking: Yes or no for MVP? (Recommendation: No, add later)
- Email inbox: Forwarding vs dedicated mailbox? (Recommendation: Forwarding)

---

## Skip/Pause Interaction Behavior (Pre-MVP)

### Overview
**STATUS: PRE-MVP - MUST DETERMINE BEFORE LAUNCH**

When a class has `skip_next_occurrence = true` (user clicked "Skip Next"), we need to determine the correct behavior when the user pauses/unpauses their schedule or the individual class. Currently, the system does not have defined behavior for this interaction.

### Current Behavior

**Skip functionality:**
- User clicks "Skip Next" → `skip_next_occurrence = true`, `skip_target_datetime` set to next occurrence
- Inngest checks `skip_next_occurrence` flag before booking (simple boolean check)
- After skip happens, flag cleared immediately
- At next booking attempt (one week later), `skip_target_datetime` cleared

**Pause functionality:**
- **Global pause:** `user_settings.schedule_paused = true` (affects all classes)
- **Per-class pause:** `recurring_classes.active = false` (affects individual class)

**The question:** What should happen to skip state when user pauses/unpauses?

### Scenarios to Consider

1. **Class is skipped, then user pauses globally**
   - Should skip state persist?
   - Should skip state be cleared?
   - What happens when user unpauses?

2. **Class is skipped, then user deactivates that specific class**
   - Should skip state persist?
   - Should skip state be cleared?
   - What happens when user reactivates the class?

3. **User pauses globally, then tries to skip a class**
   - Should UI allow skip while paused?
   - Should skip be queued for when they unpause?
   - Should it show an error/warning?

4. **Class is inactive, then user tries to skip it**
   - Should UI allow skip while inactive?
   - Should skip be queued for when they reactivate?
   - Should it show an error/warning?

### Options to Consider

**Option 1: Skip state is independent of pause state**
- Skip state persists regardless of pause/unpause actions
- Rationale: User explicitly set skip, shouldn't be affected by pause
- Example: User skips Dec 25, then pauses for vacation. When they return and unpause, Dec 25 skip should still be there (though likely in the past and auto-cleared)

**Option 2: Skip state is cleared when paused**
- Global pause clears all skip states
- Per-class deactivation clears skip state for that class
- Rationale: Pause indicates user doesn't care about schedule temporarily, reset everything
- Concern: User might forget they had skips set and be surprised when they're cleared

**Option 3: Skip state is preserved but "frozen"**
- Skip state persists but doesn't apply while paused
- When unpaused, skip state resumes
- Rationale: Best of both worlds - preserves user intent but respects pause
- Complexity: Need to track "frozen" skip state separately

**Option 4: Disable skip UI when paused/inactive**
- Don't allow skipping paused or inactive classes
- If already skipped, preserve state but show warning in UI
- Rationale: Prevent user confusion, keep states separate
- Best for MVP: Simple, clear, predictable

### Recommendation for MVP

**Recommended approach (Option 4 variant):**

1. **Skip state is independent and preserved:**
   - `skip_next_occurrence` and `skip_target_datetime` persist regardless of pause/active state
   - This is the simplest implementation (no additional code needed)

2. **UI considerations:**
   - Show skip badge even when class is paused/inactive (user can see it's set)
   - Allow unskip even when paused/inactive (user can clear it if they want)
   - Optional: Show warning badge "Paused - skip will apply when resumed"

3. **Booking logic (already correct):**
   - Inngest checks pause state first: `if (paused || !active) → skip booking`
   - Then checks skip state: `if (skip_next_occurrence) → skip booking`
   - Order of checks doesn't matter since both result in skip

4. **Edge case handling:**
   - If skip datetime passes while paused → system auto-clears it normally
   - If user unpauses after skip datetime passed → skip is already cleared, no issue
   - If user unpauses before skip datetime → skip still applies correctly

### Benefits of This Approach

- **Simple**: No code changes needed, current behavior already correct
- **Predictable**: Skip state is preserved, user sees what they set
- **Flexible**: User can modify skip state even while paused
- **No data loss**: User intent is never lost
- **No surprises**: What you see is what you get

### Implementation Notes

**No code changes needed for MVP:**
- Current implementation already handles this correctly
- Inngest checks pause/active state before booking
- Skip state is preserved in database

**Optional UI enhancements (post-MVP):**
- Add visual indicator when class is both skipped and paused
- Show tooltip: "This skip will apply when you resume this class"
- Confirmation dialog when unpausing: "You have 2 classes with skips set"

### Testing Considerations

**Test scenarios:**
1. Skip class → Pause globally → Verify skip badge still shows → Unpause → Verify skip applies
2. Skip class → Deactivate class → Verify skip badge still shows → Reactivate → Verify skip applies
3. Pause globally → Try to skip class → Verify UI allows it → Verify booking skipped
4. Deactivate class → Try to skip class → Verify UI allows it → Verify booking skipped
5. Skip class → Pause → Wait for skip datetime to pass → Unpause → Verify skip auto-cleared

### Status
**Status**: Pre-MVP - Decision documented, no code changes needed
**Priority**: Low (current behavior is acceptable, just needs to be documented and tested)
**Last Updated**: November 29, 2025
**Decision**: Preserve skip state independently of pause state (Option 4 variant)
**Blocks**: MVP launch (documentation and testing needed)
**Next Steps**:
1. Document this behavior in user-facing help/FAQ
2. Add test scenarios to PRODUCTION_TESTING.md
3. Consider adding UI hints for paused + skipped state (post-MVP)

---

## Skip/Edit Interaction Behavior ✅

### Overview
**STATUS: ✅ COMPLETED - READY FOR PRODUCTION**

When a class has an active skip set (`skip_next_occurrence = true`, `skip_target_datetime` set), we need to determine what happens if the user edits the class details (time, day, branch, etc.).

### Current Behavior

**Skip functionality:**
- User clicks "Skip Next" → System calculates next occurrence and sets both fields
- `skip_next_occurrence = true` (flag for Inngest)
- `skip_target_datetime = "2025-12-01 11:00:00+00"` (specific datetime being skipped)

**Edit functionality:**
- User can edit class via Edit button
- Form pre-populates with current values
- On save, class fields are updated

**The question:** What should happen to skip state when user edits a class?

### Scenarios to Consider

1. **User edits time but same day (e.g., 6:00 AM → 7:00 AM Monday)**
   - Skip is for Monday 6:00 AM
   - After edit, class is Monday 7:00 AM
   - Should skip still apply? To which time?

2. **User edits day but same time (e.g., Monday 6:00 AM → Tuesday 6:00 AM)**
   - Skip is for Monday 6:00 AM
   - After edit, class is Tuesday 6:00 AM
   - Should skip still apply? To which day?

3. **User edits both day and time**
   - Skip target datetime no longer matches class schedule
   - Skip becomes meaningless/invalid

4. **User edits branch or class type (same day/time)**
   - Skip datetime still matches schedule
   - Should skip persist?

5. **User edits booking window hours**
   - Skip datetime still valid
   - But booking window calculation changes
   - Could affect when booking happens

### Options to Consider

**Option 1: Clear skip on ANY edit**
- Any edit to class → Clear both `skip_next_occurrence` and `skip_target_datetime`
- Rationale: Editing indicates user is actively managing the class, skip may no longer be relevant
- Pro: Simple, predictable, no stale data
- Con: User might lose skip they wanted to keep (e.g., just fixing a typo in class name)

**Option 2: Clear skip only on day/time edits**
- Edit day_of_week or class_time → Clear skip
- Edit other fields (branch, class_type, booking_window_hours) → Preserve skip
- Rationale: Skip is tied to specific datetime, other changes don't invalidate it
- Pro: Preserves skip when it's still relevant
- Con: More complex logic, edge cases

**Option 3: Recalculate skip target datetime on edit**
- Edit day/time → Recalculate `skip_target_datetime` based on new schedule
- Other edits → Preserve skip as-is
- Rationale: Preserve user intent to skip "next occurrence" even if schedule changes
- Pro: Most flexible, respects user intent
- Con: Complex, could be confusing (user skipped Monday, edited to Tuesday, now skipping Tuesday?)

**Option 4: Warn user and ask confirmation**
- If skip is active and user edits day/time → Show dialog
- "This class has a skip set for [date]. Changing the schedule will clear the skip. Continue?"
- Pro: User is aware and makes informed decision
- Con: Extra friction, requires UI changes

**Option 5: Prevent edits while skip is active**
- Show message: "Cannot edit class while skip is active. Please unskip first."
- Pro: No data inconsistency possible
- Con: Too restrictive, poor UX

### Recommendation for MVP

**Recommended approach (Option 2 variant):**

1. **Clear skip when day/time changes:**
   - If `day_of_week` or `class_time` is edited → Clear both skip fields
   - Rationale: Skip target datetime no longer matches schedule, becomes invalid
   - Log to console: "Skip cleared due to schedule change"

2. **Preserve skip for other edits:**
   - If only `branch`, `class_type`, or `booking_window_hours` edited → Preserve skip
   - Rationale: Skip datetime still valid for the class schedule

3. **No UI warning for MVP:**
   - Keep it simple, don't add dialog friction
   - Future: Could add "(will clear skip)" hint in form if needed

4. **Server action logic:**
   ```typescript
   // In saveRecurringClass server action
   if (id) {
     // Editing existing class
     const { data: existingClass } = await getRecurringClass(id);

     // Check if day or time changed
     const scheduleChanged =
       existingClass.day_of_week !== data.day_of_week ||
       existingClass.class_time !== data.class_time;

     if (scheduleChanged) {
       // Clear skip when schedule changes
       classData.skip_next_occurrence = false;
       classData.skip_target_datetime = null;
     }
     // Otherwise preserve existing skip fields (don't update them)
   }
   ```

### Benefits of This Approach

- **Predictable**: Schedule changes clear skip, other changes don't
- **Simple**: No UI changes, just server logic
- **Correct**: Prevents invalid skip datetimes
- **Non-breaking**: Doesn't block user actions

### Edge Cases to Handle

1. **Booking window already passed:**
   - If schedule change moves booking window to the past → Don't schedule, show dialog
   - (Already handled by existing "booking window already open" logic)

2. **Skip datetime in the past:**
   - If user edits old skip → Skip already cleared by time-based logic
   - No special handling needed

3. **Multiple rapid edits:**
   - Each edit re-evaluates schedule change
   - Skip cleared on first schedule change, stays cleared

### Implementation Notes

**Files to modify:**
- `app/actions/recurring-classes.ts` (saveRecurringClass function)
  - Add schedule change detection
  - Clear skip fields when schedule changes

**Database:**
- No schema changes needed
- Just update logic

**UI:**
- No changes needed for MVP
- Optional enhancement: Show warning when editing skipped class

### Testing Considerations

**Test scenarios:**
1. Skip class → Edit time only → Verify skip cleared ✓
2. Skip class → Edit day only → Verify skip cleared ✓
3. Skip class → Edit both day and time → Verify skip cleared ✓
4. Skip class → Edit branch only → Verify skip preserved ✓
5. Skip class → Edit class type only → Verify skip preserved ✓
6. Skip class → Edit booking window hours → Verify skip preserved ✓
7. Skip class → Edit multiple fields including time → Verify skip cleared ✓

### Status
**Status**: ✅ COMPLETED (November 30, 2025)
**Priority**: Medium (important for data consistency)
**Last Updated**: November 30, 2025
**Decision**: Clear skip when day/time changes with user confirmation (Option 2 + Option 4 hybrid)
**Implementation**:
- Two-pass confirmation pattern with modal dialog
- User warned BEFORE skip is cleared (shows specific skip date)
- Modal appears before booking window check
- Clear both `skip_next_occurrence` and `skip_target_datetime` on confirmation
**Files Modified**:
- `app/actions/recurring-classes.ts` - Schedule change detection and skip clearing logic
- `components/RecurringClassForm.tsx` - Confirmation modal and handlers
**Testing**: Verified working on local development server ✅

---

## Skip Cleanup with Pause/Inactive - Three-Zone Logic Testing (Pre-MVP)

### Overview
**STATUS: PRE-MVP - PRODUCTION TESTING REQUIRED BEFORE LAUNCH**

The three-zone skip cleanup logic (v2.12) intelligently manages skip fields when users pause their schedule or deactivate individual classes. This feature needs comprehensive production testing to verify all time-based zones work correctly.

### Feature Summary

**What it does:**
- When pausing schedule (global) or deactivating class (per-class), skip fields are cleaned up based on current time relative to booking window and class time
- Three zones determine cleanup behavior:
  - **Zone A** (before booking window): Preserve both fields
  - **Zone B** (inside booking window): Clear flag only, keep datetime for UI
  - **Zone C** (after class time): Clear both fields
- Skip buttons disabled when paused/inactive with helpful tooltips

**Implementation:**
- `app/actions/recurring-classes.ts` - `toggleRecurringClassActive()` with three-zone logic
- `app/actions/user-settings.ts` - `updateSchedulePaused()` with bulk three-zone cleanup
- `components/SkipButton.tsx` - Disabled state UI and tooltips
- `components/ScheduleList.tsx` - Props passing

### Testing Requirements

**Test Document:** `docs/TESTING_SKIP_THREE_ZONE_LOGIC.md`

**Critical tests to complete:**
1. ✅ **Part 1: UI Tests** - Skip buttons disabled when paused/inactive
   - Test 1.1: Skip button disabled when paused (global)
   - Test 1.2: Skip button disabled when inactive (per-class)
2. **Part 2: Zone A Tests** - Before booking window opens
   - Test 2.1: Pause before booking window (preserve both fields)
   - Test 2.2: Deactivate before booking window (preserve both fields)
3. **Part 3: Zone B Tests** - Inside booking window (⚠️ TIMING CRITICAL)
   - Test 3.1: Pause inside booking window (clear flag, keep datetime)
   - Test 3.2: Deactivate inside booking window (clear flag, keep datetime)
4. **Part 4: Zone C Tests** - After class time has passed
   - Test 4.1: Pause after class time (clear both fields)
   - Test 4.2: Deactivate after class time (clear both fields)

**Test Priority:**
- **High Priority**: Part 1 (UI), Part 2 (Zone A), Part 4 (Zone C) - Easy to test
- **Medium Priority**: Part 3 (Zone B) - Requires precise timing inside booking window

### Status
**Status**: ⚠️ PRE-MVP - PRODUCTION TESTING REQUIRED
**Priority**: High (must verify before MVP launch)
**Deployed**: Yes (v2.12 in production)
**Tested**: Partial (UI tests only)
**Blocks**: MVP launch (production testing required)
**Last Updated**: December 1, 2025

### Next Steps
1. Complete all tests in `docs/TESTING_SKIP_THREE_ZONE_LOGIC.md`
2. Document test results in the test file
3. Fix any issues discovered during testing
4. Mark as ✅ COMPLETED once all tests pass

### Notes
- Zone B tests are hardest due to timing requirements (must act inside booking window)
- Tip: Use a class with 2-hour booking window instead of 26 hours for easier Zone B testing
- Console logs verify which zone logic executed (`Zone A`, `Zone B`, or `Zone C`)
- Database field verification required (check `skip_next_occurrence` and `skip_target_datetime` in Supabase)

---

## Admin Dashboard

### Overview
Create a comprehensive admin dashboard for managing users, viewing analytics, and performing administrative operations without direct database access.

### Requirements

1. **User Management**
   - **View all users**: List with search, filter, and sorting
   - **User details**: View full user profile, classes, booking history
   - **Edit users**: Update email, reset password, modify settings
   - **Delete users**: Safe deletion with confirmation and audit logging
   - **User roles**: Implement role-based access (admin, user)
   - **Bulk operations**: Bulk delete, bulk export to CSV

2. **Analytics & Reports**
   - **User metrics**: Total users, active users, new signups over time
   - **Booking metrics**: Success rate, failure rate, retry statistics
   - **Class analytics**: Most popular classes, branches, time slots
   - **System health**: Inngest event status, error rates, response times
   - **Audit logs**: View deleted_users_audit, booking_attempts history

3. **Administrative Tools**
   - **Email management**: Send announcements, notifications to all users
   - **System settings**: Configure global settings (maintenance mode, booking limits)
   - **Database health**: Check for orphaned data, integrity issues
   - **Logs viewer**: View application logs, Inngest logs, error traces
   - **Manual operations**: Trigger manual bookings, re-schedule classes

4. **Security & Access Control**
   - **Admin authentication**: Separate admin login or role-based access
   - **Audit trail**: Log all admin actions (who did what, when)
   - **Permission levels**: Different admin roles (super admin, support, read-only)
   - **2FA for admins**: Two-factor authentication for admin accounts

### Implementation Approach

**Phase 1: Basic User Management**
- Create `/admin` route with auth middleware
- List all users with search and pagination
- View user details page
- Delete user with audit logging

**Phase 2: Analytics Dashboard**
- Create dashboard landing page with key metrics
- Chart library integration (recharts, chart.js)
- User growth charts, booking success rates
- Export reports to CSV

**Phase 3: Advanced Features**
- Bulk operations
- Email management
- System settings
- Logs viewer

### Technical Considerations

**Auth Strategy:**
- Option A: Add `role` field to auth.users (admin, user)
- Option B: Separate admin_users table
- Option C: Check against specific email list in middleware
- **Recommendation**: Option A (simplest, Supabase native)

**UI Framework:**
- Use existing Tailwind CSS setup
- Add chart library: recharts or tremor
- Pagination component for user lists
- Modal components for confirmations

**Database Queries:**
- Create admin-specific server actions
- Use service role client for unrestricted access
- Add indexes for performance (user search, date ranges)
- Cache expensive queries (analytics)

**Security:**
- Middleware to check admin role
- All admin actions logged to audit table
- Rate limiting for sensitive operations
- CSRF protection for destructive actions

### Code Location

- **Routes**: `/app/admin/` (new directory)
  - `page.tsx` - Dashboard landing
  - `users/page.tsx` - User list
  - `users/[id]/page.tsx` - User details
  - `analytics/page.tsx` - Analytics dashboard
  - `logs/page.tsx` - Logs viewer
  
- **Components**: `/components/admin/` (new directory)
  - `UserList.tsx`
  - `UserDetails.tsx`
  - `MetricsCard.tsx`
  - `AnalyticsChart.tsx`
  
- **Actions**: `/app/actions/admin.ts` (new file)
  - `getAllUsers()`
  - `getUserDetails()`
  - `updateUser()`
  - `deleteUserAdmin()`
  - `getAnalytics()`

- **Middleware**: Update `/middleware.ts`
  - Check admin role for /admin routes

### Best Practices to Follow

1. **User Experience**
   - Clear navigation and breadcrumbs
   - Responsive design (mobile-friendly admin panel)
   - Loading states and skeleton screens
   - Toast notifications for actions
   - Keyboard shortcuts for power users

2. **Data Visualization**
   - Use appropriate chart types (line for trends, pie for distribution)
   - Color-coded status indicators
   - Export charts as images or PDF
   - Real-time updates where applicable

3. **Performance**
   - Pagination for large lists (20-50 items per page)
   - Virtual scrolling for very large lists
   - Debounced search
   - Cached analytics queries (5-15 min cache)
   - Lazy load chart data

4. **Audit & Compliance**
   - Log all destructive operations
   - Record admin user who performed action
   - Timestamp all admin actions
   - Ability to view audit trail
   - Compliance with data privacy laws (GDPR, CCPA)

### Benefits

- **No direct database access needed**: Admins use UI instead of SQL
- **Safer operations**: Confirmation dialogs, audit logs
- **Better insights**: Visual analytics instead of raw SQL queries
- **Team collaboration**: Multiple admins can manage users
- **Professional appearance**: Shows maturity of product

### Testing Considerations

- Test admin authentication and role checks
- Test user CRUD operations
- Test pagination and search
- Test analytics calculation accuracy
- Test audit logging
- Test bulk operations (with test data)
- Test permission boundaries (regular users cannot access /admin)

### Status
**Status**: Backlogged - Not currently implemented
**Priority**: Medium (nice-to-have for scaling, not critical for MVP)
**Effort**: Large (2-3 weeks for complete implementation)
**Dependencies**: 
- User deletion administration (v2.9) ✅ Completed
- Role-based access control (needs implementation)
**Last Updated**: November 21, 2025

**Recommendation**:
- Phase 1 (Basic User Management) should be prioritized when moving beyond MVP
- Essential for scaling to 10+ users without direct database access
- Can start small and iterate based on admin needs

---

## Event Cancellation for Pause/Inactive/Skip Actions

**Status:** BACKLOG (Not Implemented)

**Current MVP Behavior:**
- **Delete class**: Inngest events ARE canceled (sends `booking/cancel` event)
- **Make class inactive**: Inngest events are NOT canceled (events still fire, runtime protection prevents booking)
- **Pause schedule**: Inngest events are NOT canceled (events still fire, runtime protection prevents booking)
- **Skip next occurrence**: Inngest event is NOT canceled (event fires, skip flag prevents booking)

**Runtime Protection (Current):**
- `getClassById()` filters by `active = true` - inactive classes return null
- Booking function checks `schedule_paused` flag at runtime
- Booking function checks `skip_next_occurrence` flag at runtime
- Events that can't find active classes or detect pause/skip return early with "Class not found" or "Skipped" status
- **No actual bookings occur**, but events appear in Inngest logs

**Why Current Design:**
- Runtime checks provide defense-in-depth protection
- Simpler than managing event cancellation for every state change
- Daily scheduler (midnight UTC) only schedules active classes going forward
- Acceptable for MVP (extra event runs are harmless, <5% of free tier usage)

**Proposed Enhancement:**
Implement event cancellation when user pauses, deactivates a class, or sets skip flag:
- Send `booking/cancel` event when:
  - User sets `schedule_paused = true` (cancel all active class events for this user)
  - User sets class `active = false` (cancel this class's next event)
  - User sets `skip_next_occurrence = true` (cancel this class's next event)
- Reduces noise in Inngest logs (cleaner event history)
- More explicit user intent (if user pauses, they don't want events queued)

**Implementation Approach:**
1. **Pause action** (`app/actions/user-settings.ts`):
   ```typescript
   // After setting schedule_paused = true
   const { data: activeClasses } = await supabase
     .from('recurring_classes')
     .select('id, day_of_week, class_time, timezone, booking_window_hours')
     .eq('user_id', user.id)
     .eq('active', true)

   for (const classItem of activeClasses) {
     const nextOccurrence = calculateNextOccurrence(...)
     await inngest.send({
       name: 'booking/cancel',
       data: { classId: classItem.id, classDate: nextOccurrence.toISOString() }
     })
   }
   ```

2. **Inactive action** (`app/actions/recurring-classes.ts`):
   ```typescript
   // After setting active = false
   const nextOccurrence = calculateNextOccurrence(...)
   await inngest.send({
     name: 'booking/cancel',
     data: { classId: id, classDate: nextOccurrence.toISOString() }
   })
   ```

3. **Skip action** (`app/actions/recurring-classes.ts`):
   ```typescript
   // After setting skip_next_occurrence = true
   await inngest.send({
     name: 'booking/cancel',
     data: { classId: id, classDate: skipTargetDatetime }
   })
   ```

**Benefits:**
- Cleaner Inngest logs (only events that should actually run)
- Consistent with delete behavior (delete cancels events)
- More intuitive for monitoring/debugging
- Reduces noise when scaling to more users

**Risks:**
- Added complexity (more places to track event cancellation)
- Need to ensure cancellation logic matches scheduling logic
- Edge cases: What if user unpauses before midnight? (Immediate scheduling feature handles this)

**Effort:** ~2-4 hours
- Backend changes: 3 locations (pause, inactive, skip)
- Testing: Verify events canceled correctly, no duplicate cancellations
- Edge case handling: Unpause/reactivate/unskip scenarios

**When to Implement:**
- When log noise becomes a problem (50+ users)
- When Inngest execution quota becomes a concern
- When monitoring/alerting gets confused by expected failures
- When you want perfect log hygiene for production system

**Decision Made:** Ship MVP without event cancellation. Rely on runtime protection. Add to backlog for future consideration if scaling beyond 10-15 users.

**Last Updated:** December 29, 2025

---

## Review Support Email Before MVP Launch (Pre-MVP)

### Overview
**STATUS: PRE-MVP - MUST REVIEW BEFORE LAUNCH**

Error pages (404, error boundary, global error) now include `help@beerock.com` as the support contact. Before MVP launch, review whether this email address is still correct or if a different contact method should be used.

### Current Implementation

**Error pages with support email:**
- `app/not-found.tsx` - 404 page: "Need help? help@beerock.com"
- `app/error.tsx` - Error boundary: "If this keeps happening, email us at help@beerock.com with the reference above."
- `app/global-error.tsx` - Global error: Same message with reference included

**Email features:**
- Mailto links pre-fill subject line with error reference (digest) when available
- Users can click to open email client with context included
- Consistent messaging across all error pages

### Pre-Launch Checklist

- [ ] Confirm `help@beerock.com` is the correct support email
- [ ] Verify email inbox is set up and monitored
- [ ] Consider if a different contact method is preferred (contact form, other email)
- [ ] Update error pages if email address changes
- [ ] Test mailto links work correctly

### Files to Update (if email changes)

1. `app/not-found.tsx` - Line ~150
2. `app/error.tsx` - Line ~155
3. `app/global-error.tsx` - Line ~147
4. `public/preview-global-error.html` - Line ~213 (preview file, can delete after review)

### Status
**Status**: Pre-MVP - Must review before launch
**Priority**: Low (quick review, not blocking)
**Last Updated**: January 2, 2026
**Next Steps**:
1. Confirm support email address before MVP
2. Update error pages if needed
3. Delete preview file after review complete

---

## SEO & Marketing (Pre-MVP)

### Overview
**STATUS: PRE-MVP - COMPLETE BEFORE/AT LAUNCH**

SEO foundation is implemented (v2.19). These items should be completed before or shortly after MVP launch.

### Implemented (v2.19)
- [x] Per-page metadata (titles, descriptions)
- [x] Dynamic sitemap (`/sitemap.xml`)
- [x] Robots.txt (`/robots.txt`)
- [x] Favicon (SVG + PNG fallbacks)
- [x] Open Graph images (dynamic generation)
- [x] Twitter card images
- [x] Canonical URLs
- [x] Noindex for protected/prototype pages

### High Priority (Pre-Launch)

- [ ] **Production domain configuration** - Set `NEXT_PUBLIC_SITE_URL` in Vercel environment variables once domain is decided. This enables proper canonical URLs, OG images, and sitemap generation.
- [ ] **Google Search Console setup** - Verify domain ownership, submit sitemap at `https://yourdomain.com/sitemap.xml`
- [ ] **Manifest.json (PWA)** - App name, icons, theme colors for "Add to Home Screen" capability

### Medium Priority (Launch or Shortly After)

- [ ] **Structured data (JSON-LD)** - Add WebApplication schema markup for rich search results
- [ ] **Analytics setup** - Google Analytics 4 or privacy-focused alternative (Plausible, Fathom)
- [ ] **Core Web Vitals audit** - Run Lighthouse, check LCP, FID, CLS scores, optimize if needed

### Lower Priority (Post-Launch)

- [ ] **Blog/content pages** - For organic traffic targeting "how to book gym classes automatically" searches
- [ ] **Landing page A/B testing** - Optimize conversion copy and CTA placement

### Technical Notes

**Environment Variable:**
```
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Used by:
- `app/layout.tsx` - metadataBase for absolute URLs
- `app/sitemap.ts` - Sitemap URLs
- `app/robots.ts` - Sitemap reference

**Sitemap includes:**
- `/` (priority 1.0)
- `/login` (priority 0.5)
- `/signup` (priority 0.8)

**Robots.txt blocks:**
- `/dashboard/` (protected content)
- `/prototype/` (internal design demos)
- `/api/` (API endpoints)

### Status
**Status**: Pre-MVP - In Progress
**Priority**: Medium
**Last Updated**: January 2, 2026

---

