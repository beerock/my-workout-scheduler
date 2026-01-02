'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subDays } from 'date-fns'
import { calculateNextOccurrence, formatTime12Hour } from '@/lib/date-utils'

export type DashboardStats = {
  activeClasses: number
  successRate: number
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

    // 1. Count active classes
    const { count: activeClasses, error: activeError } = await supabase
      .from('recurring_classes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('active', true)

    if (activeError) {
      console.error('Error fetching active classes:', activeError)
      return { success: false, error: 'Failed to fetch active classes' }
    }

    // 2. Get recurring class IDs for this user (needed for booking_attempts query)
    const { data: userClasses, error: classesError } = await supabase
      .from('recurring_classes')
      .select('id, class_type, day_of_week, class_time, timezone, branch')
      .eq('user_id', user.id)

    if (classesError) {
      console.error('Error fetching user classes:', classesError)
      return { success: false, error: 'Failed to fetch user classes' }
    }

    const classIds = userClasses?.map(c => c.id) || []

    // 3. Calculate success rate from last 30 days
    let successRate = 0
    if (classIds.length > 0) {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

      const { data: attempts, error: attemptsError } = await supabase
        .from('booking_attempts')
        .select('status')
        .in('recurring_class_id', classIds)
        .gte('created_at', thirtyDaysAgo)
        .neq('status', 'pending') // Exclude pending from calculation

      if (attemptsError) {
        console.error('Error fetching booking attempts:', attemptsError)
      } else if (attempts && attempts.length > 0) {
        const successful = attempts.filter(
          a => a.status === 'confirmed' || a.status === 'waitlisted'
        ).length
        successRate = Math.round((successful / attempts.length) * 100)
      }
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

      for (const cls of userClasses) {
        try {
          const nextOccurrence = calculateNextOccurrence(
            cls.day_of_week,
            cls.class_time,
            cls.timezone
          )
          const hoursUntil = (nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60)

          if (hoursUntil > 0 && hoursUntil < soonestTime) {
            soonestTime = hoursUntil
            soonestClassId = cls.id

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
      // Look for confirmed/waitlisted bookings that happened after the booking window opened
      // (typically 26 hours before class, but we use 7 days as a safe window for weekly classes)
      if (soonest && soonestClassId) {
        // For weekly recurring classes, look for recent bookings (within last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: bookingAttempt } = await supabase
          .from('booking_attempts')
          .select('status')
          .eq('recurring_class_id', soonestClassId)
          .gte('attempt_timestamp', sevenDaysAgo)
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
        bookingsThisWeek,
        nextBooking
      }
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
