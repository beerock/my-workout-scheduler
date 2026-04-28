# Fix: Inactive / paused classes are still firing booking attempts

## Context

Two real production incidents observed:

1. **Last Saturday 9:30 AM Bodypump (Woodfin):** class was `active=false`, but a booking attempt fired anyway. (User also noted it fired ~26 hours earlier than the expected Friday 7:30 AM window — see "Out of scope" below.)
2. **Currently — Wed 8:00 AM Bodypump Heavy (Woodfin):** class is `active=false`, yet a booking attempt is in flight, hitting "class full", and retrying every 15 minutes.

CLAUDE.md states the design contract:
> "Inngest events: Delete cancels events; inactive/pause uses runtime checks (events still fire but don't book)"

After reading the booking function, **the runtime checks are missing for both `active` and `schedule_paused`**. They've been latent since the original Inngest implementation; the trigger condition is narrow (toggle off or pause-all between when the daily scheduler enqueues an event and when that event fires — at most ~26 hours per class), so the bug only became user-visible now.

**PRs 122–125 did NOT introduce these bugs.** Verified via `git log` over `lib/inngest/functions.ts`, `app/actions/recurring-classes.ts`, `app/actions/user-settings.ts`, `scripts/database-helpers.ts`, `lib/inngest/scheduler.ts`: zero changes in any of those four PRs. PR 122 was UI/voice/landing polish; 123–125 were UI hotfixes. The bug surface predates them. The "wrong day" timing anomaly from last Saturday is most plausibly a stale event from production-testing activity around the April 23 merge cycle (see "Out of scope").

## Root cause — two missing runtime checks

In `bookClassFunction` (`lib/inngest/functions.ts:26-205`), the early-return guard chain currently checks:
- `!classData` (line 82) — class deleted
- `classData.skip_next_occurrence === true` (line 117) — single-occurrence skip
- duplicate-runs (line 158) — another attempt in flight

**Missing:**
- `classData.active === false` — class toggled off
- `user_settings.schedule_paused === true` — user paused all bookings

Note: `getClassById` deliberately does NOT filter on `active` (CLAUDE.md gotcha — needed so skip cleanup can run on deactivated classes), so the booking function gets full data for an inactive class and currently proceeds to book it. Same shape for paused users — pause is a `user_settings` flag, not a class-level field, and is not consulted at all in the booking function today.

The `getAllActiveClasses` daily-scheduler filter at midnight DOES exclude inactive classes and paused users — but events already queued before the toggle/pause still fire because the cook never re-validates.

## Plan

**Scope:** add two runtime checks to `bookClassFunction`. No event-cancellation changes — runtime check is the canonical defense layer per the design contract; once the cook bails, no booking happens regardless of queued event state. Skipping the cancel-event work keeps the diff small and avoids the `classDate` matching subtleties of `cancelOn`.

### Single change: `lib/inngest/functions.ts`

Add two early-return checks immediately after the existing `if (!classData)` block at line 85, BEFORE the skip-cleanup `step.run('clear-previous-skip-datetime', ...)` at line 95.

```ts
// Runtime guard: class is inactive (user toggled it off after the
// daily scheduler queued this event). Bail before creating any
// booking_attempts row — no noisy history for a class the user
// explicitly turned off. Also short-circuits any retry chain still
// in flight: the next 15-min retry hits this guard and dies.
if (classData.active === false) {
  console.log(
    `[Inngest] Class "${className}" (${classId}) is inactive - aborting booking`
  );
  return {
    classId,
    className,
    status: 'inactive',
    message: 'Class is inactive - skipping booking',
  };
}

// Runtime guard: user paused all bookings after this event was
// queued. Same rationale as the inactive check — runtime
// re-validation since pause-all does not cancel queued events.
const userSettings = await step.run('check-user-paused', async () => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('schedule_paused')
    .eq('user_id', classData.user_id)
    .maybeSingle();

  if (error) {
    console.error(
      `[Inngest] [bookClassFunction] user_settings query failed for user ${classData.user_id}:`,
      error
    );
    // Fail open: if we can't read the flag, proceed with booking
    // rather than silently dropping. RLS drift / column rename
    // shouldn't block legitimate bookings.
    return null;
  }
  return data;
});

if (userSettings?.schedule_paused === true) {
  console.log(
    `[Inngest] User ${classData.user_id} is paused - aborting booking for "${className}"`
  );
  return {
    classId,
    className,
    status: 'paused',
    message: 'User schedule is paused - skipping booking',
  };
}
```

**Placement notes:**
- AFTER the early-start timing guard (lines 47–75) — so the "more than 24 hours early — abort" check still fires for stale events.
- AFTER `getClassById` so we have `classData.user_id` for the pause query.
- BEFORE `clear-previous-skip-datetime` — skip cleanup on a deactivated class is unnecessary (`toggleRecurringClassActive` already clears skip fields when deactivating, `recurring-classes.ts:518-522`), and skipping it on a paused user matches the design intent that pause is a soft halt.
- BEFORE the duplicate-runs check and any `createBookingAttempt` call — no `booking_attempts` row gets written for skipped/paused/inactive cases, keeping history clean.

**Pattern follows the CLAUDE.md gotcha:** "Always destructure `{ data, error }` on Supabase queries" — the `error` is logged with a `[bookClassFunction]` source-module prefix before the fallback, surfacing failures in Vercel runtime logs. Fail-open behavior (proceed if we can't read pause flag) prevents RLS drift from silently blocking real bookings.

**Imports already present:** `createServiceRoleClient` is imported at line 16. No new imports needed.

## In-flight Bodypump Heavy retry loop

The retry loop will keep firing every 15 minutes until ~7:45 AM Wednesday unless interrupted. Once the fix ships:
1. Push branch → Vercel deploys preview
2. Inngest auto-syncs to the latest Vercel deploy (per CLAUDE.md gotcha)
3. The next 15-min retry event hits the new `!active` guard and the chain dies on its own

No manual cancel needed. (If the user wants belt-and-suspenders, they can manually cancel from the Inngest dashboard before deploy.)

## Verification

1. `npx tsc --noEmit` — type check passes (note CLAUDE.md gotcha re: stale `.next/` route types; run `npm run build` once if any false positives surface).
2. `npm run build` — Next.js production build clean.
3. **Manual smoke test — inactive guard:**
   - As admin (`brockbusby@gmail.com`), pick a class with a future booking window.
   - Toggle inactive in the dashboard.
   - From the Inngest dashboard, manually send a `booking/attempt` event for that class (or wait for any already-queued event to fire).
   - Confirm: function returns `status: 'inactive'`, no `booking_attempts` row created, no GH Actions workflow triggered, no email sent.
4. **Manual smoke test — paused guard:**
   - As admin, click "Pause all" on the dashboard.
   - From the Inngest dashboard, manually send a `booking/attempt` event for one of the admin's active classes.
   - Confirm: function returns `status: 'paused'`, no `booking_attempts` row, no GH Actions workflow, no email.
   - Unpause and verify normal booking resumes.
5. **Production verification (post-deploy):** Bodypump Heavy retry loop stops emitting attempts within 15 minutes of the deploy syncing to Inngest.

## Critical files

| File | Change |
|---|---|
| `lib/inngest/functions.ts` | Add `active` + `schedule_paused` runtime checks after line 85 |

## Existing utilities reused

- `getClassById` from `scripts/database-helpers.ts` — already called at `functions.ts:78`. Returns `user_id` on the class row.
- `createServiceRoleClient` from `@/lib/supabase/service-role` — already imported at `functions.ts:16`, already used downstream for `clear-previous-skip-datetime` and `check-duplicate-runs` step.run blocks.
- `step.run` Inngest pattern — matches the existing block style elsewhere in the function for retryability.

## Out of scope

- **Event-cancellation on `toggleRecurringClassActive` / `updateSchedulePaused`.** Defense-in-depth only — the runtime check above is the canonical guard. Deferred unless we see a regression. (Delete already cancels events; toggle-off and pause-all do not.)
- **"Wrong day" timing anomaly** (last Saturday's Bodypump fired Thursday 5:28 AM). Most plausibly a stale event from production-testing activity around the April 23 PR merges; the booking-function code wasn't changed, so this is a queue-state issue, not a regression. Once the inactive guard ships, even a stale event firing at the wrong time will short-circuit before booking. A complete fix would propagate `expectedBookingTime` onto retry events so the existing "more than 24 hours early — abort" guard at `functions.ts:53–65` catches stale retries too — that's a separate small follow-up, not bundled here.
- **Pause-all event cancellation.** Same reasoning as toggle-active — runtime check covers the user-visible problem. Pause-all also has a partial saving grace: the daily midnight scheduler (`getAllActiveClasses`) excludes paused users, so new events stop being queued after one midnight cycle. Worst case is the ~24-hour window of already-queued events, which the new runtime check now handles.