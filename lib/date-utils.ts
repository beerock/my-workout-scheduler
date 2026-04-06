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

  // Build the target date by offsetting from today in gym timezone
  const targetDate = new Date(nowInGymTz)
  targetDate.setDate(nowInGymTz.getDate() + daysUntil)
  // Extract timezone-correct date components, then build an ISO-like string
  // (setHours() modifies UTC hours, not timezone-local hours, so we avoid it)
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}T${String(classHour).padStart(2, '0')}:${String(classMinute).padStart(2, '0')}:00`

  // Convert to UTC for storage (this becomes TIMESTAMP WITH TIME ZONE)
  return fromZonedTime(dateStr, timezone)
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

