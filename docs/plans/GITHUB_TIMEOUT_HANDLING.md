# GitHub Timeout Handling Plan

**Created:** January 20, 2026
**Status:** Draft - Pending Approval
**Related Issue:** GitHub Actions incident (Jan 20, 2026 ~19:49-20:10 UTC)

---

## Problem Statement

During a GitHub Actions incident, runner queue times exceeded the 10-minute Inngest timeout, causing:
1. False `timeout_retrying` state despite successful bookings
2. No user notification (neither success nor failure)
3. Unnecessary retry runs

**Timeline from incident:**
- 2:15 PM: Inngest triggers GitHub Actions, starts 10m wait
- 2:15 - 2:31 PM: GitHub queue delay (~16 min) due to incident
- 2:25 PM: Inngest timeout expires → marks as `timeout_retrying`
- 2:31 - 2:32 PM: Job runs (59s, class booked successfully)
- 2:32 PM: `booking/result` event sent (7 min too late)

**Result:** Class booked, but user received no confirmation and got unnecessary retry runs.

---

## Current Flow

```
Trigger GitHub Actions
    ↓
wait-for-result (10m timeout)
    ↓ timeout
mark as failed
    ↓
sleep 15m (wait-before-timeout-retry)
    ↓
retry (new booking/attempt event)
```

**Cycle time:** ~25 minutes before retry
**Problem:** No user visibility, silent failures, long delay before retry

---

## Proposed Flow

```
Trigger GitHub Actions
    ↓
wait-for-result (5m timeout) ← shortened from 10m
    ↓ timeout
Send "delay warning" email (suggest manual booking)
    ↓
Cancel GitHub workflow (if run_id available)
    ↓
Immediate retry (no sleep)
    ↓
Check: elapsed > 20m from first attempt?
    ↓ yes                    ↓ no
Send "systems issue"     Loop back to wait-for-result
email and STOP
```

**Key changes:**
1. **5m initial timeout** - 2x normal (2-3m), avoids false alarms
2. **Immediate user notification** - "Taking longer than expected" with manual booking link
3. **No sleep between retries** - Immediate retry
4. **20m hard stop** - 4 retry cycles, preserves user's manual booking window

---

## Detailed Design

### 1. Event Data Changes

Add `firstAttemptTime` to track elapsed time across retries:

```typescript
// booking/attempt event data
{
  classId: string;
  className: string;
  classDate: string;
  attemptNumber: number;
  firstAttemptTime?: string; // ISO timestamp, set on first attempt, carried through retries
  isGitHubRetry?: boolean;   // true if this is a GitHub-specific retry (not class-full retry)
}
```

### 2. Timeout Logic Changes (lib/inngest/functions.ts)

**Current (line 240-244):**
```typescript
const bookingResult = await step.waitForEvent('wait-for-result', {
  event: 'booking/result',
  timeout: '10m',
  match: 'data.classId',
});
```

**Proposed:**
```typescript
const bookingResult = await step.waitForEvent('wait-for-result', {
  event: 'booking/result',
  timeout: '5m', // Reduced from 10m - normal runs complete in 2-3m
  match: 'data.classId',
});
```

### 3. Timeout Handler Changes

**When 5m timeout occurs:**

```typescript
if (!bookingResult) {
  // Calculate elapsed time since first attempt
  const firstAttemptTime = event.data.firstAttemptTime
    ? new Date(event.data.firstAttemptTime)
    : new Date();
  const elapsedMinutes = differenceInMinutes(new Date(), firstAttemptTime);

  // Update attempt status
  await step.run('update-attempt-timeout', async () => {
    await updateBookingAttempt(attemptId, {
      status: 'failed',
      error_message: `GitHub Actions timeout (${elapsedMinutes}m elapsed)`,
    });
  });

  // Check if we've exceeded the 20-minute hard limit
  if (elapsedMinutes >= 20) {
    // Send "systems issue" notification and STOP
    await step.run('send-systems-issue-notification', async () => {
      await sendBookingNotification({
        // ... class details
        status: 'failed',
        isSystemsIssue: true,
        totalRetryDuration: elapsedMinutes,
      });
    });

    return {
      status: 'systems_issue',
      message: `GitHub Actions unresponsive for ${elapsedMinutes} minutes - stopped retrying`,
    };
  }

  // Send "delay warning" email (only on first timeout, not subsequent)
  if (!event.data.isGitHubRetry) {
    await step.run('send-delay-warning', async () => {
      await sendBookingNotification({
        // ... class details
        status: 'failed',
        isDelayWarning: true,
      });
    });
  }

  // Optional: Cancel the GitHub workflow
  // (See section 5 below for implementation details)

  // Immediate retry (no sleep)
  await step.run('send-github-retry-event', async () => {
    await inngest.send({
      name: 'booking/attempt',
      id: `book-github-retry-${classId}-${classDate}-${attemptNumber + 1}-${crypto.randomUUID().slice(0, 8)}`,
      data: {
        classId,
        className: classData.class_type,
        classDate,
        attemptNumber: attemptNumber + 1,
        firstAttemptTime: firstAttemptTime.toISOString(), // Carry forward
        isGitHubRetry: true, // Flag to suppress duplicate delay emails
      },
    });
  });

  return {
    status: 'github_timeout_retrying',
    message: `GitHub timeout at ${elapsedMinutes}m - immediate retry`,
    elapsedMinutes,
  };
}
```

### 4. New Email Templates

Uses existing `_base-template.ts` for consistent styling.

#### 4a. Delay Warning Email (`lib/email/templates/booking-delay-warning.ts`)

**Subject:** `Your [Class Name] booking is taking longer than usual`

**Tone:** Informative, calm - "We're on it, here's a backup option"

**Content:**
```
Hey [Name],

Your booking for [Class Name] on [Day] at [Time] is taking longer than
expected due to a temporary systems delay.

**What's happening**: We're still actively trying to complete your booking.
Most delays resolve within a few minutes.

**Just in case**: If you want to guarantee your spot, you can book manually:
→ [Book on GroupExPro](link)

We'll email you as soon as your booking completes (or if we need to stop trying).

No action needed if you're comfortable waiting.
```

#### 4b. Systems Issue Email (`lib/email/templates/booking-systems-issue.ts`)

**Subject:** `Action needed: [Class Name] booking couldn't be completed`

**Tone:** Honest, action-focused - "We stopped, you need to act, future is fine"

**Content:**
```
Hey [Name],

We weren't able to complete your booking for [Class Name] on [Day] at [Time].

**What happened**: Our booking system experienced extended delays (likely a
temporary infrastructure issue). After [X] minutes of trying, we stopped to
let you know.

**Book manually now**:
→ [Book on GroupExPro](link)

**Your future bookings**: This was a one-time issue. Your upcoming scheduled
classes will book normally. No changes needed on your end.

Sorry for the inconvenience. We know the whole point is that you shouldn't
have to think about this.
```

#### 4c. Success After Delay (enhancement to existing success template)

If delay warning was sent but booking succeeds, acknowledge the delay:
> "Good news! Your [Class Name] booking is confirmed (sorry for the delay)."

### 5. GitHub Workflow Cancellation (Optional Enhancement)

**Current limitation:** We trigger the workflow but don't capture the run_id.

**To enable cancellation:**

1. After triggering workflow, query recent runs:
```typescript
// Query runs started in last 2 minutes
const runsResponse = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/actions/workflows/booking-automation.yml/runs?created=>${twoMinutesAgo}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const runs = await runsResponse.json();
```

2. Find our run by matching `inputs.class_id` or timing

3. Store run_id in step output

4. On timeout, cancel:
```typescript
await fetch(
  `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/cancel`,
  { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
);
```

**Recommendation:** Defer this to Phase 2. The immediate retry approach works without cancellation - old runs will complete harmlessly (result event ignored since attempt already updated).

### 6. Handling Late-Arriving Results

When a result arrives after we've moved on:

1. The `booking/result` event arrives with `classId`
2. The original `waitForEvent` has already timed out
3. Inngest doesn't automatically match it to the new run

**No code change needed:** The late result is simply ignored because:
- The `waitForEvent` that would have received it already timed out
- The new attempt has a new `waitForEvent` waiting for its own result
- Result events match on `classId`, and both the late result and new result will have the same `classId`

**Edge case:** If both the late result AND new result arrive, we could get duplicate notifications.

**Mitigation:** Add deduplication check before sending notification:
```typescript
// Before sending notification, check if we already notified for this class today
const alreadyNotified = await checkRecentNotification(classId, classDate);
if (alreadyNotified) {
  console.log('[Inngest] Skipping duplicate notification');
  return;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/inngest/functions.ts` | Timeout logic, retry flow, elapsed time tracking |
| `lib/email/templates/booking-delay-warning.ts` | New template |
| `lib/email/templates/booking-systems-issue.ts` | New template |
| `lib/notifications/send-booking-notification.ts` | Add `isDelayWarning`, `isSystemsIssue` support |
| `lib/database.types.ts` | Add new notification types (if needed) |
| `app/prototype/email-preview/page.tsx` | Preview new templates |

---

## Testing Plan

1. **Unit test:** Mock Inngest flow with 5m timeout → verify immediate retry
2. **Integration test:** Trigger booking with intentional delay → verify email sent
3. **Production monitor:** Deploy and watch next scheduled booking in Inngest dashboard

**Dry run considerations:** Cannot easily simulate GitHub delays; rely on timeout mock tests.

---

## Rollout Plan

1. **Phase 1 (This PR):**
   - Reduce timeout to 5m
   - Add delay warning email
   - Add systems issue email (20m hard stop)
   - Immediate retry (no sleep)

2. **Phase 2 (Future):**
   - GitHub workflow cancellation
   - Notification deduplication
   - Metrics/alerting for timeout frequency

---

## Open Questions

1. ~~**5m vs 3m timeout?**~~ **Resolved: 5m** - 2x normal (2-3m), avoids false alarms for runs that complete at 3:01.

2. ~~**30m hard stop vs longer?**~~ **Resolved: 20m** - 4 retry cycles, preserves user's manual booking window.

3. **Cancel workflow or let it complete?** Letting it complete is simpler. The late result is harmless. Defer to Phase 2.

4. **Notification deduplication?** Could add, but edge case is rare. Defer to Phase 2.

5. **Time-of-day consideration?** If booking window is during sleeping hours (11 PM - 6 AM), should we adjust thresholds? Defer to Phase 2.

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| 5m timeout | 2x normal runtime, avoids false alarms, provides genuine signal |
| 20m hard stop | 4 retry cycles, preserves user's manual booking window |
| No workflow cancellation (Phase 1) | Simpler implementation, late results are harmless |
| Single delay warning email | Avoid spam; subsequent retries are silent |
| Immediate retry | No point waiting if GitHub is backlogged |
| Calm/informative email tone | Users trust automation; don't panic them, give agency |

---

## Version History

| Date | Change |
|------|--------|
| 2026-01-20 | Initial draft |
| 2026-01-20 | Refined after UX review: 20m hard stop (was 30m), detailed email copy |
