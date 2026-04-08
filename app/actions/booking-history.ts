'use server'

import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

// Only show completed booking statuses (hide pending/skipped)
export type BookingStatus = 'confirmed' | 'waitlisted' | 'failed' | 'no_registration'

export type BookingHistoryItem = {
  id: string
  recurring_class_id: string
  status: BookingStatus
  branch_used: string | null
  error_message: string | null
  created_at: string
  attempt_timestamp: string
  // Joined from recurring_classes
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
  booking_window_hours: number
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
  totalCount?: number // Total matching records for pagination
  statusCounts?: StatusCounts // Total counts by status for filter pills
  error?: string
}

// Visible statuses for booking history (filter out pending/skipped)
const VISIBLE_STATUSES: BookingStatus[] = ['confirmed', 'waitlisted', 'failed', 'no_registration']

// Filter options include 'retrying' which is derived from failed + 'full' error
export type FilterOption = 'all' | BookingStatus | 'retrying'

/**
 * Get booking history for the current user
 * Returns completed booking attempts (confirmed, waitlisted, failed) within the specified time window.
 * Supports pagination via limit/offset for "Load More" functionality.
 * Supports filtering by status for per-filter fetching.
 *
 * @param days - Number of days to look back (default: 30)
 * @param limit - Maximum number of records to return (default: 20)
 * @param offset - Number of records to skip for pagination (default: 0)
 * @param statusFilter - Optional status filter ('all', 'confirmed', 'waitlisted', 'retrying', 'failed')
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
      .select('id, class_type, day_of_week, class_time, branch, booking_window_hours')
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

    // Get counts by status for filter pills (run in parallel)
    // We need all failed items to separate "class full" from actual failures
    const [confirmedResult, waitlistedResult, failedResult, noRegistrationResult] = await Promise.all([
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

    // Determine the total count for the current filter
    let filterTotalCount: number
    switch (statusFilter) {
      case 'confirmed':
        filterTotalCount = statusCounts.confirmed
        break
      case 'waitlisted':
        filterTotalCount = statusCounts.waitlisted
        break
      case 'retrying':
        filterTotalCount = statusCounts.classFull
        break
      case 'failed':
        filterTotalCount = statusCounts.failed
        break
      case 'no_registration':
        filterTotalCount = statusCounts.noRegistration
        break
      default:
        filterTotalCount = statusCounts.all
    }

    // Build the main query based on status filter
    let attemptsQuery = supabase
      .from('booking_attempts')
      .select('id, recurring_class_id, status, branch_used, error_message, created_at, attempt_timestamp')
      .in('recurring_class_id', classIds)
      .gte('created_at', sinceDate)

    // Apply status filter
    if (statusFilter === 'all') {
      attemptsQuery = attemptsQuery.in('status', VISIBLE_STATUSES)
    } else if (statusFilter === 'confirmed' || statusFilter === 'waitlisted' || statusFilter === 'no_registration') {
      attemptsQuery = attemptsQuery.eq('status', statusFilter)
    } else if (statusFilter === 'retrying') {
      // "Class full" errors - failed status with 'full' in error message (but not 'waitlist')
      attemptsQuery = attemptsQuery
        .eq('status', 'failed')
        .ilike('error_message', '%full%')
        .not('error_message', 'ilike', '%waitlist%')
    }

    // For 'failed' filter, we need special handling because Supabase doesn't easily support
    // NOT ILIKE with OR for NULL values. We'll fetch failed items and filter client-side.
    type AttemptRow = {
      id: string
      recurring_class_id: string
      status: string
      branch_used: string | null
      error_message: string | null
      created_at: string
      attempt_timestamp: string
    }
    let filteredAttempts: AttemptRow[] = []

    if (statusFilter === 'failed') {
      // Fetch all failed items (up to a reasonable limit) and filter client-side
      const { data: failedAttempts, error: failedError } = await supabase
        .from('booking_attempts')
        .select('id, recurring_class_id, status, branch_used, error_message, created_at, attempt_timestamp')
        .in('recurring_class_id', classIds)
        .gte('created_at', sinceDate)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })

      if (failedError) {
        console.error('Error fetching failed attempts:', failedError)
        return { success: false, error: 'Failed to fetch booking history' }
      }

      // Filter out "class full" errors, then apply pagination
      const actualFailures = (failedAttempts || []).filter(a => !isClassFullError(a.error_message))
      filteredAttempts = actualFailures.slice(offset, offset + limit)
    } else {
      // Apply ordering and pagination for other filters
      const { data: attempts, error: attemptsError } = await attemptsQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (attemptsError) {
        console.error('Error fetching booking attempts:', attemptsError)
        return { success: false, error: 'Failed to fetch booking history' }
      }

      filteredAttempts = attempts || []
    }

    // Create a map for class details
    const classMap = new Map(userClasses.map(c => [c.id, c]))

    // Join the data
    const history: BookingHistoryItem[] = filteredAttempts.map(attempt => {
      const classDetails = classMap.get(attempt.recurring_class_id)
      return {
        id: attempt.id,
        recurring_class_id: attempt.recurring_class_id,
        status: attempt.status as BookingStatus,
        branch_used: attempt.branch_used,
        error_message: attempt.error_message,
        created_at: attempt.created_at,
        attempt_timestamp: attempt.attempt_timestamp,
        class_type: classDetails?.class_type || 'Unknown',
        day_of_week: classDetails?.day_of_week || 0,
        class_time: classDetails?.class_time || '',
        branch: classDetails?.branch || '',
        booking_window_hours: classDetails?.booking_window_hours || 26,
      }
    })

    return { success: true, history, totalCount: filterTotalCount, statusCounts }
  } catch (error) {
    console.error('Error in getBookingHistory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
