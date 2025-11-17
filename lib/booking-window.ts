/**
 * Utility functions for calculating booking window times
 */
import { fromZonedTime } from 'date-fns-tz';
import { addHours, isBefore } from 'date-fns';

/**
 * Check if a class's booking window is currently open
 * @param dayOfWeek - Day of week (0-6, 0 = Sunday)
 * @param classTime - Class time in HH:MM:SS format
 * @param bookingWindowHours - Hours before class that booking opens
 * @param timezone - Timezone of the class
 * @returns true if booking window is open, false otherwise
 */
export function isBookingWindowOpen(
  dayOfWeek: number,
  classTime: string,
  bookingWindowHours: number,
  timezone: string
): boolean {
  const now = new Date();

  // Calculate next occurrence of this class
  const nextClassTime = getNextClassOccurrence(dayOfWeek, classTime, timezone);

  // Calculate when booking window opens
  const bookingWindowOpens = addHours(nextClassTime, -bookingWindowHours);

  // Booking window is open if current time is after booking window opens
  // and before class starts
  return isBefore(bookingWindowOpens, now) && isBefore(now, nextClassTime);
}

/**
 * Get the next occurrence of a class
 * @param dayOfWeek - Day of week (0-6, 0 = Sunday)
 * @param classTime - Class time in HH:MM:SS format
 * @param timezone - Timezone of the class
 * @returns Date object of next class occurrence in UTC
 */
function getNextClassOccurrence(
  dayOfWeek: number,
  classTime: string,
  timezone: string
): Date {
  const now = new Date();

  // Parse class time
  const [hours, minutes] = classTime.split(':').map(Number);

  // Get current day of week in class timezone
  const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const currentDayOfWeek = nowInTz.getDay();

  // Calculate days until next occurrence
  let daysUntilClass = dayOfWeek - currentDayOfWeek;
  if (daysUntilClass < 0) {
    daysUntilClass += 7; // Next week
  } else if (daysUntilClass === 0) {
    // Same day - check if class time has passed
    const classTimeToday = new Date(nowInTz);
    classTimeToday.setHours(hours, minutes, 0, 0);

    if (nowInTz > classTimeToday) {
      // Class already happened today, use next week
      daysUntilClass = 7;
    }
  }

  // Create date in class timezone
  const nextClass = new Date(nowInTz);
  nextClass.setDate(nextClass.getDate() + daysUntilClass);
  nextClass.setHours(hours, minutes, 0, 0);

  // Convert to UTC
  return fromZonedTime(nextClass, timezone);
}
