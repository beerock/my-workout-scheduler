/**
 * Utility functions for date and time calculations
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz'

/**
 * Get the day name from day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Get short day name
 */
export function getShortDayName(dayOfWeek: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Format time from HH:MM:SS or HH:MM to 12-hour format
 */
export function formatTime12Hour(time: string): string {
  // Handle empty or invalid time strings
  if (!time || typeof time !== 'string' || !time.includes(':')) {
    return '--:-- --'
  }

  const parts = time.split(':')
  const hours = Number(parts[0])
  const minutes = Number(parts[1])

  // Validate parsed numbers
  if (isNaN(hours) || isNaN(minutes)) {
    return '--:-- --'
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Format date in a user-friendly format (e.g., "Monday, Nov 11")
 * Uses local time components to avoid timezone issues
 */
export function formatDate(date: Date | string): string {
  let d: Date
  if (typeof date === 'string') {
    // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number)
    d = new Date(year, month - 1, day, 0, 0, 0, 0)
  } else {
    d = date
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date in short format (e.g., "Nov 11")
 * Uses local time components to avoid timezone issues
 */
export function formatDateShort(date: Date | string): string {
  let d: Date
  if (typeof date === 'string') {
    // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number)
    d = new Date(year, month - 1, day, 0, 0, 0, 0)
  } else {
    d = date
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Calculate the next occurrence of a class (date + time) in the gym's timezone
 * Returns a full Date object representing when the class happens
 *
 * This is the SINGLE SOURCE OF TRUTH for calculating next class occurrence
 * Used by: UI (skip button), Inngest (skip logic), scheduler (idempotency)
 *
 * @param dayOfWeek 0-6 (Sunday-Saturday) - which day class occurs
 * @param classTime HH:MM format (e.g., "15:00") - when class starts
 * @param timezone IANA timezone (e.g., 'America/New_York') - gym's timezone
 * @returns Date object (TIMESTAMP WITH TIME ZONE equivalent) representing next class occurrence
 *
 * @example
 * calculateNextOccurrence(5, "15:00", "America/New_York")
 * // Returns: Date object for next Friday 3:00 PM Eastern Time
 */
export function calculateNextOccurrence(
  dayOfWeek: number,
  classTime: string,
  timezone: string = 'America/New_York'
): Date {
  // Get current time in the gym's timezone (not user's local timezone!)
  const nowInGymTz = toZonedTime(new Date(), timezone)
  const todayInGymTz = nowInGymTz.getDay() // 0-6

  // Parse class time
  const [classHour, classMinute] = classTime.split(':').map(Number)

  // Calculate days until next occurrence
  let daysUntil = dayOfWeek - todayInGymTz

  // Handle same-day classes
  if (daysUntil === 0) {
    // Same day - check if class time has passed
    const currentHour = nowInGymTz.getHours()
    const currentMinute = nowInGymTz.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMinute
    const classTimeMinutes = classHour * 60 + classMinute

    if (currentTimeMinutes >= classTimeMinutes) {
      // Class time has passed today, get next week
      daysUntil = 7
    } else {
      // Class time hasn't passed, use today
      daysUntil = 0
    }
  } else if (daysUntil < 0) {
    // Past day this week, get next week
    daysUntil += 7
  }

  // Create class datetime in gym's timezone
  const classDateInGymTz = new Date(nowInGymTz)
  classDateInGymTz.setDate(nowInGymTz.getDate() + daysUntil)
  classDateInGymTz.setHours(classHour, classMinute, 0, 0)

  // Convert to UTC for storage (this becomes TIMESTAMP WITH TIME ZONE)
  return fromZonedTime(classDateInGymTz, timezone)
}

/**
 * Format a datetime in the gym's timezone for display
 * Used by UI to show skip dates in the correct timezone
 *
 * @param datetime Date object (could be TIMESTAMP WITH TIME ZONE from database)
 * @param timezone Gym's timezone
 * @param format 'short' (Nov 21) or 'long' (Friday, Nov 21)
 * @returns Formatted date string
 */
export function formatDateInGymTimezone(
  datetime: Date,
  timezone: string,
  format: 'short' | 'long' = 'short'
): string {
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { month: 'short', day: 'numeric', timeZone: timezone }
      : { weekday: 'long', month: 'short', day: 'numeric', timeZone: timezone }

  return new Intl.DateTimeFormat('en-US', options).format(datetime)
}

/**
 * Check if a date string is in the past
 * Uses local time components to avoid timezone issues
 */
export function isDateInPast(dateStr: string | null): boolean {
  if (!dateStr) return true
  
  // Parse date string (YYYY-MM-DD) as local date
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return date < today
}

/**
 * Check if a date string is in the future
 * Uses local time components to avoid timezone issues
 */
export function isDateInFuture(dateStr: string | null): boolean {
  if (!dateStr) return false
  
  // Parse date string (YYYY-MM-DD) as local date
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return date > today
}

/**
 * Check if a date string is today
 * Uses local time components to avoid timezone issues
 */
export function isDateToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  
  // Parse date string (YYYY-MM-DD) as local date
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  
  const today = new Date()
  
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}


/**
 * Common timezones for dropdown
 * Using IANA timezone identifiers that automatically handle DST
 */
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET) - Auto DST' },
  { value: 'America/Chicago', label: 'Central Time (CT) - Auto DST' },
  { value: 'America/Denver', label: 'Mountain Time (MT) - Auto DST' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Auto DST' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST) - No DST' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT) - Auto DST' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST) - No DST' },
]

