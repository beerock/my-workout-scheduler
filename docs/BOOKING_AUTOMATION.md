# Booking Automation System

This document describes the automated booking system that uses Inngest event-driven scheduling and GitHub Actions with Puppeteer to book workout classes via YMCA/GroupExPro.

## Overview

The automation system:
1. Daily scheduler (Inngest cron) calculates booking window times for all active classes
2. Inngest fires events 90s before each booking window opens (early-start optimization)
3. GitHub Actions runs Puppeteer to navigate YMCA schedule, login to GroupExPro, and land on class details page
4. Puppeteer waits for the exact booking window moment, refreshes, and clicks "Reserve a Spot"
5. Records all attempts in the `booking_attempts` table and sends email notifications

## Architecture

### Components

1. **Inngest Scheduler** (`lib/inngest/scheduler.ts`)
   - Calculates exact booking window open times per class
   - Fires `booking/attempt` events 90s before window opens (early-start)
   - Sends `booking/cancel` events to prevent duplicate runs

2. **Inngest Functions** (`lib/inngest/functions.ts`)
   - `bookClassFunction`: Orchestrates booking flow - triggers GitHub Actions via workflow_dispatch, waits for result
   - `dailySchedulerFunction`: Daily cron that schedules all active classes
   - Handles class full retries (every 15 minutes until class starts)
   - Sends email notifications on success/failure

3. **GitHub Actions Workflow** (`.github/workflows/booking-automation.yml`)
   - Triggered via `workflow_dispatch` from Inngest (not cron)
   - Receives `class_id` and `expected_booking_time` as inputs
   - Sets up Node.js environment and runs Puppeteer automation

4. **Puppeteer Booking Script** (`scripts/booking-automation.ts`)
   - YMCA schedule navigation -> GroupExPro login -> class details page
   - `waitForBookingWindow()`: Early-start wait-and-refresh (sleeps until 2s before window, refreshes every 2s)
   - `completeGroupExProBooking()`: Clicks "Reserve a Spot" or "Join the Waitlist"
   - Takes screenshots at key steps for debugging

5. **Database Helpers** (`scripts/database-helpers.ts`)
   - `getAllActiveClasses()`: Get all active recurring classes
   - `createBookingAttempt()`: Records booking attempts
   - `updateBookingAttempt()`: Updates attempt status
   - `checkExistingBooking()`: Check for duplicate bookings

## Booking Logic

### When a Class is Booked

A class is eligible for booking when ALL of the following are true:

1. ✅ `recurring_classes.active = true`
2. ✅ User's `schedule_paused = false` (or null)
3. ✅ `next_skip_date` is NULL or not equal to today
4. ✅ Booking window is open: `current_time >= class_datetime - booking_window_hours`
5. ✅ No existing successful booking (confirmed or waitlisted) for the upcoming class occurrence

### Booking Window Calculation

The booking window opens when:
```
booking_window_opens = class_datetime - booking_window_hours
```

For example:
- Class on Monday at 6:00 PM
- Booking window: 24 hours
- Booking opens: Sunday at 6:00 PM

### Skip Date Handling

If `next_skip_date` equals today:
- The class is **skipped** (not booked)
- A `booking_attempt` record is created with status `'skipped'`
- The `next_skip_date` is **cleared** (set to NULL)
- This allows the class to be booked normally on the next occurrence

### Duplicate Prevention

The system prevents duplicate booking attempts for the same class occurrence:

**How it works:**
- Before attempting to book, the system checks `booking_attempts` for successful bookings (status = `'confirmed'` or `'waitlisted'`)
- For each successful booking, it calculates which class occurrence it was for based on the `attempt_timestamp` and booking window
- If a successful booking exists for the upcoming class occurrence **and** the class time hasn't passed yet, the class is skipped
- Once the class time has passed, the system allows booking again for the next week's occurrence

**Behavior:**
- ✅ **Already booked/waitlisted:** Skips booking (no Puppeteer launched)
- ✅ **Class time passed:** Allows booking for next week's occurrence
- ✅ **Manual cancellation:** Won't re-book (since successful booking record exists)
- ✅ **Class full (no waitlist):** Keeps retrying until successful (no successful booking record exists yet)

**Example:**
- Friday 7:30 AM class with 26-hour booking window
- Booking window opens Thursday 5:30 AM
- First automation run at 7:30 AM Thursday: Books successfully → status `'confirmed'`
- Second automation run at 7:45 AM Thursday: Sees existing booking → **skips** (no Puppeteer)
- After Friday 7:30 AM: Class time passed → allows booking for next Friday

## Booking Process Flow

1. **Daily Scheduling** (Inngest cron, runs daily at midnight UTC)
   - Queries all active classes from database
   - Calculates next booking window open time for each class
   - Fires `booking/attempt` events with `ts` set to 90s before window opens

2. **Early-Start Trigger** (Inngest, ~90s before booking window)
   - Inngest fires the event, which triggers `bookClassFunction`
   - Function validates class is still active, not paused, not skipped
   - Triggers GitHub Actions workflow via `workflow_dispatch` with `class_id` and `expected_booking_time`

3. **Puppeteer Automation** (GitHub Actions)
   - **Step 1:** Navigate to YMCA schedule with date + branch filter
   - **Step 2:** Find target class on schedule by name and time
   - **Step 3:** Check class state (available, full, cancelled, no registration)
   - **Step 4:** Click Register link -> redirects to GroupExPro login
   - **Step 5:** Login to GroupExPro with encrypted credentials
   - **Step 5.5:** `waitForBookingWindow()` - if arrived early, sleep until 2s before window, then refresh every 2s until "not yet available" text disappears (up to 15 attempts)
   - **Step 6:** `completeGroupExProBooking()` - click "Reserve a Spot" or "Join the Waitlist"
   - Send result event back to Inngest

4. **Result Handling** (Inngest)
   - Receives `booking/result` event from GitHub Actions
   - Updates `booking_attempts` table
   - Sends email notification (success, failure, retry, or no-registration info)
   - If class is full: schedules retry in 15 minutes
   - If no registration: sends friendly info email, no retry

5. **Result Statuses**
   - `'confirmed'`: Successfully booked
   - `'waitlisted'`: Added to waitlist
   - `'failed'`: Booking failed (error logged)
   - `'skipped'`: Skipped due to skip settings
   - `'no_registration'`: Class doesn't offer online registration (info email sent)

## YMCA/GroupExPro Booking Flow Details

The booking uses a hybrid flow: YMCA schedule for class discovery, GroupExPro for authentication and booking.

### Step 1: YMCA Schedule -> Register Link
- Navigate to YMCA schedule page with date and branch filters
- Find target class by name (fuzzy match) and time
- Click the "Register" link on the class row
- **Result:** Redirects to GroupExPro login page

### Step 2: GroupExPro Login -> Class Details
- Login form with username/password
- After login, redirected to class details page
- **Key insight:** You can reach this page BEFORE the booking window opens

### Step 3: Early-Start Wait (if applicable)
- If `expectedBookingTime` is in the future, the page shows: "This class is not yet available for sign-up"
- `waitForBookingWindow()` sleeps until 2s before the window, then refreshes every 2s
- Once the "not yet available" text disappears, the page shows action buttons

### Step 4: Class Details -> Booking
The class details page shows:
- Class information (name, date, time, location)
- Checkbox next to member name (usually pre-checked)
- **"Reserve a Spot"** button (if spots available)
- **"Join the Waitlist"** button (if class is full but waitlist available)
- **"Cancel Reservation"** / **"Cancel Waitlist"** (if already booked)

**Required actions:**
1. ✅ Ensure checkbox is checked next to member name
2. ✅ Click "Reserve a Spot" or "Join the Waitlist"

**Already booked detection:**
- "Cancel Reservation" text -> already confirmed
- "Cancel Waitlist" text -> already on waitlist

## Error Handling

### Login Failures
- Status: `'failed'`
- Error message: "Login failed: [reason]"
- Screenshot saved for debugging

### Branch Selection Failures
- Status: `'failed'`
- Error message: "Branch selection failed: [reason]"
- Lists available branches if branch not found

### Class Not Found
- Status: `'failed'`
- Error message: "Class [type] at [time] not found on schedule"

### Class Description Page Issues
- **Checkbox not found:** Warning logged, continues (may already be selected)
- **RESERVE/WAITLIST button not found:** Status `'failed'`, error message logged
- **Navigation timeout:** Continues and checks current page

### Already Reserved
- Status: `'confirmed'`
- Error message: "Class already reserved"
- No action taken (prevents duplicate booking)

### Class Full (No Waitlist)
- Status: `'failed'`
- Error message: "Class is full and no waitlist option available"

### Timeout Errors
- Status: `'failed'`
- Error message: "Timeout: [operation]"
- Screenshot saved

## Screenshots

Screenshots are automatically taken at key points:
- `01-ymca-schedule`: After navigating to YMCA schedule
- `02-class-found`: After finding class on schedule
- `03-groupexpro-login-failed`: If GroupExPro login fails
- `04-after-wait`: After early-start wait-and-refresh completes
- `05-booking-result`: After booking attempt
- `99-error`: On unexpected errors

Screenshots are:
- Saved to `screenshots/` directory
- Uploaded as GitHub Actions artifacts (retained for 7 days)
- Can be used for debugging failed bookings

## Environment Variables

### Required for GitHub Actions

Set these as GitHub Secrets:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (bypasses RLS)
- `ENCRYPTION_KEY`: Same encryption key used in the web app

### Local Testing

Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_encryption_key
```

## Running Locally

### Test Database Query
```bash
npx tsx scripts/test-booking-query.ts
```

### Run Full Automation
```bash
npx tsx scripts/run-booking-automation.ts
```

### Run with Non-Headless Browser (for debugging)
Edit `scripts/booking-automation.ts` and change:
```typescript
browser = await puppeteer.launch({
  headless: false, // Change to false
  // ...
})
```

## Early-Start Optimization (v2.32)

### How It Works
1. Inngest fires the booking event **90 seconds before** the booking window opens
2. GitHub Actions starts, Puppeteer navigates to YMCA schedule, finds class, clicks Register
3. GroupExPro login completes, landing on class details page
4. If arrived before booking window: page shows "not yet available for sign-up" error
5. `waitForBookingWindow()` sleeps until 2s before window, then refreshes every 2s
6. Once booking window opens (text disappears), clicks "Reserve a Spot"

### Timing
- **Before early-start:** ~57s median delay (25s GH Actions overhead + 32.5s Puppeteer navigation)
- **With early-start:** ~2-4s after window opens (all prep done during the 90s early window)

### Edge Cases
| Scenario | Handling |
|---|---|
| GH Actions outlier (2.5+ min cold start) | Booking window already passed, skips wait, proceeds normally |
| Server clock drift | 15 refreshes over 30s covers up to 30s drift |
| Login fails | Fails before wait step - no time wasted |
| Already booked at same time | Detected on class details page |
| 15 refreshes exhausted | Proceeds anyway, `completeGroupExProBooking` handles gracefully |

## GroupExPro Platform

### Target Flow
- YMCA schedule page (public) -> Register link -> GroupExPro login -> Class details -> Booking
- GroupExPro handles authentication and booking separately from the YMCA schedule

### Button States
- **"Reserve a Spot"**: Available -> Click to book -> Status: `'confirmed'`
- **"Join the Waitlist"**: Full but waitlist available -> Click -> Status: `'waitlisted'`
- **"Cancel Reservation"**: Already booked -> No action -> Status: `'confirmed'`
- **"Cancel Waitlist"**: Already on waitlist -> No action -> Status: `'waitlisted'`

## Security Considerations

1. **Encryption Key**
   - Never commit `ENCRYPTION_KEY` to repository
   - Store only in GitHub Secrets
   - Use same key as web app for consistency

2. **Service Role Key**
   - Only use in server-side scripts (GitHub Actions)
   - Never expose in client code
   - Bypasses RLS (by design for automation)

3. **Screenshots**
   - May contain sensitive information
   - Automatically deleted after 1 minute (configurable)
   - Uploaded to GitHub Actions artifacts (private)

4. **Password Handling**
   - Passwords are decrypted in memory only
   - Never logged or stored in plain text
   - Screenshots may show password fields (be careful)

## Monitoring

### GitHub Actions
- View workflow runs in GitHub Actions tab
- Check logs for detailed execution info
- Download screenshots from artifacts if booking fails

### Database
- Query `booking_attempts` table for booking history
- Check `status` field for results
- Review `error_message` for failures

### Logs
The automation script logs:
- Total classes processed
- Confirmed bookings
- Waitlisted bookings
- Failed bookings
- Skipped bookings
- Errors
- Duration

## Troubleshooting

### Booking Not Running
1. Check GitHub Actions workflow is enabled
2. Verify cron schedule is correct
3. Check workflow logs for errors
4. Verify environment variables are set

### Login Failures
1. Verify credentials in database are correct
2. Check if gym website structure changed
3. Review screenshot `02-login-failed`
4. Update selectors in `booking-automation.ts` if needed

### Class Not Found
1. Verify class type and time match exactly
2. Check if class schedule structure changed
3. Review screenshot `05-schedule-page`
4. Verify branch is correct
5. Check if class exists on target day

### Branch Selection Issues
1. Verify branch name matches exactly (case-insensitive)
2. Check available branches in error message
3. Review screenshot `04-branch-selection-failed`
4. Update branch name in `recurring_classes` if needed

### Wrong Date Calculated (Classes Skipped to Next Week)
- `Intl.DateTimeFormat` with `hour12: false` can return hour `24` at midnight on some Node.js/ICU versions, making the code think the class time already passed
- **Fix:** Always use `hourCycle: 'h23'` (guarantees 0-23 range) instead of `hour12: false`
- Affects: `booking-automation.ts`, `database-helpers.ts`, `create-test-class.ts`

### Action Buttons Not Found on Class Details Page
- `page.waitForFunction` using `document.body.innerText` doesn't include text inside button/link elements in headless Chrome
- **Fix:** Use `document.body.innerHTML` instead, which matches all element content reliably
- The wait resolves instantly when the page is loaded; 10s timeout is only a safety net

## Future Enhancements

Potential improvements:
- Playwright migration (replace Puppeteer for better stability)
- Browser session reuse (login once per user)
- Support for multiple gym platforms
- Real-time dashboard updates via WebSocket

