'use server'

import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

// Only show completed booking statuses (hide pending/skipped)
export type BookingStatus = 'confirmed' | 'waitlisted' | 'failed'

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

export type BookingHistoryResult = {
  success: boolean
  history?: BookingHistoryItem[]
  totalCount?: number // Total matching records for pagination
  error?: string
}

// Visible statuses for booking history (filter out pending/skipped)
const VISIBLE_STATUSES: BookingStatus[] = ['confirmed', 'waitlisted', 'failed']

/**
 * Get booking history for the current user
 * Returns completed booking attempts (confirmed, waitlisted, failed) within the specified time window.
 * Supports pagination via limit/offset for "Load More" functionality.
 *
 * @param days - Number of days to look back (default: 30)
 * @param limit - Maximum number of records to return (default: 20)
 * @param offset - Number of records to skip for pagination (default: 0)
 */
export async function getBookingHistory(
  days: number = 30,
  limit: number = 20,
  offset: number = 0
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

    // Get total count for pagination (only visible statuses)
    const { count, error: countError } = await supabase
      .from('booking_attempts')
      .select('id', { count: 'exact', head: true })
      .in('recurring_class_id', classIds)
      .gte('created_at', sinceDate)
      .in('status', VISIBLE_STATUSES)

    if (countError) {
      console.error('Error counting booking attempts:', countError)
    }

    // Get booking attempts with pagination (only visible statuses)
    const { data: attempts, error: attemptsError } = await supabase
      .from('booking_attempts')
      .select('id, recurring_class_id, status, branch_used, error_message, created_at, attempt_timestamp')
      .in('recurring_class_id', classIds)
      .gte('created_at', sinceDate)
      .in('status', VISIBLE_STATUSES)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (attemptsError) {
      console.error('Error fetching booking attempts:', attemptsError)
      return { success: false, error: 'Failed to fetch booking history' }
    }

    // Create a map for class details
    const classMap = new Map(userClasses.map(c => [c.id, c]))

    // Join the data
    const history: BookingHistoryItem[] = (attempts || []).map(attempt => {
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

    return { success: true, history, totalCount: count ?? 0 }
  } catch (error) {
    console.error('Error in getBookingHistory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
