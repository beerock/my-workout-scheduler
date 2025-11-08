/**
 * Utility functions for date and time calculations
 */

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
  const [hours, minutes] = time.split(':').map(Number)
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
 * Calculate the next occurrence of a class given day of week
 * Returns the next future date (not today, even if today matches)
 * 
 * @param dayOfWeek 0-6 (Sunday-Saturday)
 * @param timezone Timezone string (e.g., 'America/New_York')
 * @returns Date string in YYYY-MM-DD format (class date, not booking window date)
 */
export function calculateNextOccurrence(dayOfWeek: number, timezone: string = 'America/New_York'): string {
  const now = new Date()
  
  // Get current day of week (0 = Sunday, 6 = Saturday)
  const currentDay = now.getDay()
  
  // Calculate days until next occurrence
  let daysUntilNext = (dayOfWeek - currentDay + 7) % 7
  
  // If today is the same day, get next week's occurrence (always skip to next week)
  const daysToAdd = daysUntilNext === 0 ? 7 : daysUntilNext
  
  // Create date for the class (not the booking window)
  const nextDate = new Date(now)
  nextDate.setDate(now.getDate() + daysToAdd)
  
  // Format as YYYY-MM-DD using local date components (not UTC)
  // This ensures we get the correct date regardless of timezone
  const year = nextDate.getFullYear()
  const month = String(nextDate.getMonth() + 1).padStart(2, '0')
  const day = String(nextDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
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
 * Calculate when the booking window opens for a class
 * Returns the datetime when registration opens (class datetime minus booking_window_hours)
 * 
 * Note: classDate should be the actual class date (not booking window date)
 */
export function calculateBookingWindowOpen(
  classDate: string, // YYYY-MM-DD (class date)
  classTime: string, // HH:MM:SS or HH:MM
  bookingWindowHours: number,
  timezone: string = 'America/New_York'
): Date {
  const [hours, minutes, seconds] = classTime.split(':').map(Number)
  
  // Parse the class date string (YYYY-MM-DD) as local date
  // This prevents timezone issues when creating the Date object
  const [year, month, day] = classDate.split('-').map(Number)
  
  // Create date object for the class in local time
  const classDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0)
  
  // Subtract booking window hours
  const bookingWindowOpen = new Date(classDateTime)
  bookingWindowOpen.setHours(bookingWindowOpen.getHours() - bookingWindowHours)
  
  return bookingWindowOpen
}

/**
 * Check if booking window has opened for a class
 */
export function hasBookingWindowOpened(
  classDate: string,
  classTime: string,
  bookingWindowHours: number,
  timezone: string = 'America/New_York'
): boolean {
  const bookingWindowOpen = calculateBookingWindowOpen(classDate, classTime, bookingWindowHours, timezone)
  const now = new Date()
  
  return now >= bookingWindowOpen
}

/**
 * Check if class has already passed
 */
export function hasClassPassed(
  classDate: string,
  classTime: string,
  timezone: string = 'America/New_York'
): boolean {
  const [hours, minutes, seconds] = classTime.split(':').map(Number)
  
  // Parse the class date string (YYYY-MM-DD) as local date
  const [year, month, day] = classDate.split('-').map(Number)
  
  // Create date object for the class in local time
  const classDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0)
  
  const now = new Date()
  
  return now > classDateTime
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

