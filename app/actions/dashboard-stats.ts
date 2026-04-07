'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek } from 'date-fns'
import { calculateNextOccurrence, formatTime12Hour } from '@/lib/date-utils'

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
  } | null
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

    // Queries 1, 2, 3 are independent - run in parallel
    const [activeResult, classesResult, attemptsResult] = await Promise.all([
      // 1. Count active classes
      supabase
        .from('recurring_classes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('active', true),
      // 2. Get active recurring classes (needed for queries 4 & 5)
      supabase
        .from('recurring_classes')
        .select('id, class_type, day_of_week, class_time, timezone, branch, skip_next_occurrence')
        .eq('user_id', user.id)
        .eq('active', true),
      // 3. All booking attempts for success rate calculation
      supabase
        .from('booking_attempts')
        .select('status, error_message, recurring_classes!inner(user_id)')
        .eq('recurring_classes.user_id', user.id)
        .neq('status', 'pending')
        .neq('status', 'skipped'),
    ])

    if (activeResult.error) {
      console.error('Error fetching active classes:', activeResult.error)
      return { success: false, error: 'Failed to fetch active classes' }
    }

    if (classesResult.error) {
      console.error('Error fetching user classes:', classesResult.error)
      return { success: false, error: 'Failed to fetch user classes' }
    }

    const activeClasses = activeResult.count
    const userClasses = classesResult.data
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
    let bookingsThisWeek = 0
    if (classIds.length > 0) {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }).toISOString()
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 }).toISOString()

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

            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const dayName = dayNames[cls.day_of_week]
            // Use stored class_time directly - no timezone conversion needed
            const timeStr = formatTime12Hour(cls.class_time)

            soonest = {
              className: cls.class_type,
              dayTime: `${dayName} ${timeStr}`,
              hoursUntil: Math.round(hoursUntil),
              branch: cls.branch,
              bookingStatus: 'pending' // Default, will be updated below
            }
          }
        } catch (e) {
          console.error('Error calculating next occurrence:', e)
        }
      }

      // Query booking status for the soonest class
      // Only look for bookings made AFTER the booking window opened for this specific occurrence
      // (booking window typically opens 26 hours before class)
      if (soonest && soonestClassId && soonestOccurrence) {
        // Calculate when booking window opened for this occurrence (26 hours before class)
        const bookingWindowOpen = new Date(soonestOccurrence.getTime() - 26 * 60 * 60 * 1000).toISOString()

        const { data: bookingAttempt } = await supabase
          .from('booking_attempts')
          .select('status')
          .eq('recurring_class_id', soonestClassId)
          .gte('attempt_timestamp', bookingWindowOpen)
          .in('status', ['confirmed', 'waitlisted'])
          .order('attempt_timestamp', { ascending: false })
          .limit(1)
          .single()

        if (bookingAttempt) {
          soonest.bookingStatus = bookingAttempt.status as 'confirmed' | 'waitlisted'
        }
      }

      nextBooking = soonest
    }

    return {
      success: true,
      stats: {
        activeClasses: activeClasses || 0,
        successRate,
        totalBookingAttempts,
        bookingsThisWeek,
        nextBooking
      }
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
