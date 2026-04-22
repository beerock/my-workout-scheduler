import type { RecurringClass } from '@/lib/database.types'

/**
 * Returns true only when a class is ACTIVELY being skipped right now.
 *
 * The check requires BOTH the flag and the datetime to agree:
 *  - `skip_next_occurrence === true` (user has explicitly set a skip)
 *  - AND `skip_target_datetime` is still in the future (the skipped
 *    occurrence hasn't passed yet)
 *
 * Why both: the backend booking function clears `skip_next_occurrence`
 * at runtime when it consumes the skip (not instantly), so there are
 * brief windows where the flag is stale relative to the datetime — and
 * vice versa. Any skip-derived UI surface (banner label, indicator dot,
 * card background tint, skip/unskip button state, status badge) should
 * call this helper so they all agree on "are we currently skipping?".
 *
 * Prior divergence: `SkipButton` previously checked only the datetime,
 * `ScheduleList` banner checked only the flag, and `getStatusBadge`
 * checked only the datetime — so a single card could simultaneously
 * render contradicting skip state (dot normal, badge "Skipping"). This
 * helper is the single source of truth.
 */
export function isSkipCurrentlyActive(
  recurringClass: Pick<RecurringClass, 'skip_next_occurrence' | 'skip_target_datetime'>
): boolean {
  return !!(
    recurringClass.skip_next_occurrence &&
    recurringClass.skip_target_datetime &&
    new Date() < new Date(recurringClass.skip_target_datetime)
  )
}
