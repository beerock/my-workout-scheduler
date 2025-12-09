# Fix: Duplicate Inngest Event Scheduling

## Status: READY TO IMPLEMENT

## Problem
The daily Inngest scheduler is creating duplicate event triggers for classes that have already been scheduled.

## Root Cause
**Missing idempotency keys in initial scheduling** - `lib/inngest/scheduler.ts:174-182`

Current code sends events WITHOUT an `id` field:
```typescript
await inngest.send({
  name: 'booking/attempt',
  data: {
    classId: classData.id,
    className: classData.class_type,
    attemptNumber: 1,
  },
  ts: bookingTime.getTime(),  // ❌ No 'id' field for deduplication
});
```

## How Duplicates Occur
1. User creates/edits class → `scheduleBooking()` called → Event 1
2. Daily scheduler runs → `scheduleBooking()` called again → Event 2
3. Both events trigger separate booking attempts

## Solution
Add idempotency key using pattern: `book-initial-${classId}-${classDate}`

This matches the retry logic pattern already in place at `lib/inngest/functions.ts:237`:
```typescript
id: `book-retry-${classId}-${classDate}-${attemptNumber + 1}`
```

## Files to Modify

### PRIMARY: lib/inngest/scheduler.ts

**Location:** Lines 147-185 (scheduleBooking function)

**Changes needed:**
1. Import `calculateNextClassDate` (already available in this file at line 105)
2. Calculate classDate before sending event
3. Add `id` field to inngest.send()

**Code change:**
```typescript
export async function scheduleBooking(classData: {
  id: string;
  class_type: string;
  day_of_week: number;
  class_time: string;
  booking_window_hours: number;
  timezone: string;
}): Promise<Date | null> {
  const bookingTime = calculateBookingWindowOpen(
    classData.day_of_week,
    classData.class_time,
    classData.booking_window_hours,
    classData.timezone
  );

  // Don't schedule if in the past
  if (bookingTime.getTime() < Date.now()) {
    console.log(
      `[Scheduler] Booking time ${bookingTime.toISOString()} is in the past, skipping`
    );
    return null;
  }

  // Calculate class date for idempotency key
  const classDate = calculateNextClassDate(
    classData.day_of_week,
    classData.class_time,
    classData.timezone
  );

  console.log(
    `[Scheduler] Scheduling booking for class "${classData.class_type}" (${classData.id}) at ${bookingTime.toISOString()}`
  );

  await inngest.send({
    name: 'booking/attempt',
    id: `book-initial-${classData.id}-${classDate}`, // ✅ Add idempotency key
    data: {
      classId: classData.id,
      className: classData.class_type,
      attemptNumber: 1,
    },
    ts: bookingTime.getTime(),
  });

  return bookingTime;
}
```

## Testing Plan

1. **Test 1: Create new class**
   - Create a test class with booking window 2-3 days away
   - Check Inngest dashboard - should see 1 event

2. **Test 2: Daily scheduler**
   - Wait for daily scheduler to run (midnight UTC)
   - Check Inngest dashboard - should still see only 1 event (not duplicated)

3. **Test 3: Edit class**
   - Edit the class time
   - Check Inngest dashboard - event should be updated, not duplicated

4. **Test 4: Database verification**
   - Check `booking_attempts` table
   - Should see only one attempt per occurrence

## Expected Behavior After Fix

- **User creates class** → Event ID: `book-initial-classA-2024-11-25`
- **Daily scheduler runs** → Tries to create same ID → Inngest deduplicates (ignores)
- **User edits same occurrence** → Same ID → Inngest replaces/updates event
- **Next week** → New date → Event ID: `book-initial-classA-2024-12-02` (new event, correct)

## Commit Message
```
fix: add idempotency keys to prevent duplicate Inngest scheduling

- Add unique event IDs to scheduleBooking() function
- Use pattern: book-initial-{classId}-{classDate}
- Prevents duplicate events when daily scheduler runs
- Matches existing retry logic pattern
```

## Branch
`claude/audit-inngest-duplicates-01WCNBk4EsmLpNq4ahDohxbo`

## Ready to Implement
All analysis complete. Just need to apply the code change above to `lib/inngest/scheduler.ts`.
