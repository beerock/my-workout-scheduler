import type { RecurringClass } from '@/lib/database.types'

/**
 * Returns true only when a class is ACTIVELY being skipped right now.
 *
 * Only `skip_target_datetime` (the class start time) is checked, NOT
 * `skip_next_occurrence`. This is intentional: the Inngest booking function
 * clears `skip_next_occurrence` at booking-window-open time (~26 hours
 * before the class) but deliberately keeps `skip_target_datetime` so the UI
 * can continue showing the skip badge until the class actually starts.
 * Requiring both fields caused the badge to disappear when the booking
 * window opened rather than when the class time passed.
 *
 * Any skip-derived UI surface (banner label, indicator dot, card background
 * tint, skip/unskip button state, status badge) should call this helper so
 * they all agree on "are we currently skipping?".
 */
export function isSkipCurrentlyActive(
  recurringClass: Pick<RecurringClass, 'skip_next_occurrence' | 'skip_target_datetime'>
): boolean {
  return !!(
    recurringClass.skip_target_datetime &&
    new Date() < new Date(recurringClass.skip_target_datetime)
  )
}
