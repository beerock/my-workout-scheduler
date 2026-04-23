'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { calculateNextOccurrence, formatTime12Hour } from '@/lib/date-utils'
import { isRetrying } from '@/lib/booking-error-utils'

/**
 * An action-required item surfaced on the dashboard failure surface. Today
 * covers two categories with clean in-app actions: credentials problems
 * (update gym login) and config drift (class name/branch/time don't match
 * the YMCA schedule). Technical/retrying failures are NOT surfaced here —
 * the system is handling those autonomously.
 */
export type DashboardActionItem = {
  classId: string
  className: string
  dayTime: string // "Monday 4:15 PM"
  branch: string
  category: 'credentials' | 'config'
  // Voice per docs/VOICE.md Need-your-help tier — single sentence, active verb.
  message: string
  ctaText: string
  ctaHref: string
}

export type DashboardStats = {
  activeClasses: number
  successRate: number
  totalBookingAttempts: number
  bookingsThisWeek: number
  nextBooking: {
    className: string
    dayTime: string
    hoursUntil: number
    branch: string
    bookingStatus: 'confirmed' | 'waitlisted' | 'pending'
    // When the booking window opens for this specific occurrence, pre-formatted
    // in the gym's timezone (e.g. "Wed, Apr 30 · 5:00 AM"). Only set when the
    // status is 'pending' and the window hasn't opened yet; null otherwise.
    bookingOpensAt: string | null
    // True only when we know the booking function is actively retrying the
    // "class full" loop (latest attempt status='failed' with 'full' keyword).
    // NextClassCard uses this to decide between "On deck / in X hrs" (default
    // pending) and "Watching / Checking every 15 min" (active retry).
    isRetrying: boolean
  } | null
  // Empty array when no class needs user action. The dashboard renders the
  // ActionItemsCard only when this is non-empty.
  actionItems: DashboardActionItem[]
}

export async function getDashboardStats(): Promise<{
  success: boolean
  stats?: DashboardStats
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Queries 1 & 2 are independent - run in parallel
    const [classesResult, attemptsResult] = await Promise.all([
      // 1. Get active recurring classes (also gives us active count)
      supabase
        .from('recurring_classes')
        .select('id, class_type, day_of_week, class_time, timezone, branch, skip_next_occurrence, booking_window_hours')
        .eq('user_id', user.id)
        .eq('active', true),
      // 2. All booking attempts for success rate calculation
      supabase
        .from('booking_attempts')
        .select('status, error_message, recurring_classes!inner(user_id)')
        .eq('recurring_classes.user_id', user.id)
        .neq('status', 'pending')
        .neq('status', 'skipped'),
    ])

    if (classesResult.error) {
      console.error('Error fetching user classes:', classesResult.error)
      return { success: false, error: 'Failed to fetch user classes' }
    }

    const userClasses = classesResult.data
    const activeClasses = userClasses?.length ?? 0
    const classIds = userClasses?.map(c => c.id) || []

    // Calculate success rate from attempts
    let successRate = 0
    let totalBookingAttempts = 0

    if (attemptsResult.error) {
      console.error('Error fetching booking attempts:', attemptsResult.error)
    } else if (attemptsResult.data && attemptsResult.data.length > 0) {
      const isClassFull = (attempt: { status: string; error_message: string | null }) => {
        if (attempt.status !== 'failed') return false
        if (!attempt.error_message) return false
        const msg = attempt.error_message.toLowerCase()
        return msg.includes('full') && !msg.includes('waitlist')
      }

      const countableAttempts = attemptsResult.data.filter(a => !isClassFull(a))
      totalBookingAttempts = countableAttempts.length

      const successful = countableAttempts.filter(
        a => a.status === 'confirmed' || a.status === 'waitlisted'
      ).length
      successRate = totalBookingAttempts > 0
        ? Math.round((successful / totalBookingAttempts) * 100)
        : 0
    }

    // 4. Count bookings this week (confirmed + waitlisted)
    // Use Eastern time for week boundaries since all classes are ET
    let bookingsThisWeek = 0
    if (classIds.length > 0) {
      const nowET = toZonedTime(new Date(), 'America/New_York')
      const weekStart = startOfWeek(nowET, { weekStartsOn: 0 }).toISOString()
      const weekEnd = endOfWeek(nowET, { weekStartsOn: 0 }).toISOString()

      const { count: weekCount, error: weekError } = await supabase
        .from('booking_attempts')
        .select('*', { count: 'exact', head: true })
        .in('recurring_class_id', classIds)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd)
        .in('status', ['confirmed', 'waitlisted'])

      if (weekError) {
        console.error('Error fetching weekly bookings:', weekError)
      } else {
        bookingsThisWeek = weekCount || 0
      }
    }

    // 5. Find next booking (next scheduled class)
    let nextBooking: DashboardStats['nextBooking'] = null

    if (userClasses && userClasses.length > 0) {
      const now = new Date()
      let soonest: DashboardStats['nextBooking'] = null
      let soonestTime = Infinity
      let soonestClassId: string | null = null
      let soonestOccurrence: Date | null = null
      let soonestBookingWindowHours = 26 // Per-class override set below when picking the winner

      for (const cls of userClasses) {
        try {
          let nextOccurrence = calculateNextOccurrence(
            cls.day_of_week,
            cls.class_time,
            cls.timezone
          )

          // If class is skipped, show the occurrence AFTER the skip (next week)
          if (cls.skip_next_occurrence) {
            nextOccurrence = new Date(nextOccurrence.getTime() + 7 * 24 * 60 * 60 * 1000)
          }

          const hoursUntil = (nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60)

          if (hoursUntil > 0 && hoursUntil < soonestTime) {
            soonestTime = hoursUntil
            soonestClassId = cls.id
            soonestOccurrence = nextOccurrence
            soonestBookingWindowHours = cls.booking_window_hours

            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const dayName = dayNames[cls.day_of_week]
            // Use stored class_time directly - no timezone conversion needed
            const timeStr = formatTime12Hour(cls.class_time)

            soonest = {
              className: cls.class_type,
              dayTime: `${dayName} ${timeStr}`,
              hoursUntil: Math.round(hoursUntil),
              branch: cls.branch,
              bookingStatus: 'pending', // Default, may be updated below
              bookingOpensAt: null, // Default, set below for pre-window pending state
              isRetrying: false, // Default, flipped below if latest attempt is a class-full retry
            }
          }
        } catch (e) {
          console.error('Error calculating next occurrence:', e)
        }
      }

      // Query booking status for the soonest class.
      //
      // Lookback window: we used to filter on attempts >= (occurrence - booking_window_hours),
      // but that computed floor misses:
      //   1. Early-start optimization attempts (scheduler fires ~90s before the window opens,
      //      so attempt_timestamp can be slightly before the floor).
      //   2. Classes where the stored booking_window_hours is shorter than the real YMCA window
      //      (attempt fires at the real earlier moment, slips outside the computed floor).
      //   3. Clock drift between scheduler and DB insert.
      // All three manifested as a confirmed class rendering the "Watching / Checking every 15 min"
      // fallback on the dashboard, which was obviously wrong.
      //
      // Fix: use (occurrence - 7 days) as the floor. For a WEEKLY recurring class, the only
      // confirmed attempt that can exist for *this specific upcoming occurrence* is one made
      // within the last 7 days (last week's occurrence was already consumed). Simpler and
      // more forgiving than trying to precisely model the booking window.
      if (soonest && soonestClassId && soonestOccurrence) {
        const windowOpenMs =
          soonestOccurrence.getTime() - soonestBookingWindowHours * 60 * 60 * 1000
        const lookbackFloorMs =
          soonestOccurrence.getTime() - 7 * 24 * 60 * 60 * 1000
        const lookbackFloor = new Date(lookbackFloorMs).toISOString()

        // Four pending sub-states the card needs to distinguish:
        //   - confirmed / waitlisted → the booking landed, show that result
        //   - pre-window (booking window hasn't opened yet) → "On deck /
        //     Opens Wed, Apr 30 · 5:00 AM"
        //   - within window, actively retrying class-full loop → "Watching /
        //     Checking every 15 min" (isRetrying=true, the ONE case where
        //     we genuinely know a retry loop is running because we kicked it
        //     off ourselves)
        //   - within window, any other pending reality → "On deck / in X hrs"
        //     (the default — we see a class coming up, we don't assert more
        //     than we know; users can register via the YMCA app / website
        //     outside this system)
        //
        // Date is always included in the pre-window format ("Wed, Apr 30 ·
        // 5:00 AM") so users can't confuse this Wednesday with next
        // Wednesday — matters whenever the next occurrence is 7+ days out
        // (skipped class, or current window already passed).
        // Surface the Supabase error explicitly rather than letting a null
        // `recentAttempts` silently fall through to the default pending
        // state. A confirmed booking whose attempt row we failed to read
        // (RLS drift, column rename, transient connection error) would
        // otherwise render as "On deck" — wrong in a way the user can't
        // see or report.
        const { data: recentAttempts, error: attemptsError } = await supabase
          .from('booking_attempts')
          .select('status, error_message')
          .eq('recurring_class_id', soonestClassId)
          .gte('attempt_timestamp', lookbackFloor)
          .order('attempt_timestamp', { ascending: false })
          .limit(1)

        if (attemptsError) {
          console.error(
            '[dashboard-stats] booking_attempts query failed; falling back to default pending state:',
            attemptsError
          )
        }

        const latestAttempt = recentAttempts?.[0]
        const isConfirmedOrWaitlisted =
          latestAttempt?.status === 'confirmed' || latestAttempt?.status === 'waitlisted'

        if (isConfirmedOrWaitlisted) {
          soonest.bookingStatus = latestAttempt.status as 'confirmed' | 'waitlisted'
        } else if (windowOpenMs > now.getTime()) {
          const winningClass = userClasses.find((c) => c.id === soonestClassId)
          const tz = winningClass?.timezone ?? 'America/New_York'
          soonest.bookingOpensAt = formatInTimeZone(
            new Date(windowOpenMs),
            tz,
            'EEE, MMM d · h:mm a'
          )
        } else if (
          latestAttempt &&
          // Contract: `isRetrying(status, errorMessage)` from
          // `lib/booking-error-utils.ts` — returns true when status='failed'
          // with a "full" (non-waitlist) errorMessage, i.e. the Inngest
          // retry loop is actively running every 15 min. If that helper's
          // semantic narrows (e.g. gets renamed to `isClassFullRetry`), the
          // NextClassCard "Watching / Checking every 15 min" copy ties to
          // THIS specific signal — don't desync.
          isRetrying(latestAttempt.status, latestAttempt.error_message)
        ) {
          soonest.isRetrying = true
        }
        // else: within booking window / post-window with no active retry
        //       loop → leave defaults; NextClassCard renders "On deck /
        //       in X hrs" based on hoursUntil.
      }

      nextBooking = soonest
    }

    // 6. Build the action-items list for the dashboard failure surface.
    // Per-class: look at the MOST RECENT non-skipped attempt. If it's a
    // credentials problem or config drift, surface an action item. Technical
    // and class-full/retrying failures are NOT surfaced here — the system is
    // already handling those autonomously and showing them as "Needs your
    // help" would mislead the user.
    const actionItems: DashboardActionItem[] = []
    if (userClasses && userClasses.length > 0 && classIds.length > 0) {
      // Fetch the most recent attempt per class AND the user's credential
      // update timestamp in parallel. The credential timestamp gates stale
      // credentials action-items: if a user re-saved their gym login AFTER
      // the failed attempt, assume it's now fixed and suppress the card
      // rather than showing "your login stopped working" until the next
      // booking run proves it.
      const [recentAttemptsRes, credentialsRes] = await Promise.all([
        supabase
          .from('booking_attempts')
          .select('recurring_class_id, status, error_message, attempt_timestamp')
          .in('recurring_class_id', classIds)
          .neq('status', 'skipped')
          .order('attempt_timestamp', { ascending: false }),
        supabase
          .from('gym_credentials')
          .select('updated_at')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      const recentAttempts = recentAttemptsRes.data
      const credentialsUpdatedAt = credentialsRes.data?.updated_at
        ? new Date(credentialsRes.data.updated_at).getTime()
        : null

      const seen = new Set<string>()
      // Overloaded "login" / "credentials" also appear in config errors
      // (e.g. "password changed for login foo@bar"), so we keep the broad
      // match here — the categorizeFailure split happens downstream via
      // lib/booking-error-utils.ts. Keep these in sync with the email
      // routing keyword list per CLAUDE.md.
      const credentialsKeywords = ['login', 'password', 'credentials', 'sign in', 'authentication']
      const configKeywords = [
        'not found',
        'class disappeared',
        'branch selection failed',
        'branch mismatch',
        'wrong class',
        'class name',
      ]

      for (const attempt of recentAttempts ?? []) {
        if (seen.has(attempt.recurring_class_id)) continue
        seen.add(attempt.recurring_class_id)

        if (attempt.status !== 'failed' || !attempt.error_message) continue
        const msg = attempt.error_message.toLowerCase()

        const cls = userClasses.find((c) => c.id === attempt.recurring_class_id)
        if (!cls) continue

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayTime = `${dayNames[cls.day_of_week]} ${formatTime12Hour(cls.class_time)}`

        if (credentialsKeywords.some((kw) => msg.includes(kw))) {
          // Suppress stale credentials items: if the user re-saved their
          // gym credentials AFTER this attempt failed, assume the fix is
          // in place and don't nag them about an attempt that predates it.
          // Next booking run will produce a fresh signal either way.
          const attemptMs = new Date(attempt.attempt_timestamp).getTime()
          if (credentialsUpdatedAt !== null && credentialsUpdatedAt > attemptMs) continue

          actionItems.push({
            classId: cls.id,
            className: cls.class_type,
            dayTime,
            branch: cls.branch,
            category: 'credentials',
            message: 'Your gym login stopped working. Update your credentials — booking picks up at your next class.',
            ctaText: 'Update credentials',
            ctaHref: '/dashboard/credentials',
          })
        } else if (configKeywords.some((kw) => msg.includes(kw))) {
          actionItems.push({
            classId: cls.id,
            className: cls.class_type,
            dayTime,
            branch: cls.branch,
            category: 'config',
            message: "Couldn't find this class on the YMCA schedule. It may have been renamed, rescheduled, or moved branches.",
            ctaText: 'Edit class',
            // Deep link to the specific class when we can. The ActionItemsCard
            // only uses this single-item href when items.length === 1; the
            // multi-item case falls back to /dashboard/schedule so the user
            // can pick which one to edit.
            ctaHref: `/dashboard/schedule/edit/${cls.id}`,
          })
        }
      }
    }

    return {
      success: true,
      stats: {
        activeClasses: activeClasses || 0,
        successRate,
        totalBookingAttempts,
        bookingsThisWeek,
        nextBooking,
        actionItems,
      }
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
