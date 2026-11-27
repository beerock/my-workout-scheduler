# Booking Automation System

**Last Updated:** November 26, 2026 (v2.38 - GroupExPro schedule feed + Daxko booking)

This document describes the automated booking system that uses Inngest event-driven scheduling and GitHub Actions to book workout classes at the YMCA of WNC: the class is looked up in GroupExPro's public schedule feed, then Puppeteer logs in and reserves through Daxko.

## Overview

The automation system:
1. Daily scheduler (Inngest cron) calculates booking window times for all active classes
2. Inngest fires events 90s before each booking window opens (early-start optimization)
3. GitHub Actions looks the class up in the GroupExPro schedule feed (plain HTTP, no browser), then Puppeteer opens its sign-up URL, logs in through Daxko, and lands on the Daxko class page (ChooseMembers)
4. Puppeteer waits for the exact booking window moment, refreshes, selects the member, and clicks "Reserve"
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
   - `findClassInGroupExFeed()`: finds the class in the GroupExPro JSON feed, returns its sign-up URL (exported; `scripts/test-class-state-detection.ts` is a CLI wrapper)
   - `performDaxkoLogin()`: sign-up URL -> Daxko 2-step login -> Daxko ChooseMembers page
   - `waitForBookingWindow()`: Early-start wait-and-refresh (sleeps until 2s before window, refreshes every 2s)
   - `completeDaxkoBooking()`: selects the member checkbox and clicks "Reserve" (same button for reserve and waitlist)
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
   - **Step 1:** Calculate the target date in gym timezone
   - **Step 2:** Find the class in the GroupExPro schedule feed by branch, date, start time and name
   - **Step 4:** Stop early only if the feed says cancelled or no online registration. Full / waitlist are never decided from the feed (it can lag) - the live Daxko page decides
   - **Step 5:** Open the sign-up URL -> redirects to Daxko login (email, then password) -> Daxko ChooseMembers page
   - **Step 5.5:** `waitForBookingWindow()` - if arrived early, sleep until 2s before window, then refresh every 2s until the "Reservation Window ... will open" notice disappears (up to 15 attempts)
   - **Step 6:** `completeDaxkoBooking()` - select the member, click "Reserve"
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

## Booking Flow Details (Feed + Daxko)

History: Daxko login/booking until March 2026, GroupExPro's own login March-November 2026, then Daxko again after the YMCA's November 2026 site redesign. The redesign also moved the ymcawnc.org schedule into an iframe that loads the GroupExPro feed, which broke DOM scraping.

### Step 1: GroupExPro Schedule Feed -> Sign-up URL
- `GET https://groupexpro.com/schedule/embed/json_schedule.php?schedule=&instructor_id=true&format=jsonp&a=89&location=<id>&start=<unix>&end=<unix>` - public JSON (`aaData` rows), no auth, no browser
- Location IDs: Asheville 470, Black Mountain 3316, Corpening Memorial 473, Ferguson Family 2858, Hendersonville Family 472, Reuter Family 461, Woodfin 471 (`GROUPEX_LOCATION_IDS`)
- Row columns: `[0]` "Friday, November 27, 2026", `[1]` "6:00am-6:55am", `[2]` title (`CANCELED:` prefix = cancelled), `[9]` sign-up HTML
- Sign-up link `a.signUpGXP`: `href` = `https://groupexpro.com/gxp/reservations/schedule/index/<classId>/<M>/<D>/<YYYY>`, plus informational `textmsg` / `data-details` / `start-info` (logged only). Present even before the window opens
- No sign-up link -> `no_registration`. Every row still has a Description link (`a.descGXP`, `data-path` = same sign-up URL), but Daxko returns "An error has occured" for these classes, so the feed is the source of truth
- `CANCELED:` title -> `cancelled`. Decided from the feed on purpose: Daxko's ChooseMembers page shows cancelled classes as normal and bookable (verified Nov 2026)

### Step 2: Daxko Login -> ChooseMembers
- The sign-up URL redirects (client-side JS) to `operations.daxko.com/online/4032/Security/login.mvc/find_account`
- 2-step login: `#user_name` + SUBMIT, then password + Login ("Keep me logged in" left unchecked)
- Lands on `operations.daxko.com/online/4032/GXP/ChooseMembers.mvc?class_id=...`. Reachable before the booking window opens

### Step 3: Early-Start Wait (if applicable)
- Before the window: "The Reservation Window for Active Members will open on ..." notice, member checkbox and Reserve disabled
- `waitForBookingWindow()` sleeps until 2s before the window, then refreshes every 2s until the notice disappears

### Step 4: ChooseMembers -> Booking
- `input.member_checkbox` per household member (`data-email-id`, `data-is-reserved`, `data-mem-waitlist-status`); the one matching the login email is selected
- `button#reservation_button` "Reserve" - same label when joining a waitlist ("Accepting Spot in WaitList")
- Confirmation page text: "Awesome! ... Now that reservation is complete" / "Now that you are in waitlist"

**Page states:**
| Page shows | Result |
|---|---|
| `data-is-reserved="True"` | `confirmed` (alreadyBooked) |
| `data-mem-waitlist-status="True"` | `waitlisted` (alreadyBooked) |
| "Reservation Window ... will open" | `failed` - sign-ups not open yet |
| "Oh no! You missed it, Slots are fully booked." (checkbox disabled) | `failed` + "full" -> 15-min retries |
| Reserve clicked -> "reservation is complete" | `confirmed` |
| Reserve clicked -> "you are in waitlist" | `waitlisted` |
| `#submit_error_message` shown | conflict / cancelled / full / "YMCA's booking system" error |

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
- Error message contains "full" -> Inngest retries every 15 minutes until class start

### Schedule Feed Unavailable
- Status: `'failed'`
- Error message: "Couldn't load the YMCA class schedule (...)" after one retry. Transient; not a user setup problem

### Timeout Errors
- Status: `'failed'`
- Error message: "Timeout: [operation]"
- Screenshot saved

## Screenshots

Screenshots are automatically taken at key points:
- `03a-daxko-login` / `03b-daxko-password`: Daxko login steps
- `03-daxko-login-failed`: If Daxko login fails
- `04-daxko-choosemembers`: After landing on the class page
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
2. GitHub Actions starts, the class is found in the schedule feed, Puppeteer opens its sign-up URL
3. Daxko login completes, landing on the ChooseMembers page
4. If arrived before booking window: page shows "The Reservation Window ... will open on ..."
5. `waitForBookingWindow()` sleeps until 2s before window, then refreshes every 2s
6. Once booking window opens (notice disappears), selects the member and clicks "Reserve"

### Timing
- **Before early-start:** ~57s median delay (25s GH Actions overhead + 32.5s Puppeteer navigation)
- **With early-start:** ~2-4s after window opens (all prep done during the 90s early window)

### Edge Cases
| Scenario | Handling |
|---|---|
| GH Actions outlier (2.5+ min cold start) | Booking window already passed, skips wait, proceeds normally |
| Server clock drift | 15 refreshes over 30s covers up to 30s drift |
| Login fails | Fails before wait step - no time wasted |
| Already booked at same time | Detected after clicking Reserve (`#submit_error_message`) |
| 15 refreshes exhausted | Proceeds anyway, `completeDaxkoBooking` reports "sign-ups not open yet" |

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

