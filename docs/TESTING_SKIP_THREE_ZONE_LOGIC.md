# Testing Three-Zone Skip Cleanup Logic

**Feature:** Skip cleanup with pause/inactive interaction using time-based zones
**Version:** v2.12
**Status:** Ready for production testing

---

## Overview

This document provides a comprehensive test plan for the three-zone skip cleanup logic implemented in v2.12. The feature intelligently manages skip fields when users pause their schedule or deactivate individual classes based on the current time relative to the booking window and class time.

---

## Prerequisites

- Have at least one class configured in your schedule
- Access to your production dashboard at `/dashboard/schedule`
- Access to Supabase database for field verification

---

## Part 1: UI Tests (Easiest to Test)

### Test 1.1: Skip Button Disabled When Paused

**Steps:**
1. Go to `/dashboard/schedule`
2. Set a skip on any class (click "Skip Next")
3. Verify skip badge shows with date
4. Toggle "Pause All Bookings" ON
5. **Expected:**
   - Skip button is grayed out/disabled
   - Hover over "Skip Next" button → Tooltip says "Cannot skip while schedule is paused"
   - Skip badge still shows but × button is disabled
   - Hover over × button → Tooltip says "Cannot skip while schedule is paused"
6. Toggle "Pause All Bookings" OFF
7. **Expected:** Skip button enabled again

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

### Test 1.2: Skip Button Disabled When Class Inactive

**Steps:**
1. Set a skip on any class
2. Toggle that class's "Active" switch OFF
3. **Expected:**
   - Skip button is grayed out/disabled
   - Hover over "Skip Next" button → Tooltip says "Cannot skip inactive class"
   - Skip badge still shows but × button is disabled
   - Hover over × button → Tooltip says "Cannot skip inactive class"
4. Toggle "Active" switch ON
5. **Expected:** Skip button enabled again

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

## Part 2: Zone A Tests (Before Booking Window)

**Zone A Definition:** `now < booking_window_open_time`
- **Action:** Preserve both `skip_next_occurrence` and `skip_target_datetime`
- **Rationale:** Future skip still valid, user may unpause/reactivate before window

---

### Test 2.1: Pause Before Booking Window (Global)

**Setup:**
- Class: Monday 4:15 PM (booking window: 26 hours = opens Sunday 2:15 PM)
- Current time: Saturday (well before booking window)

**Steps:**
1. Saturday: Set skip for next Monday's class
2. Verify skip badge shows "Mon, [date]"
3. Toggle "Pause All Bookings" ON
4. Go to Supabase → `recurring_classes` table → Find your class
5. **Expected:**
   - `skip_next_occurrence` = `true` (preserved)
   - `skip_target_datetime` = `[Monday datetime]` (preserved)
   - No console logs (no cleanup action)
6. Toggle "Pause All Bookings" OFF
7. **Expected:** Skip still active, badge still shows

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

### Test 2.2: Deactivate Before Booking Window (Per-Class)

**Setup:**
- Class: Monday 4:15 PM
- Current time: Saturday (before booking window)

**Steps:**
1. Saturday: Set skip for next Monday's class
2. Toggle class "Active" switch OFF
3. Check database (Supabase → `recurring_classes`)
4. **Expected:**
   - `skip_next_occurrence` = `true` (preserved)
   - `skip_target_datetime` = `[Monday datetime]` (preserved)
   - No console logs
5. Toggle "Active" switch ON
6. **Expected:** Skip still active

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

## Part 3: Zone B Tests (Inside Booking Window)

**Zone B Definition:** `booking_window_open_time <= now < class_time`
- **Action:** Clear `skip_next_occurrence` flag only, keep `skip_target_datetime` for UI
- **Rationale:** Scheduled trigger time passed (no automatic booking), clear flag so manual booking can proceed

**⚠️ TIMING CRITICAL** - These tests require you to act inside the booking window

---

### Test 3.1: Pause Inside Booking Window

**Setup:**
- Class: Monday 4:15 PM (booking window opens Sunday 2:15 PM)
- Current time: Sunday 4:30 PM (AFTER 2:15 PM, BEFORE Monday 4:15 PM)

**Steps:**
1. Before Sunday 2:15 PM: Set skip for Monday's class
2. Wait until Sunday 4:30 PM (inside booking window)
3. Toggle "Pause All Bookings" ON
4. Check database immediately (Supabase → `recurring_classes`)
5. **Expected:**
   - `skip_next_occurrence` = `false` (flag cleared!)
   - `skip_target_datetime` = `[Monday datetime]` (preserved!)
   - Console log: `[updateSchedulePaused] Zone B: Cleared 1 flag(s) inside window`
6. Check UI
7. **Expected:**
   - Skip badge STILL shows "Mon, [date]" (because datetime preserved)
   - But booking won't happen (flag cleared)
8. Toggle "Pause All Bookings" OFF
9. **Expected:**
   - Skip badge still shows
   - No automatic booking (trigger time already passed at 2:15 PM)
   - To book, you'd need to manually trigger

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

### Test 3.2: Deactivate Inside Booking Window

**Setup:**
- Class: Monday 4:15 PM
- Current time: Sunday 4:30 PM (inside booking window)

**Steps:**
1. Before Sunday 2:15 PM: Set skip for Monday's class
2. Wait until Sunday 4:30 PM (after window opens, before class)
3. Toggle class "Active" switch OFF
4. Check database (Supabase → `recurring_classes`)
5. **Expected:**
   - `skip_next_occurrence` = `false` (flag cleared!)
   - `skip_target_datetime` = `[Monday datetime]` (preserved!)
   - Console log: `[toggleRecurringClassActive] Zone B: Clearing flag only (inside window)`
6. Toggle "Active" switch ON
7. **Expected:**
   - Skip badge still visible
   - No automatic booking happens

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

## Part 4: Zone C Tests (Past Class Time)

**Zone C Definition:** `class_time <= now`
- **Action:** Clear both `skip_next_occurrence` and `skip_target_datetime`
- **Rationale:** Data hygiene - occurrence already passed, no longer relevant

---

### Test 4.1: Pause After Class Time Has Passed

**Setup:**
- Class: Monday 4:15 PM
- Current time: Monday 6:00 PM (AFTER class time)

**Steps:**
1. Before Monday: Set skip for Monday's class
2. Wait until Monday 6:00 PM (after class time)
3. Toggle "Pause All Bookings" ON
4. Check database (Supabase → `recurring_classes`)
5. **Expected:**
   - `skip_next_occurrence` = `false` (cleared!)
   - `skip_target_datetime` = `null` (cleared!)
   - Console log: `[updateSchedulePaused] Zone C: Cleared 1 past skip(s)`
6. Check UI
7. **Expected:**
   - Skip badge is GONE (both fields cleared)
   - "Skip Next" button shows (back to normal state)

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

### Test 4.2: Deactivate After Class Time Has Passed

**Setup:**
- Class: Monday 4:15 PM
- Current time: Monday 6:00 PM (after class time)

**Steps:**
1. Before Monday: Set skip for Monday's class
2. Wait until Monday 6:00 PM (after class time)
3. Toggle class "Active" switch OFF
4. Check database (Supabase → `recurring_classes`)
5. **Expected:**
   - `skip_next_occurrence` = `false` (cleared!)
   - `skip_target_datetime` = `null` (cleared!)
   - Console log: `[toggleRecurringClassActive] Zone C: Clearing both fields (past occurrence)`

**Status:** [ ] Not Tested | [ ] Pass | [ ] Fail

---

## Part 5: Console Log Verification

When testing, check browser console (F12 → Console tab) for verification logs:

**Zone A (before window):**
- No logs (no cleanup action taken)

**Zone B (inside window):**
```
[toggleRecurringClassActive] Zone B: Clearing flag only (inside window)
```
or
```
[updateSchedulePaused] Zone B: Cleared 1 flag(s) inside window
```

**Zone C (past class):**
```
[toggleRecurringClassActive] Zone C: Clearing both fields (past occurrence)
```
or
```
[updateSchedulePaused] Zone C: Cleared 1 past skip(s)
```

---

## Quick Test Matrix

| Test | When | Action | skip_next_occurrence | skip_target_datetime | UI Badge | Console Log |
|------|------|--------|---------------------|---------------------|----------|-------------|
| Zone A | Saturday | Pause/Deactivate | ✓ Preserved | ✓ Preserved | ✓ Shows | None |
| Zone B | Sunday 4:30 PM | Pause/Deactivate | ✗ Cleared | ✓ Preserved | ✓ Shows | Zone B message |
| Zone C | Monday 6 PM | Pause/Deactivate | ✗ Cleared | ✗ Cleared | ✗ Gone | Zone C message |

---

## Practical Testing Tips

**Easiest tests first:**
1. UI disabled state (Part 1) - can test anytime ⭐ START HERE
2. Zone A (Part 2) - easy timing, just test on Saturday for Monday class
3. Zone C (Part 4) - wait until after class time

**Hardest test:**
- Zone B (Part 3) - requires precise timing inside booking window
- **Tip:** Use a class with 2-hour booking window instead of 26 hours for easier testing
- **Alternative:** Set your computer clock forward temporarily (not recommended for production)

**To check database:**
1. Go to Supabase Dashboard
2. Table Editor → `recurring_classes`
3. Find your class row
4. Check `skip_next_occurrence` and `skip_target_datetime` columns

**To check console logs:**
1. Open browser DevTools (F12 or right-click → Inspect)
2. Go to Console tab
3. Perform pause/deactivate action
4. Look for `[toggleRecurringClassActive]` or `[updateSchedulePaused]` messages

---

## Test Results Summary

**Tested By:** _________________
**Date:** _________________
**Environment:** [ ] Production | [ ] Staging | [ ] Local

| Part | Test | Status | Notes |
|------|------|--------|-------|
| 1.1 | Skip button disabled when paused | [ ] Pass [ ] Fail | |
| 1.2 | Skip button disabled when inactive | [ ] Pass [ ] Fail | |
| 2.1 | Pause before booking window | [ ] Pass [ ] Fail | |
| 2.2 | Deactivate before booking window | [ ] Pass [ ] Fail | |
| 3.1 | Pause inside booking window | [ ] Pass [ ] Fail | |
| 3.2 | Deactivate inside booking window | [ ] Pass [ ] Fail | |
| 4.1 | Pause after class time | [ ] Pass [ ] Fail | |
| 4.2 | Deactivate after class time | [ ] Pass [ ] Fail | |

**Overall Status:** [ ] All Pass | [ ] Some Fail | [ ] Not Complete

**Issues Found:**
-
-

---

## Related Files

**Implementation:**
- `app/actions/recurring-classes.ts` - `toggleRecurringClassActive()` function
- `app/actions/user-settings.ts` - `updateSchedulePaused()` function
- `components/SkipButton.tsx` - UI disabled state logic
- `components/ScheduleList.tsx` - Props passing

**Documentation:**
- `CLAUDE.md` - Sections 10 & 11
- `docs/My Workout Scheduler PRD.md` - Section 3.2.1
- `docs/BACKLOG.md` - Pre-MVP section

**Date:** December 1, 2025
