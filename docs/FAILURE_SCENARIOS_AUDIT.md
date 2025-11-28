# Booking Failure Scenarios Audit

**Last Updated:** November 28, 2025 (v2.10)

This document audits all possible failure scenarios in the booking automation, their retry behavior, and user-facing error messages.

---

## Quick Reference

| Scenario | Status | Retry Type | User Impact |
|----------|--------|------------|-------------|
| Booking window not open | `failed` | Fast retry (9×5s) | Temporary - system handles automatically |
| Class is full | `failed` | Inngest (15min) | Temporary - keeps trying until class starts |
| Class cancelled | `failed` | None | Permanent - user needs to remove class |
| Class not reservable | `failed` | None | Permanent - user needs to remove class |
| Class already reserved | `confirmed` | None | Success - already booked |
| Class not found | `failed` | None | Likely config error |
| Login failed | `failed` | None | Credentials issue |
| Branch selection failed | `failed` | None | Configuration issue |
| Navigation failed | `failed` | None | Technical issue |
| Skipped (next_skip_date) | `skipped` | None | Intentional skip |

---

## Detailed Failure Scenarios

### 1. Booking Window Not Open Yet

**Code Location:** `scripts/booking-automation.ts:1430-1495`

**Trigger:** Disabled RESERVE button detected, tooltip indicates future booking time

**Error Message:**
```
"Booking window not open after 9 retries (45s) - Reservation starts at MM/DD/YYYY at HH:MM AM/PM"
```

**Status:** `failed`

**Retry Behavior:**
- ✅ **Fast retry:** 9 attempts × 5 seconds = 45 seconds
- ❌ **Inngest retry:** No (doesn't match "full" pattern)

**User Notification:**
- Email/notification shows failure with booking window time
- User can verify if booking window time is correct in database
- If window time is wrong, user updates recurring class settings

**Temporary or Permanent:** Temporary (if triggered too early) / Permanent (if booking window time is wrong)

**Root Causes:**
- Triggered >45 seconds early (clock drift)
- Wrong booking window time in database
- Gym changed their booking rules

**Recommended Action for User:**
- Check `booking_attempts` table for actual window time from tooltip
- Verify recurring class booking window settings
- Update class if needed

---

### 2. Class Is Full (No Waitlist)

**Code Location:** `scripts/booking-automation.ts:1479-1485`

**Trigger:** Class marked as "Full", no RESERVE or WAITLIST button available

**Error Message:**
```
"Class is full - no waitlist option available. Will retry in case spots open up."
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ✅ **Inngest retry:** Every 15 minutes until class starts (no max attempts)

**Inngest Logic:** (`lib/inngest/functions.ts:201`)
```typescript
if (status === 'failed' && errorMessage?.toLowerCase().includes('full')) {
  // Retry every 15 minutes until class starts
}
```

**User Notification:**
- Initial failure email (class is full)
- Success email if spot opens up later
- Final failure if class starts while still full

**Temporary or Permanent:** Temporary (someone might cancel)

**Root Causes:**
- Class filled up before booking window opened
- Other users booked faster
- Class has limited capacity

**Recommended Action for User:**
- Wait - system will keep trying every 15 minutes
- Check if class has waitlist option at gym (might need manual booking)

---

### 3. Class Cancelled

**Code Location:** `scripts/booking-automation.ts:1462-1468`

**Trigger:** Class text includes "Cancelled" or cancelled pill/badge detected

**Error Message:**
```
"Class is cancelled - booking not possible"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No (exits immediately)
- ❌ **Inngest retry:** No (doesn't include "full")

**User Notification:**
- Failure email/notification
- User should remove or modify the recurring class

**Temporary or Permanent:** **Permanent**

**Root Causes:**
- Gym cancelled the class (instructor sick, low attendance, etc.)
- Class was rescheduled to different time
- Permanent schedule change

**Recommended Action for User:**
- Remove recurring class from schedule
- Check gym website for class status
- Book different class or time slot

---

### 4. Class Not Reservable

**Code Location:** `scripts/booking-automation.ts:1470-1476`

**Trigger:** Class text includes "Not Reservable" or not-reservable indicator

**Error Message:**
```
"Class is not reservable - booking not possible"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No (exits immediately)
- ❌ **Inngest retry:** No (doesn't include "full")

**User Notification:**
- Failure email/notification
- User should remove the recurring class

**Temporary or Permanent:** **Permanent**

**Root Causes:**
- Class requires special registration (e.g., program enrollment)
- Class is for members only (different membership level)
- Class doesn't allow online booking

**Recommended Action for User:**
- Check gym website for booking requirements
- Contact gym to understand restrictions
- Remove from automated schedule if can't be booked online

---

### 5. Class Already Reserved

**Code Location:** `scripts/booking-automation.ts:1353-1359, 1413-1419`

**Trigger:** Button text includes "RESERVED" or reserved indicator detected

**Error Message:**
```
"Class already reserved"
```

**Status:** `confirmed` (Success!)

**Retry Behavior:**
- ❌ **Fast retry:** Exits immediately
- ❌ **Inngest retry:** No

**User Notification:**
- Success email/notification
- Shows as confirmed booking

**Temporary or Permanent:** **Success state**

**Root Causes:**
- Successfully booked in previous attempt
- Booked by another process (manual booking, different automation)
- Duplicate booking attempt caught

**Recommended Action for User:**
- No action needed - success!

---

### 6. Class Not Found on Schedule

**Code Location:** `scripts/booking-automation.ts:1344-1350`

**Trigger:** Class not found after searching all loaded results (including "Load more")

**Error Message:**
```
"Class 'ClassName' at HH:MM not found on schedule (searched all loaded results)"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email with class details
- User should verify class configuration

**Temporary or Permanent:** Likely **configuration error**

**Root Causes:**
- Wrong class name in database (typo, different name on website)
- Wrong class time (class moved to different time)
- Wrong day of week
- Wrong branch selected
- Class no longer offered at this gym

**Recommended Action for User:**
- Verify class name matches gym website exactly
- Check class time and day
- Check branch selection
- Update recurring class settings if needed

---

### 7. Class Disappeared After Page Reload

**Code Location:** `scripts/booking-automation.ts:1439-1448`

**Trigger:** Class found initially, but not found after page reload in fast retry loop

**Error Message:**
```
"Class disappeared from schedule after page reload - may have been cancelled or removed"
```

**Status:** `failed`

**Retry Behavior:**
- ✅ **Fast retry:** Yes (triggered during retry loop)
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email indicating class disappeared
- Suggests possible cancellation

**Temporary or Permanent:** Usually **permanent** (class removed/cancelled)

**Root Causes:**
- Class was just cancelled by gym
- Class was removed from schedule
- Temporary website glitch (rare)

**Recommended Action for User:**
- Check gym website to verify class status
- Remove or update recurring class if cancelled

---

### 8. Login Failed

**Code Location:** `scripts/booking-automation.ts:98-105`

**Trigger:** Unable to login to gym website (wrong credentials, website down, etc.)

**Error Message:**
```
"Login failed: [specific error from login function]"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email with login error
- User should check credentials

**Temporary or Permanent:** Depends on cause

**Root Causes:**
- Wrong username/password in database
- Password changed at gym
- Account locked/suspended
- Gym website down (temporary)
- Network issue (temporary)

**Recommended Action for User:**
- Verify credentials in dashboard
- Update password if changed
- Try manual login to gym website
- Contact gym if account issue

---

### 9. Branch Selection Failed

**Code Location:** `scripts/booking-automation.ts:122-129`

**Trigger:** Unable to select specified branch on gym website

**Error Message:**
```
"Branch selection failed: [specific error]"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email with branch error
- User should verify branch name

**Temporary or Permanent:** Likely **configuration error**

**Root Causes:**
- Wrong branch name in database
- Branch no longer exists
- Website structure changed
- Network/page load issue (temporary)

**Recommended Action for User:**
- Verify branch name matches gym website exactly
- Update recurring class if branch changed
- Check if branch is still available

---

### 10. Navigation Failed (Day Selection)

**Code Location:** `scripts/booking-automation.ts:137-144`

**Trigger:** Unable to navigate to target day on schedule

**Error Message:**
```
"Navigation failed: [specific error]"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email with navigation error
- Technical issue indication

**Temporary or Permanent:** Usually **temporary** (website issue)

**Root Causes:**
- Website structure changed
- Page didn't load fully
- Network issue
- Invalid day calculation (rare)

**Recommended Action for User:**
- Check if issue persists on next scheduled attempt
- Verify class configuration (day, time, timezone)
- Report if issue continues (may need code update)

---

### 11. Could Not Find or Click Booking Button

**Code Location:** `scripts/booking-automation.ts:1645-1653`

**Trigger:** Class found, but RESERVE button not clickable or not found

**Error Message:**
```
"Could not find or click booking button for the class"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No (class was found, but button issue)
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email with button error
- Screenshots available for debugging

**Temporary or Permanent:** Usually **temporary** (website issue) or **bug**

**Root Causes:**
- Website structure changed
- Button element changed (ID, class name)
- JavaScript not loaded on page
- Network slowness

**Recommended Action for User:**
- Check screenshots in booking_attempts table
- Report issue (may need code update)
- Try manual booking to verify button exists

---

### 12. No RESERVE Button on Class Description Page

**Code Location:** `scripts/booking-automation.ts:1768-1774`

**Trigger:** Navigated to class details page, but no RESERVE button found

**Error Message:**
```
"No RESERVE button found on class description page"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email with description page error
- Screenshots available

**Temporary or Permanent:** Usually **configuration** or **website change**

**Root Causes:**
- Class doesn't allow online booking
- Website structure changed
- Wrong class selected (name match but different class)

**Recommended Action for User:**
- Check screenshots
- Verify class is bookable online via gym website
- Report if class should be bookable but button missing

---

### 13. Time Conflict (Existing Reservation)

**Code Location:** `scripts/booking-automation.ts:1808-1815`

**Trigger:** Attempting to book class that conflicts with existing reservation

**Error Message:**
```
"Cannot book - you already have a class scheduled at this time (conflicts with existing reservation)"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email indicating time conflict
- User has overlapping class

**Temporary or Permanent:** **Permanent** until conflict resolved

**Root Causes:**
- User manually booked overlapping class
- Another automated class at same time
- Previous booking still active

**Recommended Action for User:**
- Check gym account for existing reservations
- Cancel conflicting class if not needed
- Adjust recurring class schedule to avoid conflict

---

### 14. Booking Result Unclear

**Code Location:** `scripts/booking-automation.ts:1849-1857`

**Trigger:** Clicked RESERVE button, but couldn't determine success/failure from result page

**Error Message:**
```
"Booking result unclear after clicking RESERVE button - check screenshots"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No

**User Notification:**
- Failure email requesting manual verification
- Screenshots available

**Temporary or Permanent:** **Unclear** - requires manual verification

**Root Causes:**
- Website confirmation page changed structure
- Unexpected website response
- Network issue during confirmation
- New booking flow not recognized

**Recommended Action for User:**
- Check screenshots in booking_attempts table
- Manually verify on gym website if class was booked
- Report issue (may need code update to recognize new confirmation pattern)

---

### 15. Unexpected Error (Try-Catch)

**Code Location:** `scripts/booking-automation.ts:184-190`

**Trigger:** Unexpected exception anywhere in booking flow

**Error Message:**
```
"Unexpected error: [error message]"
```

**Status:** `failed`

**Retry Behavior:**
- ❌ **Fast retry:** No
- ❌ **Inngest retry:** No (unless error includes "full")

**User Notification:**
- Failure email with technical error
- Stack trace in logs

**Temporary or Permanent:** Depends on error

**Root Causes:**
- Network timeout
- Website crashed
- Browser crash
- Code bug
- Memory issue

**Recommended Action for User:**
- Check error details in booking_attempts table
- Report if error persists
- Check Inngest logs for stack trace

---

### 16. Skipped (Intentional)

**Code Location:** `scripts/booking-automation.ts:50-56`

**Trigger:** `next_skip_date` equals today's date

**Error Message:**
```
"Skipped: next_skip_date equals today (YYYY-MM-DD)"
```

**Status:** `skipped`

**Retry Behavior:**
- ❌ **Fast retry:** No (intentional skip)
- ❌ **Inngest retry:** No

**User Notification:**
- "Skipped" status in booking_attempts
- User requested skip via "Skip Next" button

**Temporary or Permanent:** **Intentional** (one-time skip)

**Root Causes:**
- User clicked "Skip Next Occurrence"
- User won't attend this specific class

**Recommended Action for User:**
- No action needed - working as intended
- `next_skip_date` auto-clears after skip

---

## Retry Strategy Summary

### Fast Retry (Inside Puppeteer)
- **Trigger:** Booking window not open (disabled button detected)
- **Frequency:** 9 attempts × 5 seconds = 45 seconds
- **Max Coverage:** 45 seconds from initial trigger
- **Location:** `scripts/booking-automation.ts:1366-1457`

### Inngest Retry (Class Full)
- **Trigger:** Error message includes "full" (case-insensitive)
- **Frequency:** Every 15 minutes
- **Max Coverage:** Until class starts (no attempt limit)
- **Location:** `lib/inngest/functions.ts:199-254`

### No Retry
All other failures fail immediately without retry:
- Cancelled classes
- Not reservable classes
- Class not found
- Login failures
- Configuration errors

---

## User Notification Channels

### Current Implementation
Based on code review, notifications are stored in `booking_attempts` table:

| Field | Purpose |
|-------|---------|
| `status` | `confirmed`, `waitlisted`, `failed`, `skipped` |
| `error_message` | User-facing error description |
| `attempt_date` | When attempt was made |
| `class_date` | Which class occurrence |
| `created_at` | Timestamp |

### Future Notification Channels (Not Yet Implemented)
- Email notifications (on Backlog)
- SMS notifications (on Backlog)
- Push notifications (on Backlog)
- Real-time dashboard updates (on Backlog)

**Current User Experience:**
Users must check the dashboard to see booking results in the booking history table.

---

## Recommendations

### 1. Add User-Facing Notifications
**Priority:** High (Post-MVP)
- Email on booking success/failure
- Distinguish temporary vs permanent failures
- Include actionable next steps in emails

### 2. Categorize Errors for Users
**Priority:** Medium
Group errors by action needed:
- ✅ **No Action Needed:** Already reserved, auto-retrying
- ⚠️ **Action Recommended:** Check configuration, update settings
- ❌ **Action Required:** Remove class, fix credentials

### 3. Add Retry Indicators
**Priority:** Medium
Show in dashboard:
- "Retrying every 15 min (class full)"
- "Next retry at: [time]"
- "Retries exhausted - manual action needed"

### 4. Improve Error Messages
**Priority:** Low
Make errors more user-friendly:
- ❌ `"Class 'ClassName' at HH:MM not found on schedule"`
- ✅ `"Class 'ClassName' at HH:MM not found. Check that the class name and time match your gym's website exactly."`

---

## Error Message Testing Checklist

- [ ] All error messages are user-friendly (no technical jargon)
- [ ] Each error includes recommended action
- [ ] Temporary vs permanent failures are clear
- [ ] Retry behavior is communicated to user
- [ ] Screenshots are captured for debugging
- [ ] Error messages help with troubleshooting

---

## Related Documentation
- `docs/BOOKING_AUTOMATION.md` - Booking flow details
- `docs/PRODUCTION_TESTING.md` - Test scenarios
- `lib/inngest/functions.ts` - Retry logic
- `scripts/booking-automation.ts` - Main booking code
