'use server'

import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'
import { categorizeFailure } from '@/lib/booking-error-utils'

// Only show completed booking statuses (hide pending/skipped)
export type BookingStatus = 'confirmed' | 'waitlisted' | 'failed' | 'no_registration'

export type BookingHistoryItem = {
  id: string
  recurring_class_id: string
  status: BookingStatus
  branch_used: string | null
  error_message: string | null
  created_at: string        // most recent attempt time (used for date grouping + display)
  firstAttemptAt: string    // oldest attempt time in the group (= created_at when attemptCount === 1)
  attempt_timestamp: string
  // Joined from recurring_classes
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
  timezone: string
  booking_window_hours: number
  // Number of raw attempts collapsed into this entry (>1 means retries were deduped)
  attemptCount: number
}

export type StatusCounts = {
  all: number
  confirmed: number
  waitlisted: number
  classFull: number  // "Class full" errors (derived from failed)
  failed: number     // Actual failures (failed minus class full)
  noRegistration: number // Classes without online registration
}

export type BookingHistoryResult = {
  success: boolean
  history?: BookingHistoryItem[]
  totalCount?: number // Total deduplicated records for pagination
  statusCounts?: StatusCounts // Total counts by status for filter pills (raw attempt counts)
  error?: string
}

// Visible statuses for booking history (filter out pending/skipped)
const VISIBLE_STATUSES: BookingStatus[] = ['confirmed', 'waitlisted', 'failed', 'no_registration']

// Filter options include 'retrying' which is derived from failed + 'full' error
export type FilterOption = 'all' | BookingStatus | 'retrying'

/**
 * Get booking history for the current user.
 * Fetches all matching attempts, deduplicates by class occurrence (collapsing retry
 * loops into one card), then paginates the deduplicated result.
 *
 * @param days - Number of days to look back (default: 30)
 * @param limit - Maximum number of deduplicated records to return (default: 20)
 * @param offset - Number of deduplicated records to skip for pagination (default: 0)
 * @param statusFilter - Optional status filter
 */
export async function getBookingHistory(
  days: number = 30,
  limit: number = 20,
  offset: number = 0,
  statusFilter: FilterOption = 'all'
): Promise<BookingHistoryResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get recurring class IDs for this user (including inactive for history)
    const { data: userClasses, error: classesError } = await supabase
      .from('recurring_classes')
      .select('id, class_type, day_of_week, class_time, branch, timezone, booking_window_hours')
      .eq('user_id', user.id)

    if (classesError) {
      console.error('Error fetching user classes:', classesError)
      return { success: false, error: 'Failed to fetch classes' }
    }

    if (!userClasses || userClasses.length === 0) {
      return { success: true, history: [], totalCount: 0 }
    }

    const classIds = userClasses.map(c => c.id)
    const sinceDate = subDays(new Date(), days).toISOString()

    // Helper to check if error message indicates "class full"
    const isClassFullError = (errorMessage: string | null) => {
      const msg = (errorMessage || '').toLowerCase()
      return msg.includes('full') && !msg.includes('waitlist')
    }

    // Get counts by status for filter pills (run in parallel with main query)
    // These are raw attempt counts — intentionally not deduped so the pills
    // reflect true attempt volume. Only totalCount (for pagination) is deduped.
    const [confirmedResult, waitlistedResult, failedResult, noRegistrationResult, allAttemptsResult] =
      await Promise.all([
        supabase
          .from('booking_attempts')
          .select('id', { count: 'exact', head: true })
          .in('recurring_class_id', classIds)
          .gte('created_at', sinceDate)
          .eq('status', 'confirmed'),
        supabase
          .from('booking_attempts')
          .select('id', { count: 'exact', head: true })
          .in('recurring_class_id', classIds)
          .gte('created_at', sinceDate)
          .eq('status', 'waitlisted'),
        supabase
          .from('booking_attempts')
          .select('id, error_message')
          .in('recurring_class_id', classIds)
          .gte('created_at', sinceDate)
          .eq('status', 'failed'),
        supabase
          .from('booking_attempts')
          .select('id', { count: 'exact', head: true })
          .in('recurring_class_id', classIds)
          .gte('created_at', sinceDate)
          .eq('status', 'no_registration'),
        // Fetch all visible attempts for this filter window (no limit — MVP dataset is tiny)
        supabase
          .from('booking_attempts')
          .select('id, recurring_class_id, status, branch_used, error_message, created_at, attempt_timestamp')
          .in('recurring_class_id', classIds)
          .gte('created_at', sinceDate)
          .in('status', VISIBLE_STATUSES)
          .order('created_at', { ascending: false }),
      ])

    // Calculate class full vs actual failed counts
    const allFailedItems = failedResult.data || []
    const classFullCount = allFailedItems.filter(item => isClassFullError(item.error_message)).length
    const actualFailedCount = allFailedItems.length - classFullCount

    const noRegistrationCount = noRegistrationResult.count ?? 0
    const allCount = (confirmedResult.count ?? 0) + (waitlistedResult.count ?? 0) + allFailedItems.length + noRegistrationCount

    const statusCounts: StatusCounts = {
      all: allCount,
      confirmed: confirmedResult.count ?? 0,
      waitlisted: waitlistedResult.count ?? 0,
      classFull: classFullCount,
      failed: actualFailedCount,
      noRegistration: noRegistrationCount,
    }

    if (allAttemptsResult.error) {
      console.error('Error fetching booking attempts:', allAttemptsResult.error)
      return { success: false, error: 'Failed to fetch booking history' }
    }

    const allAttempts = allAttemptsResult.data || []

    // Apply client-side status filter
    type AttemptRow = {
      id: string
      recurring_class_id: string
      status: string
      branch_used: string | null
      error_message: string | null
      created_at: string
      attempt_timestamp: string
    }

    let filteredAttempts: AttemptRow[]
    if (statusFilter === 'all') {
      filteredAttempts = allAttempts
    } else if (statusFilter === 'retrying') {
      filteredAttempts = allAttempts.filter(
        a => a.status === 'failed' && isClassFullError(a.error_message)
      )
    } else if (statusFilter === 'failed') {
      filteredAttempts = allAttempts.filter(
        a => a.status === 'failed' && !isClassFullError(a.error_message)
      )
    } else {
      filteredAttempts = allAttempts.filter(a => a.status === statusFilter)
    }

    // Build class metadata lookup
    const classMap = new Map(userClasses.map(c => [c.id, c]))

    // Enrich with class data
    const enriched = filteredAttempts.map(attempt => {
      const classDetails = classMap.get(attempt.recurring_class_id)
      return {
        id: attempt.id,
        recurring_class_id: attempt.recurring_class_id,
        status: attempt.status as BookingStatus,
        branch_used: attempt.branch_used,
        error_message: attempt.error_message,
        created_at: attempt.created_at,
        firstAttemptAt: attempt.created_at,
        attempt_timestamp: attempt.attempt_timestamp,
        class_type: classDetails?.class_type || 'Unknown',
        day_of_week: classDetails?.day_of_week || 0,
        class_time: classDetails?.class_time || '',
        branch: classDetails?.branch || '',
        timezone: classDetails?.timezone || 'America/New_York',
        booking_window_hours: classDetails?.booking_window_hours || 26,
        attemptCount: 1,
      }
    })

    // Collapse repeated attempts for the same class on the same calendar day.
    // This gives one card per (class, day) — e.g. Thursday's BODYPUMP retries
    // collapse to one card, Friday's collapse to a separate card.
    // Items arrive newest-first; the first item seen per key = most recent attempt.
    // Each successive item is older → its created_at becomes firstAttemptAt.
    // error_message is set to the most critical error across all attempts in the group.
    const CATEGORY_PRIORITY: Record<string, number> = { critical: 3, config: 2, technical: 1, retrying: 0 }
    const occurrenceMap = new Map<string, typeof enriched[0]>()
    const occurrenceCounts = new Map<string, number>()
    const firstAttemptMap = new Map<string, string>()   // key → oldest created_at
    const criticalErrorMap = new Map<string, string | null>() // key → most critical error_message
    const criticalPriorityMap = new Map<string, number>()     // key → priority of stored error

    for (const item of enriched) {
      // Use UTC date of the attempt — late-night ET attempts could cross UTC midnight,
      // but booking windows open in morning ET so this is safe in practice.
      const dayKey = item.created_at.slice(0, 10)
      const key = `${item.recurring_class_id}::${dayKey}`
      const itemPriority = CATEGORY_PRIORITY[categorizeFailure(item.error_message).category] ?? 0

      if (!occurrenceMap.has(key)) {
        occurrenceMap.set(key, item)
        occurrenceCounts.set(key, 1)
        firstAttemptMap.set(key, item.created_at)
        criticalErrorMap.set(key, item.error_message)
        criticalPriorityMap.set(key, itemPriority)
      } else {
        occurrenceCounts.set(key, (occurrenceCounts.get(key) ?? 1) + 1)
        firstAttemptMap.set(key, item.created_at)
        if (itemPriority > (criticalPriorityMap.get(key) ?? 0)) {
          criticalErrorMap.set(key, item.error_message)
          criticalPriorityMap.set(key, itemPriority)
        }
      }
    }

    // Build full deduplicated list, then paginate
    const allDeduped: BookingHistoryItem[] = Array.from(occurrenceMap.entries()).map(([key, item]) => ({
      ...item,
      error_message: criticalErrorMap.get(key) ?? item.error_message,
      attemptCount: occurrenceCounts.get(key) ?? 1,
      firstAttemptAt: firstAttemptMap.get(key) ?? item.created_at,
    }))

    const history = allDeduped.slice(offset, offset + limit)

    return {
      success: true,
      history,
      totalCount: allDeduped.length, // deduped count drives "Load More"
      statusCounts,
    }
  } catch (error) {
    console.error('Error in getBookingHistory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
