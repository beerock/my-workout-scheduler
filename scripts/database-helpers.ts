/**
 * Database helper functions for booking automation
 * Uses Supabase service role key to bypass RLS
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'
import { decryptPassword } from '../lib/encryption'

type SupabaseClient = ReturnType<typeof createClient<Database>>

let supabaseClient: SupabaseClient | null = null

/**
 * Initialize Supabase client with service role key
 */
function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase credentials. Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseClient
}

/**
 * Type for a class that needs booking with all required data
 */
export type ClassNeedingBooking = {
  id: string
  user_id: string
  day_of_week: number
  class_time: string
  class_type: string
  branch: string
  booking_window_hours: number
  timezone: string
  active: boolean
  next_skip_date: string | null
  gym_url: string
  username: string
  encrypted_password: string
  default_branch: string | null
}

/**
 * Get all classes that need booking
 * Filters by:
 * - active = true
 * - schedule_paused = false (or null)
 * - next_skip_date is NULL or not equal to today
 * - booking window is open (current time >= class datetime - booking_window_hours)
 */
export async function getClassesNeedingBooking(): Promise<ClassNeedingBooking[]> {
  const supabase = getSupabaseClient()
  const now = new Date()

  // Get all active classes
  const { data: classes, error: classesError } = await supabase
    .from('recurring_classes')
    .select('*')
    .eq('active', true)

  if (classesError) {
    throw new Error(`Failed to fetch classes: ${classesError.message}`)
  }

  if (!classes || classes.length === 0) {
    return []
  }

  // Get unique user IDs
  const userIds = [...new Set(classes.map((c) => c.user_id))]

  // Get gym credentials for all users
  const { data: credentials, error: credsError } = await supabase
    .from('gym_credentials')
    .select('user_id, gym_url, username, encrypted_password, default_branch')
    .in('user_id', userIds)

  if (credsError) {
    throw new Error(`Failed to fetch credentials: ${credsError.message}`)
  }

  // Get user settings for all users
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, schedule_paused')
    .in('user_id', userIds)

  if (settingsError) {
    throw new Error(`Failed to fetch user settings: ${settingsError.message}`)
  }

  // Create lookup maps
  const credentialsMap = new Map(
    (credentials || []).map((c) => [c.user_id, c])
  )
  const settingsMap = new Map(
    (settings || []).map((s) => [s.user_id, s])
  )

  // Get today's date in UTC (YYYY-MM-DD format)
  const today = now.toISOString().split('T')[0]

  // Filter classes that need booking
  const classesNeedingBooking: ClassNeedingBooking[] = []

  for (const classItem of classes) {
    // Check if user has credentials
    const credentials = credentialsMap.get(classItem.user_id)
    if (!credentials) {
      console.warn(`No credentials found for user ${classItem.user_id}, class ${classItem.id}`)
      continue
    }

    // Check if user is paused
    const userSettings = settingsMap.get(classItem.user_id)
    if (userSettings?.schedule_paused === true) {
      continue
    }

    // Check if next_skip_date equals today (should skip)
    // We still include it to process the skip date clearing

    // Calculate if booking window is open
    const bookingWindowOpen = isBookingWindowOpen(
      classItem.day_of_week,
      classItem.class_time,
      classItem.booking_window_hours,
      classItem.timezone,
      now
    )

    if (!bookingWindowOpen) {
      continue
    }

    // Check if this class occurrence has already been successfully booked
    const upcomingClassDate = getNextClassDate(
      classItem.day_of_week,
      classItem.class_time,
      classItem.timezone,
      now
    )
    
    const alreadyBooked = await hasSuccessfulBookingForOccurrence(
      classItem.id,
      upcomingClassDate,
      classItem.day_of_week,
      classItem.class_time,
      classItem.booking_window_hours,
      classItem.timezone,
      now
    )
    
    if (alreadyBooked) {
      // Skip this class - already successfully booked for this occurrence
      console.log(`⏭️  Skipping class ${classItem.class_type} (${classItem.day_of_week}, ${classItem.class_time}) - already booked/waitlisted for upcoming occurrence`)
      continue
    }

    classesNeedingBooking.push({
      id: classItem.id,
      user_id: classItem.user_id,
      day_of_week: classItem.day_of_week,
      class_time: classItem.class_time,
      class_type: classItem.class_type,
      branch: classItem.branch,
      booking_window_hours: classItem.booking_window_hours,
      timezone: classItem.timezone,
      active: classItem.active,
      next_skip_date: classItem.next_skip_date,
      gym_url: credentials.gym_url,
      username: credentials.username,
      encrypted_password: credentials.encrypted_password,
      default_branch: credentials.default_branch,
    })
  }

  return classesNeedingBooking
}

/**
 * Check if booking window is open for a class
 * Booking window opens when: current time >= class datetime - booking_window_hours
 */
function isBookingWindowOpen(
  dayOfWeek: number,
  classTime: string,
  bookingWindowHours: number,
  timezone: string,
  now: Date
): boolean {
  try {
    // Get the next occurrence of this class
    const nextClassDate = getNextClassDate(dayOfWeek, classTime, timezone, now)

    // Calculate when booking window opens
    const bookingWindowOpens = new Date(nextClassDate)
    bookingWindowOpens.setHours(bookingWindowOpens.getHours() - bookingWindowHours)

    // Check if current time is past the booking window open time
    return now >= bookingWindowOpens
  } catch (error) {
    console.error('Error calculating booking window:', error)
    return false
  }
}

/**
 * Get the next occurrence date for a class
 * Returns the next date when this class occurs (considering day of week and time)
 */
function getNextClassDate(
  dayOfWeek: number,
  classTime: string,
  timezone: string,
  now: Date
): Date {
  // Parse class time (format: "HH:MM" or "HH:MM:SS")
  const [hours, minutes] = classTime.split(':').map(Number)

  // Create a date object for today in the specified timezone
  // Note: This is a simplified calculation. For production, use a proper timezone library like date-fns-tz
  const today = new Date(now)
  const currentDayOfWeek = today.getUTCDay() // 0 = Sunday, 6 = Saturday

  // Calculate days until next occurrence
  let daysUntilNext = dayOfWeek - currentDayOfWeek
  if (daysUntilNext < 0) {
    daysUntilNext += 7 // Next week
  }
  if (daysUntilNext === 0) {
    // Same day - check if time has passed
    const currentHour = today.getUTCHours()
    const currentMinute = today.getUTCMinutes()
    if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
      daysUntilNext = 7 // Next week
    }
  }

  // Create date for next occurrence
  const nextDate = new Date(today)
  nextDate.setUTCDate(today.getUTCDate() + daysUntilNext)
  nextDate.setUTCHours(hours, minutes, 0, 0)

  return nextDate
}

/**
 * Calculate which class occurrence a booking attempt was for
 * Returns the class date/time that the attempt was trying to book
 * 
 * Logic: If attempt happened at time T, find the class occurrence C where:
 *   T >= (C - booking_window_hours) AND T < C
 */
function calculateClassOccurrenceFromAttempt(
  attemptTimestamp: Date,
  dayOfWeek: number,
  classTime: string,
  bookingWindowHours: number,
  timezone: string
): Date | null {
  // Parse class time
  const [hours, minutes] = classTime.split(':').map(Number)
  
  // Start from the attempt timestamp and work backwards/forwards to find the matching class
  // The class must be within [attempt_time, attempt_time + booking_window_hours + 7 days]
  const attemptTime = new Date(attemptTimestamp)
  
  // Check the next 14 days (2 weeks) to find which class occurrence this attempt was for
  for (let daysOffset = 0; daysOffset < 14; daysOffset++) {
    const candidateDate = new Date(attemptTime)
    candidateDate.setUTCDate(attemptTime.getUTCDate() + daysOffset)
    candidateDate.setUTCHours(hours, minutes, 0, 0)
    
    const candidateDayOfWeek = candidateDate.getUTCDay()
    
    // Check if this date matches the day of week
    if (candidateDayOfWeek === dayOfWeek) {
      // Calculate booking window for this class occurrence
      const bookingWindowOpens = new Date(candidateDate)
      bookingWindowOpens.setUTCHours(bookingWindowOpens.getUTCHours() - bookingWindowHours)
      
      // Check if attempt timestamp falls within this booking window
      if (attemptTime >= bookingWindowOpens && attemptTime < candidateDate) {
        return candidateDate
      }
    }
  }
  
  return null
}

/**
 * Check if a class occurrence has already been successfully booked
 * Returns true if there's a successful booking (confirmed or waitlisted) for the upcoming class occurrence
 * and the class time hasn't passed yet
 */
async function hasSuccessfulBookingForOccurrence(
  recurringClassId: string,
  upcomingClassDate: Date,
  dayOfWeek: number,
  classTime: string,
  bookingWindowHours: number,
  timezone: string,
  now: Date
): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  // Get all successful booking attempts for this recurring class
  const { data: attempts, error } = await supabase
    .from('booking_attempts')
    .select('attempt_timestamp, status')
    .eq('recurring_class_id', recurringClassId)
    .in('status', ['confirmed', 'waitlisted'])
    .order('attempt_timestamp', { ascending: false })
  
  if (error) {
    console.error(`Error checking for existing bookings: ${error.message}`)
    // On error, allow booking (fail open)
    return false
  }
  
  if (!attempts || attempts.length === 0) {
    return false
  }
  
  // Check each successful booking attempt to see if it was for the upcoming class occurrence
  for (const attempt of attempts) {
    const attemptTimestamp = new Date(attempt.attempt_timestamp)
    
    // Calculate which class occurrence this attempt was for
    const attemptClassDate = calculateClassOccurrenceFromAttempt(
      attemptTimestamp,
      dayOfWeek,
      classTime,
      bookingWindowHours,
      timezone
    )
    
    if (!attemptClassDate) {
      // Couldn't determine which occurrence - skip this attempt
      continue
    }
    
    // Check if this attempt was for the same upcoming class occurrence
    // Compare dates (ignoring time of day for date comparison)
    const attemptClassDateStr = attemptClassDate.toISOString().split('T')[0]
    const upcomingClassDateStr = upcomingClassDate.toISOString().split('T')[0]
    
    if (attemptClassDateStr === upcomingClassDateStr) {
      // Found a successful booking for this occurrence
      // Check if the class time has passed
      if (now < upcomingClassDate) {
        // Class hasn't passed yet - skip booking
        return true
      } else {
        // Class has passed - allow booking for next week
        return false
      }
    }
  }
  
  // No matching successful booking found
  return false
}

/**
 * Get and decrypt gym credentials for a user
 */
export async function getGymCredentials(userId: string): Promise<{
  gym_url: string
  username: string
  password: string
  default_branch: string | null
}> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('gym_credentials')
    .select('gym_url, username, encrypted_password, default_branch')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to get gym credentials: ${error?.message || 'No data'}`)
  }

  const password = decryptPassword(data.encrypted_password)

  return {
    gym_url: data.gym_url,
    username: data.username,
    password,
    default_branch: data.default_branch,
  }
}

/**
 * Create a booking attempt record
 */
export async function createBookingAttempt(
  recurringClassId: string,
  status: 'pending' | 'confirmed' | 'waitlisted' | 'failed' | 'skipped',
  branchUsed: string | null = null,
  errorMessage: string | null = null
): Promise<string> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('booking_attempts')
    .insert({
      recurring_class_id: recurringClassId,
      attempt_timestamp: new Date().toISOString(),
      status,
      branch_used: branchUsed,
      error_message: errorMessage,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create booking attempt: ${error?.message || 'No data'}`)
  }

  return data.id
}

/**
 * Update a booking attempt record
 */
export async function updateBookingAttempt(
  attemptId: string,
  updates: {
    status?: 'pending' | 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
    branch_used?: string | null
    error_message?: string | null
  }
): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('booking_attempts')
    .update(updates)
    .eq('id', attemptId)

  if (error) {
    throw new Error(`Failed to update booking attempt: ${error.message}`)
  }
}

/**
 * Clear the next_skip_date for a recurring class
 */
export async function clearSkipDate(recurringClassId: string): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('recurring_classes')
    .update({ next_skip_date: null })
    .eq('id', recurringClassId)

  if (error) {
    throw new Error(`Failed to clear skip date: ${error.message}`)
  }
}

/**
 * Get a single class by ID with credentials
 * Used by Inngest to fetch class data when booking event fires
 */
export async function getClassById(classId: string): Promise<ClassNeedingBooking | null> {
  const supabase = getSupabaseClient()

  // Get class data
  const { data: classData, error: classError } = await supabase
    .from('recurring_classes')
    .select('*')
    .eq('id', classId)
    .eq('active', true)
    .single()

  if (classError || !classData) {
    return null
  }

  // Get gym credentials
  const { data: credentials, error: credsError } = await supabase
    .from('gym_credentials')
    .select('user_id, gym_url, username, encrypted_password, default_branch')
    .eq('user_id', classData.user_id)
    .single()

  if (credsError || !credentials) {
    return null
  }

  // Get user settings to check if paused
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('schedule_paused')
    .eq('user_id', classData.user_id)
    .single()

  if (settingsError) {
    // Settings might not exist - treat as not paused
    console.warn(`No settings found for user ${classData.user_id}`)
  }

  // If user is paused, return null (don't book)
  if (settings?.schedule_paused === true) {
    return null
  }

  return {
    id: classData.id,
    user_id: classData.user_id,
    day_of_week: classData.day_of_week,
    class_time: classData.class_time,
    class_type: classData.class_type,
    branch: classData.branch,
    booking_window_hours: classData.booking_window_hours,
    timezone: classData.timezone,
    active: classData.active,
    next_skip_date: classData.next_skip_date,
    gym_url: credentials.gym_url,
    username: credentials.username,
    encrypted_password: credentials.encrypted_password,
    default_branch: credentials.default_branch,
  }
}

/**
 * Get all active classes (for daily scheduler)
 * Returns all active classes where user is not paused
 */
export async function getAllActiveClasses(): Promise<ClassNeedingBooking[]> {
  const supabase = getSupabaseClient()

  // Get all active classes
  const { data: classes, error: classesError } = await supabase
    .from('recurring_classes')
    .select('*')
    .eq('active', true)

  if (classesError || !classes || classes.length === 0) {
    return []
  }

  // Get unique user IDs
  const userIds = [...new Set(classes.map((c) => c.user_id))]

  // Get gym credentials for all users
  const { data: credentials, error: credsError } = await supabase
    .from('gym_credentials')
    .select('user_id, gym_url, username, encrypted_password, default_branch')
    .in('user_id', userIds)

  if (credsError) {
    throw new Error(`Failed to fetch credentials: ${credsError.message}`)
  }

  // Get user settings for all users
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, schedule_paused')
    .in('user_id', userIds)

  if (settingsError) {
    console.warn(`Failed to fetch user settings: ${settingsError.message}`)
  }

  // Create lookup maps
  const credentialsMap = new Map(
    (credentials || []).map((c) => [c.user_id, c])
  )
  const settingsMap = new Map(
    (settings || []).map((s) => [s.user_id, s])
  )

  // Build result array
  const result: ClassNeedingBooking[] = []

  for (const classItem of classes) {
    // Check if user has credentials
    const creds = credentialsMap.get(classItem.user_id)
    if (!creds) {
      console.warn(`No credentials found for user ${classItem.user_id}, class ${classItem.id}`)
      continue
    }

    // Check if user is paused
    const userSettings = settingsMap.get(classItem.user_id)
    if (userSettings?.schedule_paused === true) {
      continue
    }

    result.push({
      id: classItem.id,
      user_id: classItem.user_id,
      day_of_week: classItem.day_of_week,
      class_time: classItem.class_time,
      class_type: classItem.class_type,
      branch: classItem.branch,
      booking_window_hours: classItem.booking_window_hours,
      timezone: classItem.timezone,
      active: classItem.active,
      next_skip_date: classItem.next_skip_date,
      gym_url: creds.gym_url,
      username: creds.username,
      encrypted_password: creds.encrypted_password,
      default_branch: creds.default_branch,
    })
  }

  return result
}

