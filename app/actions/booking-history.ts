'use server'

import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

export type BookingHistoryItem = {
  id: string
  recurring_class_id: string
  status: 'pending' | 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
  branch_used: string | null
  error_message: string | null
  created_at: string
  attempt_timestamp: string
  // Joined from recurring_classes
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
}

export type BookingHistoryResult = {
  success: boolean
  history?: BookingHistoryItem[]
  error?: string
}

/**
 * Get booking history for the current user
 * Returns the last 30 days of booking attempts
 */
export async function getBookingHistory(days: number = 30): Promise<BookingHistoryResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get recurring class IDs for this user
    const { data: userClasses, error: classesError } = await supabase
      .from('recurring_classes')
      .select('id, class_type, day_of_week, class_time, branch')
      .eq('user_id', user.id)

    if (classesError) {
      console.error('Error fetching user classes:', classesError)
      return { success: false, error: 'Failed to fetch classes' }
    }

    if (!userClasses || userClasses.length === 0) {
      return { success: true, history: [] }
    }

    const classIds = userClasses.map(c => c.id)
    const sinceDate = subDays(new Date(), days).toISOString()

    // Get booking attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('booking_attempts')
      .select('*')
      .in('recurring_class_id', classIds)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false })

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
        status: attempt.status,
        branch_used: attempt.branch_used,
        error_message: attempt.error_message,
        created_at: attempt.created_at,
        attempt_timestamp: attempt.attempt_timestamp,
        class_type: classDetails?.class_type || 'Unknown',
        day_of_week: classDetails?.day_of_week || 0,
        class_time: classDetails?.class_time || '',
        branch: classDetails?.branch || '',
      }
    })

    return { success: true, history }
  } catch (error) {
    console.error('Error in getBookingHistory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
