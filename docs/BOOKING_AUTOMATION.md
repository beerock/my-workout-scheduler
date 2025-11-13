# Booking Automation System

This document describes the automated booking system that runs via GitHub Actions to book workout classes on the YMCA Daxko platform.

## Overview

The automation system:
1. Runs every 15 minutes via GitHub Actions cron schedule
2. Queries the database for classes that need booking
3. Uses Puppeteer to automate the booking process on the gym website
4. Records all attempts in the `booking_attempts` table
5. Handles errors gracefully and logs results

## Architecture

### Components

1. **GitHub Actions Workflow** (`.github/workflows/booking-automation.yml`)
   - Scheduled to run every 15 minutes (`*/15 * * * *`)
   - Can be manually triggered via `workflow_dispatch`
   - Sets up Node.js environment and runs the automation script

2. **Main Automation Script** (`scripts/run-booking-automation.ts`)
   - Entry point for the automation
   - Queries database for classes needing booking
   - Groups classes by user
   - Orchestrates the booking process
   - Logs results and handles errors

3. **Database Helpers** (`scripts/database-helpers.ts`)
   - `getClassesNeedingBooking()`: Queries for classes due for booking
   - `createBookingAttempt()`: Records booking attempts
   - `updateBookingAttempt()`: Updates attempt status
   - `clearSkipDate()`: Clears skip dates after processing
   - `getGymCredentials()`: Retrieves and decrypts credentials

4. **Puppeteer Booking Script** (`scripts/booking-automation.ts`)
   - Handles browser automation
   - Logs into gym website
   - Selects branch
   - Finds and books classes
   - Takes screenshots for debugging

## Booking Logic

### When a Class is Booked

A class is eligible for booking when ALL of the following are true:

1. ✅ `recurring_classes.active = true`
2. ✅ User's `schedule_paused = false` (or null)
3. ✅ `next_skip_date` is NULL or not equal to today
4. ✅ Booking window is open: `current_time >= class_datetime - booking_window_hours`

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

## Booking Process Flow

1. **Query Database**
   - Get all active classes
   - Filter by pause status and skip dates
   - Check booking windows
   - Join with gym credentials

2. **Group by User**
   - Classes are grouped by `user_id`
   - Credentials are decrypted once per user

3. **For Each Class**
   - Create `booking_attempt` record with status `'pending'`
   - Launch Puppeteer browser
   - Navigate to gym URL
   - Login with credentials
   - Select branch
   - Navigate to target day's schedule
   - Find class matching type and time
   - **TWO-STEP BOOKING PROCESS:**
     - **Step 1:** Click RESERVE button on class list → navigates to class description page
     - **Step 2:** On class description page:
       - Select checkbox next to user's name in "Active Members" section
       - Click RESERVE or WAITLIST button
       - Navigate to confirmation page
   - Verify result using confirmation page keywords ("Awesome!", "Now that reservation is complete")
   - Update `booking_attempt` with final status

4. **Result Statuses**
   - `'confirmed'`: Successfully booked
   - `'waitlisted'`: Added to waitlist
   - `'failed'`: Booking failed (error logged)
   - `'skipped'`: Skipped due to `next_skip_date`

## YMCA Daxko Booking Flow Details

The YMCA Daxko platform requires a **two-step booking process**:

### Step 1: Class List → Class Description Page
- Find class on schedule page by type and time
- Click RESERVE button on class row
- **Result:** Navigates to class description/reservation page

### Step 2: Class Description Page → Confirmation
The class description page shows:
- Class details (name, location, time, duration)
- "Select Group Members for Reservation" section
- "Active Members" list with checkboxes next to member names
- RESERVE button (or WAITLIST if class is full)

**Required actions:**
1. ✅ Select checkbox next to user's name
2. ✅ Click RESERVE or WAITLIST button

**Result:** Navigates to confirmation page

### Step 3: Confirmation Page
The confirmation page displays:
- "Awesome!" heading
- Green checkmark icon
- "Now that reservation is complete, you can..." text
- Class details and booked user's name

**Detection keywords:**
- Primary: `"awesome!"`, `"now that reservation is complete"`
- Fallback: `"reservation is complete"`, `"reserved"`, `"booking confirmed"`

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
- `01-initial-page`: After navigating to gym URL
- `02-login-failed`: If login fails
- `03-after-login`: After successful login
- `04-branch-selection-failed`: If branch selection fails
- `04-after-branch-selection`: After selecting branch
- `05-navigation-failed`: If day navigation fails
- `05-schedule-page`: After navigating to schedule
- `06-after-booking-attempt`: After booking attempt

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

## YMCA Daxko Platform

### Target Website
- URL: `https://ops1.operations.daxko.com/Online/4032/GXP/ClassSchedule.mvc`
- Requires login (username/password)
- Has branch selection dropdown
- Shows class schedule in table/list format

### Button States
- **"RESERVE"**: Available → Click to book → Status: `'confirmed'`
- **"ADD TO WAITLIST"**: Full but waitlist available → Click → Status: `'waitlisted'`
- **"RESERVED"**: Already booked → No action → Status: `'confirmed'`
- **"FULL"**: No spots, no waitlist → Status: `'failed'`

### Selectors

The Puppeteer script uses flexible selectors to find elements:
- **Username field**: `input[name="username"]`, `input[id*="user"]`, etc.
- **Password field**: `input[type="password"]`
- **Login button**: `button[type="submit"]`, `button:has-text("Login")`, etc.
- **Branch selector**: `select[name*="branch"]`, `select[id*="branch"]`, etc.
- **Day navigation**: `a:has-text("Monday")`, `button:has-text("Monday")`, etc.
- **Class rows**: `tr`, `.class-item`, `.schedule-item`, etc.
- **Booking buttons**: `button:has-text("RESERVE")`, `button:has-text("WAITLIST")`, etc.

**Note**: The actual selectors may need adjustment based on the real YMCA Daxko platform structure. Test and update selectors as needed.

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

## Future Enhancements

Potential improvements:
- Email notifications for booking results
- Retry logic for transient failures
- Browser session reuse (login once per user)
- More robust timezone handling
- Support for multiple gym platforms
- Webhook notifications
- Dashboard for monitoring bookings

