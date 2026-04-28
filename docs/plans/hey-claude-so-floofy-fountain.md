# Fix: Inactive classes are still firing booking attempts

## Context

Two real production incidents observed:

1. **Last Saturday 9:30 AM Bodypump (Woodfin):** class was `active=false`, but a booking attempt fired anyway. (User also noted it fired ~26 hours earlier than the expected Friday 7:30 AM window — see "Out of scope" below.)
2. **Currently — Wed 8:00 AM Bodypump Heavy (Woodfin):** class is `active=false`, yet a booking attempt is in flight, hitting "class full", and retrying every 15 minutes.

CLAUDE.md states the design contract:
> "Inngest events: Delete cancels events; inactive/pause uses runtime checks (events still fire but don't book)"

After reading the booking function, **the `active` runtime check is missing**. It's been latent since the original Inngest implementation; the trigger condition is narrow (toggle off between when the daily scheduler enqueues an event and when that event fires — at most ~26 hours per class), so the bug only became user-visible now.

**On the pause case:** initial exploration suggested `schedule_paused` was also unchecked, but live verification showed pause IS already enforced — just indirectly. `getClassById` (`scripts/database-helpers.ts:683-685`) returns `null` when `user_settings.schedule_paused = true`, which the booking function bails on at line 82's `if (!classData)` guard with `error: 'Class not found'`. Functionally correct (no booking happens), operationally a bit misleading (logs read "Class not found" for a paused user). Refactoring that to be explicit is out of scope here — see "Out of scope".

**PRs 122–125 did NOT introduce these bugs.** Verified via `git log` over `lib/inngest/functions.ts`, `app/actions/recurring-classes.ts`, `app/actions/user-settings.ts`, `scripts/database-helpers.ts`, `lib/inngest/scheduler.ts`: zero changes in any of those four PRs. PR 122 was UI/voice/landing polish; 123–125 were UI hotfixes. The bug surface predates them. The "wrong day" timing anomaly from last Saturday is most plausibly a stale event from production-testing activity around the April 23 merge cycle (see "Out of scope").

## Root cause — one missing runtime check

In `bookClassFunction` (`lib/inngest/functions.ts:26-205`), the early-return guard chain currently checks:
- `!classData` (line 82) — class deleted OR user paused (latter via `getClassById` returning null)
- `classData.skip_next_occurrence === true` (line 117) — single-occurrence skip
- duplicate-runs (line 158) — another attempt in flight

**Missing:**
- `classData.active === false` — class toggled off

`getClassById` deliberately does NOT filter on `active` (CLAUDE.md gotcha — needed so skip cleanup can run on deactivated classes), so the booking function gets full data for an inactive class and currently proceeds to book it.

The `getAllActiveClasses` daily-scheduler filter at midnight excludes inactive classes — but events already queued before the toggle still fire because the cook never re-validates.

## Plan

**Scope:** add one runtime check to `bookClassFunction`. No event-cancellation changes — runtime check is the canonical defense layer per the design contract; once the cook bails, no booking happens regardless of queued event state. Skipping the cancel-event work keeps the diff small and avoids the `classDate` matching subtleties of `cancelOn`.

### Single change: `lib/inngest/functions.ts`

Add one early-return check immediately after the existing `if (!classData)` block at line 85, BEFORE the skip-cleanup `step.run('clear-previous-skip-datetime', ...)` at line 95.

```ts
// Runtime guard: events queued before deactivate still fire (toggle off doesn't cancel).
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
```

**Placement notes:**
- AFTER the early-start timing guard (lines 47–75) — so the "more than 24 hours early — abort" check still fires for stale events.
- AFTER `getClassById` so `classData.active` is populated.
- BEFORE `clear-previous-skip-datetime` — skip cleanup on a deactivated class is unnecessary (`toggleRecurringClassActive` already clears skip fields when deactivating, `recurring-classes.ts:518-522`).
- BEFORE the duplicate-runs check and any `createBookingAttempt` call — no `booking_attempts` row gets written for inactive cases, keeping history clean.

## In-flight Bodypump Heavy retry loop

The retry loop will keep firing every 15 minutes until ~7:45 AM Wednesday unless interrupted. Once the fix ships:
1. Push branch → Vercel deploys preview
2. Inngest auto-syncs to the latest Vercel deploy (per CLAUDE.md gotcha)
3. The next 15-min retry event hits the new `!active` guard and the chain dies on its own

No manual cancel needed. (If the user wants belt-and-suspenders, they can manually cancel from the Inngest dashboard before deploy.)

## Verification

1. `npx tsc --noEmit` — type check passes (note CLAUDE.md gotcha re: stale `.next/` route types; run `npm run build` once if any false positives surface).
2. `npm run build` — Next.js production build clean.
3. **Production verification — inactive guard (live):** completed against the Bodypump Heavy in-flight retry chain. Once the deploy synced, the next replay returned `status: 'inactive'` and the chain died. No additional `booking_attempts` rows, no `send-notification` step, no retry-schedule. Confirmed in Inngest dashboard.
4. **Smoke test — paused user (live):** sent a `booking/attempt` event for an active class with `pause-all` ON. Function bailed at the existing `if (!classData)` guard (line 82) with `error: 'Class not found'` — `getClassById` returns null for paused users (`scripts/database-helpers.ts:683-685`). Pause-all is functionally protected by the existing path; no new check needed in `bookClassFunction`.

## Critical files

| File | Change |
|---|---|
| `lib/inngest/functions.ts` | Add `active === false` runtime check after line 85 |

## Existing utilities reused

- `getClassById` from `scripts/database-helpers.ts` — already called at `functions.ts:78`.
- `step.run` Inngest pattern — matches the existing block style elsewhere in the function for retryability.

## Out of scope

- **Event-cancellation on `toggleRecurringClassActive` / `updateSchedulePaused`.** Defense-in-depth only — the runtime check above is the canonical guard. Deferred unless we see a regression. (Delete already cancels events; toggle-off and pause-all do not.)
- **Refactor pause to be explicit in `bookClassFunction`.** Today pause is enforced by `getClassById` returning null, which produces `error: 'Class not found'` in run output. Functionally correct but operationally misleading. A future cleanup would move the pause check out of `getClassById` into the booking function (parallel to the new active check) so the run output reads `status: 'paused'`. Out of scope here because it requires touching `database-helpers.ts` and the change is purely cosmetic.
- **"Wrong day" timing anomaly** (last Saturday's Bodypump fired Thursday 5:28 AM). Most plausibly a stale event from production-testing activity around the April 23 PR merges; the booking-function code wasn't changed, so this is a queue-state issue, not a regression. Once the inactive guard ships, even a stale event firing at the wrong time will short-circuit before booking. A complete fix would propagate `expectedBookingTime` onto retry events so the existing "more than 24 hours early — abort" guard at `functions.ts:53–65` catches stale retries too — that's a separate small follow-up, not bundled here.