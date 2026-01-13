# Production Testing Guide

**Last Updated:** November 17, 2025
**Version:** 2.7
**Related PRs:** #14 (Class Full Detection), #15 (Duplicate Prevention)

This document provides a comprehensive testing plan for validating the automated class booking system in production, with focus on recent improvements to class status detection and duplicate prevention.

---

## Overview

Recent updates (v2.7) introduce:
- ✅ Enhanced class status detection (full, cancelled, not reservable)
- ✅ Duplicate booking prevention with idempotency keys
- ✅ Improved retry logic (15-minute intervals for full classes)
- ✅ Fuzzy matching for class names (handles typos like "Raquetball" → "Racquetball")
- ✅ scrollIntoView for dynamically loaded classes (after "Load more results")

This guide ensures all scenarios are properly validated in production.

---

## Testing Strategy

### Test Priorities

**Critical (Do First):**
- Normal booking flow (baseline validation)
- Class full detection and 15-minute retry
- Cancelled class permanent failure
- Not reservable class permanent failure

**Important (Within First Week):**
- Duplicate run detection
- Idempotency keys for retry events
- Clock drift retry (existing feature validation)

**Edge Cases (Monitor Over Time):**
- Class full but waitlist available
- Already reserved detection
- New pill types or button states

---

## Critical Tests

### 1. ✅ Normal Booking Flow (Baseline)

**Goal:** Ensure existing functionality still works

**Setup:**
- Wait for a class with open booking window
- Let automation run naturally

**Expected Result:**
- ✅ Booking succeeds (status: `confirmed` or `waitlisted`)
- ✅ No errors in Inngest logs
- ✅ `booking_attempts` table shows correct status

**Where to Check:**
- Inngest Dashboard → Functions → `book-class` → Recent runs
- Supabase → Table Editor → `booking_attempts`
- Dashboard → Booking History

**Success Criteria:**
- Status: `confirmed` or `waitlisted`
- Error message: null (or appropriate message)
- Branch used: correct branch name

---

### 2. 🔴 Class Full Detection & Retry

**Goal:** Verify enhanced detection triggers 15-minute retry

**Setup:**
- Find a class that's currently full (orange "Class Full" pill on gym website)
- Trigger booking manually via Inngest dashboard, or wait for natural trigger

**Expected Result:**
- ✅ First attempt: status `failed`, error contains "Class is full"
- ✅ Inngest triggers retry in 15 minutes
- ✅ Retry continues every 15 min until class starts
- ✅ Logs show: "Class is full - no waitlist option available. Will retry..."

**Where to Check:**
- Inngest Dashboard → Find the function run → Check for `wait-before-retry` step
- Look for retry events: `book-retry-{classId}-{date}-{attemptNumber}-{random8}` (8-char random suffix)
- Check Inngest logs for "Scheduling retry in 15 minutes"

**Success Criteria:**
- Error message contains "full" (triggers retry logic)
- Inngest shows `wait-before-retry` step (15min sleep)
- Retry events created with unique IDs
- Retries stop when class starts (< 15 min remaining)

**How to Test:**
```bash
# Option A: Wait for naturally full class
# Option B: Manual trigger via Inngest dashboard
1. Go to Inngest Dashboard
2. Click "Send Event"
3. Event name: "booking/attempt"
4. Data: { "classId": "your-class-id" }
```

---

### 3. 🚫 Cancelled Class (Permanent Failure)

**Goal:** Verify cancelled classes don't trigger retry

**Setup:**
- Find a cancelled class (or wait for one to be cancelled)
- Trigger booking attempt

**Expected Result:**
- ✅ Status: `failed`
- ✅ Error: "Class is cancelled - booking not possible"
- ✅ **NO** retry scheduled (no `wait-before-retry` step)
- ✅ Inngest run completes immediately

**Where to Check:**
- Inngest logs: Should NOT see "Scheduling retry"
- Error message should NOT contain "full" (prevents retry)
- Function run should complete without sleep step

**Success Criteria:**
- Error message: "Class is cancelled - booking not possible"
- No retry scheduled
- Function completes in < 10 minutes (normal booking time)

---

### 4. 🔴 Not Reservable Class (Permanent Failure)

**Goal:** Verify not reservable classes don't trigger retry

**Setup:**
- Find a "Not Reservable" class (red pill on gym website)
- Trigger booking attempt

**Expected Result:**
- ✅ Status: `failed`
- ✅ Error: "Class is not reservable - booking not possible"
- ✅ **NO** retry scheduled
- ✅ Inngest run completes immediately

**Where to Check:**
- Same as cancelled class test
- Error should NOT contain "full"

**Success Criteria:**
- Error message: "Class is not reservable - booking not possible"
- No retry scheduled
- Function completes immediately

---

## Important Tests

### 5. 🔄 Duplicate Run Detection

**Goal:** Verify duplicate prevention works

**Setup:**
- Trigger two booking attempts for same class within 5 minutes

**Expected Result:**
- ✅ First run: Proceeds normally
- ✅ Second run: Exits early with status `duplicate`
- ✅ Second run logs: "Another booking run already in progress - exiting to prevent duplicate"
- ✅ Only ONE booking attempt created in database

**How to Test:**
```bash
# Manual trigger via Inngest dashboard
1. Go to Inngest → Functions → book-class
2. Click "Send Event" and trigger for a specific classId
3. Immediately trigger again with same classId
4. Check second run logs for 'duplicate' status
```

**Where to Check:**
- Inngest Dashboard → Second run should show `duplicate` status
- Supabase → `booking_attempts` → Should only have ONE pending attempt per class
- Check duplicate detection logs: "Found X recent pending attempt(s)"

**Success Criteria:**
- Second run returns status: `duplicate`
- Second run logs: "Exiting to avoid duplicate booking"
- Database has only ONE pending attempt

---

### 6. 🔑 Idempotency Keys

**Goal:** Verify retry events don't duplicate

**Setup:**
- Monitor class full retry scenario
- Check retry event IDs in Inngest

**Expected Result:**
- ✅ Retry event IDs follow pattern: `book-retry-{classId}-{YYYY-MM-DD}-{attemptNumber}-{random8}`
- ✅ Each retry has unique attempt number and random suffix
- ✅ Inngest doesn't process duplicate retry events

**Where to Check:**
- Inngest Dashboard → Events tab → Look for event IDs
- Pattern should be: `book-retry-abc123-2025-11-20-2-f7a2c9b1`, `book-retry-abc123-2025-11-20-3-d4e5f6a7`, etc.

**Success Criteria:**
- Event IDs are unique
- Attempt number increments: 2, 3, 4, etc.
- No duplicate events processed by Inngest

---

### 7. ⏰ Clock Drift Retry (Existing Feature)

**Goal:** Verify clock drift logic still works

**Setup:**
- Trigger booking slightly before window opens
- Or monitor naturally occurring clock drift scenarios

**Expected Result:**
- ✅ Retries 12 times × 15 seconds (3 min total)
- ✅ Logs show: "Booking button not found (attempt X/12). This may be clock drift."
- ✅ Eventually succeeds when window opens

**Where to Check:**
- GitHub Actions logs (Puppeteer runs here)
- Look for retry messages in console output
- Check for multiple attempts in single workflow run

**Success Criteria:**
- Up to 12 retry attempts
- 15 second delay between attempts
- Succeeds when window opens

---

## Edge Case Tests

### 8. 🟡 Class Full → Waitlist Available

**Goal:** Verify "full but has button" detection

**Setup:**
- Monitor classes that are full but have waitlist option
- Look for orange "Class Full" pill + RESERVE button

**Expected Result:**
- ✅ Logs: "Class appears FULL but has booking button - may be waitlist available"
- ✅ Proceeds with booking attempt
- ✅ Status: `waitlisted` (if waitlist successful)

**Where to Check:**
- Puppeteer logs for warning message
- Final status should be `waitlisted`
- No retry triggered (booking attempted and succeeded on waitlist)

**Success Criteria:**
- Warning logged
- Booking attempted despite "full" indicator
- Status: `waitlisted` (not `failed`)

---

### 9. ✅ Already Reserved

**Goal:** Verify duplicate booking prevention

**Setup:**
- Trigger booking for a class already reserved by user

**Expected Result:**
- ✅ Detects "RESERVED" button
- ✅ Status: `confirmed`
- ✅ Error: "Class already reserved"
- ✅ Exits without attempting booking

**Where to Check:**
- Inngest logs
- `booking_attempts` table

**Success Criteria:**
- Status: `confirmed`
- Error: "Class already reserved"
- No actual booking attempt made

---

## Monitoring Checklist

### Daily (First Week)

- [ ] Check Inngest Dashboard for any failed runs
- [ ] Check for any `duplicate` status (indicates prevention working)
- [ ] Verify retry events have proper idempotency keys
- [ ] Check `booking_attempts` table for clean data (no orphaned pending attempts)
- [ ] Review error messages for new patterns

### Weekly (Ongoing)

- [ ] Review error messages in `booking_attempts`
- [ ] Look for new pill types or button states we haven't seen
- [ ] Check for any edge cases not covered by tests
- [ ] Verify retry logic working as expected
- [ ] Monitor GitHub Actions for Puppeteer errors

### Monthly

- [ ] Review all booking attempts for patterns
- [ ] Check success rate (confirmed + waitlisted vs failed)
- [ ] Identify any recurring issues
- [ ] Update test plan with new scenarios discovered

---

## Quick Reference: Where to Check What

| What to Check | Where to Look |
|---------------|---------------|
| Function runs & logs | Inngest Dashboard → Functions → `book-class` |
| Retry events | Inngest Dashboard → Events tab |
| Duplicate detection | Inngest logs → Look for "duplicate" status |
| Booking results | Supabase → `booking_attempts` table |
| Puppeteer logs | GitHub Actions → Workflow runs |
| Error messages | Inngest logs + `booking_attempts.error_message` |
| Idempotency keys | Inngest Events → Look for `book-retry-*` IDs |
| Class status detection | Puppeteer logs → Look for status check logs |

---

## Success Criteria Summary

Your implementation is working correctly if:

| Scenario | Expected Behavior |
|----------|-------------------|
| **Class Full** | Retries every 15 min, error contains "full" |
| **Cancelled** | Fails permanently, error = "cancelled", NO retry |
| **Not Reservable** | Fails permanently, error = "not reservable", NO retry |
| **Duplicates** | Second run exits with `duplicate` status |
| **Idempotency** | Retry event IDs are unique and follow pattern |
| **Normal Flow** | Bookings succeed as before |
| **Clock Drift** | Retries up to 12 times × 15s |
| **Already Reserved** | Exits with "already reserved" message |

---

## Class Status Detection Reference

The system now detects 6 different class states:

| Status | Indicator | Detection Method | Retry Logic |
|--------|-----------|------------------|-------------|
| **Available** | RESERVE (dark blue, clickable) | Booking button exists, no status pills | Proceeds with booking |
| **Booking Window Not Open** | RESERVE (light blue, disabled) | Button disabled + tooltip | Clock drift retry (12×15s) |
| **Already Reserved** | RESERVED (white, clickable) | Button text "RESERVED" | No retry (already booked) |
| **Class Full** | Orange pill | "full" text/pill/badge | ✅ 15-min retry until class starts |
| **Cancelled** | Pill | "cancelled" text/pill | ❌ No retry (permanent) |
| **Not Reservable** | Red pill | "not reservable" text/pill | ❌ No retry (permanent) |

**Detection Priority Order:**
1. Reserved
2. Cancelled
3. Not Reservable
4. Class Full
5. Available

---

## Troubleshooting

### Issue: Class full retry not triggering

**Check:**
- Error message contains "full" keyword
- Inngest logs show "Scheduling retry in 15 minutes"
- Time until class starts is > 15 minutes

**Fix:**
- Verify error message includes "full"
- Check Inngest function logs for retry logic
- Ensure class hasn't already started

### Issue: Duplicate detection not working

**Check:**
- Database for pending attempts within 5 minutes
- Supabase connection working
- Query returning correct results

**Fix:**
- Check Supabase logs for query errors
- Verify `booking_attempts` table has pending records
- Check duplicate detection logs

### Issue: Wrong status detected

**Check:**
- Puppeteer logs for status detection messages
- HTML debug files in `debug/` directory
- Button and pill detection logic

**Fix:**
- Review detection logs: "Status check: isReserved=..., isFull=..., ..."
- Check HTML samples saved to debug directory
- Update detection patterns if new pill types discovered

---

## Adding New Test Scenarios

When you discover new edge cases or pill types:

1. **Document the scenario** in this file
2. **Add to monitoring checklist** if recurring
3. **Update detection logic** in `scripts/booking-automation.ts` if needed
4. **Update CLAUDE.md** with new patterns
5. **Create GitHub issue** if it's a bug

**Template for new scenarios:**
```markdown
### X. 🔵 New Scenario Name

**Goal:** What are we testing?

**Setup:** How to reproduce?

**Expected Result:**
- ✅ What should happen?

**Where to Check:**
- Where to look for results?

**Success Criteria:**
- How do we know it worked?
```

---

## Related Documentation

- **Implementation Details:** See `CLAUDE.md` → "Recent Updates (v2.0)"
- **Architecture:** See `CLAUDE.md` → "Architecture Overview"
- **Product Requirements:** See `docs/My Workout Scheduler PRD.md`
- **Issue Tracking:** See `docs/BACKLOG.md`

---

## Version History

- **v2.7** (Nov 17, 2025) - Added duplicate prevention and enhanced status detection testing
- **v2.0** (Nov 16, 2025) - Inngest migration and retry logic testing
- **v1.0** (Initial) - Basic booking automation testing
