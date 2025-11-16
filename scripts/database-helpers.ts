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
 * Uses gym's timezone for accurate calculations
 */
function isBookingWindowOpen(
  dayOfWeek: number,
  classTime: string,
  bookingWindowHours: number,
  timezone: string,
  now: Date
): boolean {
  try {
    // Get the next occurrence of this class (timezone-aware)
    const nextClassDate = getNextClassDate(dayOfWeek, classTime, timezone, now)

    // Calculate when booking window opens (subtract hours from class time)
    // Since nextClassDate is already a proper Date object, we can subtract hours directly
    const bookingWindowOpens = new Date(nextClassDate.getTime() - (bookingWindowHours * 60 * 60 * 1000))

    // Format dates in gym's timezone for logging
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    
    const windowOpenStr = tzFormatter.format(bookingWindowOpens)
    const classDateStr = tzFormatter.format(nextClassDate)
    const nowStr = tzFormatter.format(now)
    
    const isOpen = now >= bookingWindowOpens
    if (!isOpen) {
      console.log(`⏰ Booking window not yet open for class (${timezone}): window opens at ${windowOpenStr}, class at ${classDateStr}, now: ${nowStr}`)
    }

    // Check if current time is past the booking window open time
    // Both now and bookingWindowOpens are Date objects (UTC internally), so comparison is correct
    return isOpen
  } catch (error) {
    console.error('Error calculating booking window:', error)
    return false
  }
}

/**
 * Get the next occurrence date for a class
 * Returns the next date when this class occurs (considering day of week and time)
 * Uses gym's timezone for accurate date calculations
 */
function getNextClassDate(
  dayOfWeek: number,
  classTime: string,
  timezone: string,
  now: Date
): Date {
  // Parse class time (format: "HH:MM" or "HH:MM:SS")
  const [hours, minutes] = classTime.split(':').map(Number)

  // Calculate "today" in the gym's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  
  const parts = formatter.formatToParts(now)
  const gymDate = {
    year: parseInt(parts.find(p => p.type === 'year')!.value),
    month: parseInt(parts.find(p => p.type === 'month')!.value),
    day: parseInt(parts.find(p => p.type === 'day')!.value),
    hour: parseInt(parts.find(p => p.type === 'hour')!.value),
    minute: parseInt(parts.find(p => p.type === 'minute')!.value),
  }
  
  // Create a date object representing "today" in gym's timezone
  // Note: This creates a Date object in local time, but we'll convert it properly
  const todayInGymTz = new Date(gymDate.year, gymDate.month - 1, gymDate.day, gymDate.hour, gymDate.minute)
  const currentDayOfWeek = todayInGymTz.getDay() // 0 = Sunday, 6 = Saturday
  
  let daysUntilNext = dayOfWeek - currentDayOfWeek
  
  // Handle same-day classes: check if class time has passed
  if (daysUntilNext === 0) {
    // Same day - check if class time has passed
    const [classHour, classMinute] = classTime.split(':').map(Number)
    const currentTimeMinutes = gymDate.hour * 60 + gymDate.minute
    const classTimeMinutes = classHour * 60 + classMinute
    
    if (currentTimeMinutes >= classTimeMinutes) {
      // Class time has passed today, look for next week
      daysUntilNext = 7
    } else {
      // Class time hasn't passed, use today
      daysUntilNext = 0
    }
  } else if (daysUntilNext < 0) {
    // Past day this week, look for next week
    daysUntilNext += 7
  }

  // Calculate target date components in gym's timezone
  const targetDate = new Date(gymDate.year, gymDate.month - 1, gymDate.day, hours, minutes, 0, 0)
  targetDate.setDate(targetDate.getDate() + daysUntilNext)
  
  const targetYear = targetDate.getFullYear()
  const targetMonth = targetDate.getMonth() + 1
  const targetDay = targetDate.getDate()
  
  // Create a Date object that represents this moment in the gym's timezone
  // Method: Create a date string and use timezone offset calculation
  // We'll find the UTC time that, when formatted in the gym's timezone, gives us our target time
  
  // Step 1: Create a date string for our target (as if it were UTC)
  const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
  let candidateDate = new Date(dateStr + 'Z') // Parse as UTC
  
  // Step 2: Calculate the timezone offset for this date in the gym's timezone
  // The offset is the difference between UTC and the gym's timezone
  const utcTime = candidateDate.getTime()
  
  // Format the candidate date in the gym's timezone to see what time it represents there
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  
  // Get what time this UTC date represents in the gym's timezone
  const tzParts = tzFormatter.formatToParts(candidateDate)
  const tzYear = parseInt(tzParts.find(p => p.type === 'year')!.value)
  const tzMonth = parseInt(tzParts.find(p => p.type === 'month')!.value)
  const tzDay = parseInt(tzParts.find(p => p.type === 'day')!.value)
  const tzHour = parseInt(tzParts.find(p => p.type === 'hour')!.value)
  const tzMinute = parseInt(tzParts.find(p => p.type === 'minute')!.value)
  
  // Calculate the difference between what we want and what we have
  // Create Date objects for comparison (these are in local time, but we just need the difference)
  const targetLocal = new Date(targetYear, targetMonth - 1, targetDay, hours, minutes, 0, 0)
  const tzLocal = new Date(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0, 0)
  const diffMs = targetLocal.getTime() - tzLocal.getTime()
  
  // Adjust the candidate date by the difference
  candidateDate = new Date(utcTime + diffMs)
  
  return candidateDate
}

/**
 * Calculate which class occurrence a booking attempt was for
 * Returns the class date/time that the attempt was trying to book
 * Uses gym's timezone for accurate calculations
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
  
  // Get the attempt time in the gym's timezone
  const attemptTime = new Date(attemptTimestamp)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  
  const attemptParts = formatter.formatToParts(attemptTime)
  const attemptGymDate = {
    year: parseInt(attemptParts.find(p => p.type === 'year')!.value),
    month: parseInt(attemptParts.find(p => p.type === 'month')!.value),
    day: parseInt(attemptParts.find(p => p.type === 'day')!.value),
    hour: parseInt(attemptParts.find(p => p.type === 'hour')!.value),
    minute: parseInt(attemptParts.find(p => p.type === 'minute')!.value),
  }
  
  // Create a date object representing the attempt time in gym's timezone
  const attemptInGymTz = new Date(attemptGymDate.year, attemptGymDate.month - 1, attemptGymDate.day, attemptGymDate.hour, attemptGymDate.minute)
  const attemptDayOfWeek = attemptInGymTz.getDay()
  
  // Check the next 14 days (2 weeks) to find which class occurrence this attempt was for
  // We'll check from the attempt date backwards and forwards
  for (let daysOffset = -7; daysOffset < 14; daysOffset++) {
    const candidateDate = new Date(attemptGymDate.year, attemptGymDate.month - 1, attemptGymDate.day, hours, minutes, 0, 0)
    candidateDate.setDate(candidateDate.getDate() + daysOffset)
    
    const candidateDayOfWeek = candidateDate.getDay()
    
    // Check if this date matches the day of week
    if (candidateDayOfWeek === dayOfWeek) {
      // Calculate the candidate date as a proper Date object in UTC
      const candidateYear = candidateDate.getFullYear()
      const candidateMonth = candidateDate.getMonth() + 1
      const candidateDay = candidateDate.getDate()
      
      // Create a Date object representing this moment in the gym's timezone
      const dateStr = `${candidateYear}-${String(candidateMonth).padStart(2, '0')}-${String(candidateDay).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
      let candidateDateUtc = new Date(dateStr + 'Z')
      
      // Adjust for timezone offset (same method as getNextClassDate)
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      
      const tzParts = tzFormatter.formatToParts(candidateDateUtc)
      const tzYear = parseInt(tzParts.find(p => p.type === 'year')!.value)
      const tzMonth = parseInt(tzParts.find(p => p.type === 'month')!.value)
      const tzDay = parseInt(tzParts.find(p => p.type === 'day')!.value)
      const tzHour = parseInt(tzParts.find(p => p.type === 'hour')!.value)
      const tzMinute = parseInt(tzParts.find(p => p.type === 'minute')!.value)
      
      const targetLocal = new Date(candidateYear, candidateMonth - 1, candidateDay, hours, minutes, 0, 0)
      const tzLocal = new Date(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0, 0)
      const diffMs = targetLocal.getTime() - tzLocal.getTime()
      
      candidateDateUtc = new Date(candidateDateUtc.getTime() + diffMs)
      
      // Calculate booking window for this class occurrence
      const bookingWindowOpens = new Date(candidateDateUtc.getTime() - (bookingWindowHours * 60 * 60 * 1000))
      
      // Check if attempt timestamp falls within this booking window
      if (attemptTime >= bookingWindowOpens && attemptTime < candidateDateUtc) {
        return candidateDateUtc
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
      // Check if the class time has passed (both dates are timezone-aware Date objects)
      // upcomingClassDate is calculated using getNextClassDate which uses gym's timezone
      // now is the current moment in UTC, but comparison is correct since both are Date objects
      if (now < upcomingClassDate) {
        // Class hasn't passed yet - skip booking
        console.log(`⏭️  Skipping class - already booked/waitlisted for upcoming occurrence (class time: ${upcomingClassDate.toISOString()}, now: ${now.toISOString()})`)
        return true
      } else {
        // Class has passed - allow booking for next week (reset logic)
        console.log(`✅ Class time has passed - allowing booking for next week (class time: ${upcomingClassDate.toISOString()}, now: ${now.toISOString()})`)
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

