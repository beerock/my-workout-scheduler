# Testing Checklist - Schedule Management Features

**Date:** November 8, 2025  
**Status:** Pre-Automation Testing

## Pre-Testing Setup

- [ ] Database migration `003_schedule_management.sql` has been run
- [ ] User account created and logged in
- [ ] Gym credentials saved (for skip button gym URL)

---

## 1. Schedule Management - CRUD Operations

### Add Class
- [ ] Navigate to `/dashboard/schedule/add`
- [ ] Fill out all required fields:
  - [ ] Day of week (Sunday-Saturday)
  - [ ] Class time (time picker works)
  - [ ] Class type (e.g., "BODYPUMP")
  - [ ] Branch (e.g., "Downtown YMCA")
  - [ ] Booking window hours (defaults to 26)
  - [ ] Timezone (defaults to Eastern Time)
- [ ] Click "Add Class" button
- [ ] Verify success message appears
- [ ] Verify redirect to schedule list
- [ ] Verify new class appears in list

### Edit Class
- [ ] Click "Edit" button on an existing class
- [ ] Verify form is pre-populated with class data
- [ ] Modify one or more fields
- [ ] Click "Update Class" button
- [ ] Verify success message
- [ ] Verify changes are reflected in schedule list

### Delete Class
- [ ] Click "Delete" button on a class
- [ ] Verify confirmation prompt appears ("Confirm? Yes/No")
- [ ] Click "No" - verify class is NOT deleted
- [ ] Click "Delete" again, then "Yes"
- [ ] Verify class is removed from list
- [ ] Verify success feedback

### Copy Class
- [ ] Click "Copy" button on an existing class
- [ ] Verify form loads with all fields pre-populated
- [ ] Verify page title says "Copy Recurring Class"
- [ ] Verify button says "Add Class" (not "Update Class")
- [ ] Modify some fields
- [ ] Click "Add Class"
- [ ] Verify new class is created (not updating original)
- [ ] Verify original class still exists unchanged

---

## 2. Schedule List Display

### Visual Layout
- [ ] Day and time are displayed prominently (large, bold text)
- [ ] Classes are sorted by day of week (Sunday first), then by time
- [ ] Inactive classes show grayed out styling
- [ ] All class details are visible (branch, booking window)

### Empty State
- [ ] With no classes, verify "Add Your First Class" CTA appears
- [ ] CTA links to add page

---

## 3. Global Pause Toggle

### Toggle Functionality
- [ ] Locate "Pause all bookings" toggle on schedule page
- [ ] Toggle ON (pause enabled)
- [ ] Verify all classes appear darker/muted
- [ ] Verify "⚠️ Paused" badge appears on each class
- [ ] Verify active checkboxes are visually unchecked and disabled
- [ ] Toggle OFF (pause disabled)
- [ ] Verify classes return to normal appearance
- [ ] Verify active checkboxes are enabled again

### Persistence
- [ ] Toggle pause ON
- [ ] Refresh page
- [ ] Verify pause state persists (still ON)
- [ ] Toggle OFF
- [ ] Refresh page
- [ ] Verify pause state persists (still OFF)

---

## 4. Per-Class Active Toggle

### Toggle Functionality
- [ ] Click active checkbox on a class
- [ ] Verify checkbox toggles immediately
- [ ] Verify class appears grayed out when inactive
- [ ] Verify "Inactive" badge appears
- [ ] Toggle back to active
- [ ] Verify class returns to normal styling

### With Global Pause
- [ ] Enable global pause
- [ ] Verify individual active toggles are disabled
- [ ] Verify they appear unchecked (even if class is active)
- [ ] Disable global pause
- [ ] Verify individual toggles are enabled again

---

## 5. Skip Next Occurrence Feature

### Setting Skip
- [ ] Click "Skip Next" button on a class
- [ ] Verify button changes to show skip date (e.g., "📅 Skipping Nov 10")
- [ ] Verify date shown is the CLASS date (not booking window date)
- [ ] Verify date is correct (next occurrence of that day)

### Skip Button States
- [ ] **State 1 (No skip):** Button shows "Skip Next"
- [ ] **State 2 (Skip scheduled):** Button shows "📅 Skipping [date]" with × cancel button
- [ ] **State 3 (Skip past):** After class date passes, button returns to "Skip Next"

### Unskip Logic - Scenario A (Before Booking Window)
- [ ] Set skip for a class where booking window hasn't opened yet
- [ ] Click × (cancel) button
- [ ] Verify skip is cleared silently
- [ ] Verify button returns to "Skip Next"

### Unskip Logic - Scenario B (During Booking Window) ⚠️ CRITICAL
- [ ] Set skip for a class
- [ ] Wait until booking window opens (or manually adjust test data)
- [ ] Click × (cancel) button
- [ ] Verify warning modal appears:
  - [ ] Title: "Booking Window Already Opened"
  - [ ] Shows class date and booking window open time
  - [ ] "Book on Gym Site" button (if gym URL exists)
  - [ ] "Clear Skip Anyway" button
  - [ ] "Cancel" button
- [ ] Click "Cancel" - verify modal closes, skip remains
- [ ] Click × again, then "Clear Skip Anyway"
- [ ] Verify skip is cleared

### Unskip Logic - Scenario C (After Class Passed)
- [ ] Set skip for a past class date (or wait for class to pass)
- [ ] Click × (cancel) button
- [ ] Verify skip is cleared silently (no warning)

### Date Display Accuracy
- [ ] Create class for Monday 4:15 PM
- [ ] On Saturday, click "Skip Next"
- [ ] Verify it shows next Monday's date (not Sunday)
- [ ] Verify date format is readable (e.g., "Nov 10" not "2024-11-10")

---

## 6. Form Validation & Error Handling

### Add/Edit Form
- [ ] Try submitting empty form - verify validation errors
- [ ] Try invalid time format - verify error message
- [ ] Try invalid day of week - verify error message
- [ ] Verify all required fields are marked with *

### Cancel Button
- [ ] Click "Cancel" on add page - verify redirect to schedule
- [ ] Click "Cancel" on edit page - verify redirect to schedule
- [ ] Verify no data is saved when canceling

---

## 7. Date/Time Calculations

### Next Occurrence Calculation
- [ ] Test with different days of week
- [ ] Verify it always returns NEXT occurrence (not today, even if today matches)
- [ ] Verify timezone doesn't cause date shifts

### Booking Window Calculations
- [ ] Verify booking window opens at correct time (class time - booking_window_hours)
- [ ] Verify warning modal only appears after booking window opens

---

## 8. User Experience

### Loading States
- [ ] Verify loading indicators during save operations
- [ ] Verify buttons are disabled during operations

### Success/Error Messages
- [ ] Verify success toasts appear after successful operations
- [ ] Verify error messages are clear and helpful
- [ ] Verify messages auto-dismiss or are dismissible

### Navigation
- [ ] Verify all "Back" links work correctly
- [ ] Verify breadcrumbs/navigation is intuitive

---

## 9. Security & Data Isolation

### Row Level Security (RLS)
- [ ] Create class as User A
- [ ] Log in as User B
- [ ] Verify User B cannot see User A's classes
- [ ] Verify User B cannot edit/delete User A's classes

### Data Persistence
- [ ] Add a class
- [ ] Log out and log back in
- [ ] Verify class still exists
- [ ] Verify all settings persist

---

## 10. Edge Cases

### Multiple Classes
- [ ] Add 5+ classes
- [ ] Verify list displays correctly
- [ ] Verify sorting works (by day, then time)
- [ ] Verify all actions work on each class

### Same Day/Time Classes
- [ ] Add two classes for same day and time (different branches)
- [ ] Verify both display correctly
- [ ] Verify skip works independently for each

### Timezone Edge Cases
- [ ] Test with different timezones
- [ ] Verify dates don't shift incorrectly
- [ ] Verify booking window calculations are correct

---

## 11. Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test on mobile browser (responsive design)

---

## 12. Performance

- [ ] Verify page loads quickly (< 2 seconds)
- [ ] Verify form submissions are responsive
- [ ] Verify no console errors
- [ ] Verify no network errors

---

## Known Issues to Verify Fixed

- [x] Checkbox warnings (should be fixed with id/name attributes)
- [x] Skip date showing wrong date (should show class date, not booking window)
- [x] Skip button disappearing for classes today
- [x] Date display timezone issues

---

## Post-Testing Notes

**Date Completed:** _______________  
**Tester:** _______________  
**Issues Found:**  
- 

**Ready for Automation Development:** [ ] Yes [ ] No

---

## Next Steps After Testing

1. Address any critical issues found
2. Document any edge cases discovered
3. Proceed to booking automation development
4. Set up GitHub Actions workflow
5. Build Puppeteer booking script

