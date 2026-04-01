/**
 * Scheduling helper functions for calculating booking window times
 * Handles timezone conversions to ensure accurate booking triggers
 */
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { inngest } from './client';

/**
 * Calculate when the booking window opens for a class
 * Accounts for the class's specific timezone
 *
 * @example
 * Class: Saturday 9:30 AM in America/New_York
 * Booking window: 26 hours before
 * Result: Friday 7:30 AM in America/New_York (converted to UTC for Inngest)
 */
export function calculateBookingWindowOpen(
  dayOfWeek: number,        // 0 = Sunday, 6 = Saturday
  classTime: string,        // "HH:MM" format (e.g., "09:30")
  bookingWindowHours: number, // Hours before class (e.g., 26)
  timezone: string          // IANA timezone (e.g., "America/New_York")
): Date {
  // Get current time in the class's timezone
  const nowInClassTz = toZonedTime(new Date(), timezone);
  const todayInClassTz = nowInClassTz.getDay(); // 0-6

  // Calculate days until next occurrence
  let daysUntil = dayOfWeek - todayInClassTz;

  // Handle same-day classes
  if (daysUntil === 0) {
    const [classHour, classMinute] = classTime.split(':').map(Number);
    const currentHour = nowInClassTz.getHours();
    const currentMinute = nowInClassTz.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const classTimeMinutes = classHour * 60 + classMinute;

    if (currentTimeMinutes >= classTimeMinutes) {
      // Class time has passed today, schedule for next week
      daysUntil = 7;
    }
  } else if (daysUntil < 0) {
    // Past day this week, schedule for next week
    daysUntil += 7;
  }

  // Create class date/time in the class's timezone
  const classDateInTz = new Date(nowInClassTz);
  classDateInTz.setDate(nowInClassTz.getDate() + daysUntil);
  const [hours, minutes] = classTime.split(':').map(Number);
  classDateInTz.setHours(hours, minutes, 0, 0);

  // Subtract booking window hours
  const bookingWindowOpensInTz = new Date(
    classDateInTz.getTime() - bookingWindowHours * 60 * 60 * 1000
  );

  // Convert to UTC for Inngest (Inngest expects UTC timestamps)
  return fromZonedTime(bookingWindowOpensInTz, timezone);
}

/**
 * Calculate when the class actually starts (for determining retry cutoff)
 */
export function calculateClassStartTime(
  dayOfWeek: number,
  classTime: string,
  timezone: string
): Date {
  // Get current time in the class's timezone
  const nowInClassTz = toZonedTime(new Date(), timezone);
  const todayInClassTz = nowInClassTz.getDay();

  // Calculate days until class
  let daysUntil = dayOfWeek - todayInClassTz;

  if (daysUntil === 0) {
    const [classHour, classMinute] = classTime.split(':').map(Number);
    const currentHour = nowInClassTz.getHours();
    const currentMinute = nowInClassTz.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const classTimeMinutes = classHour * 60 + classMinute;

    if (currentTimeMinutes >= classTimeMinutes) {
      daysUntil = 7;
    }
  } else if (daysUntil < 0) {
    daysUntil += 7;
  }

  // Create class start time in timezone
  const classDate = new Date(nowInClassTz);
  classDate.setDate(nowInClassTz.getDate() + daysUntil);
  const [hours, minutes] = classTime.split(':').map(Number);
  classDate.setHours(hours, minutes, 0, 0);

  // Convert to UTC
  return fromZonedTime(classDate, timezone);
}

/**
 * Calculate the next class date in YYYY-MM-DD format
 * Used for generating unique idempotency keys
 */
export function calculateNextClassDate(
  dayOfWeek: number,
  classTime: string,
  timezone: string
): string {
  // Get current time in the class's timezone
  const nowInClassTz = toZonedTime(new Date(), timezone);
  const todayInClassTz = nowInClassTz.getDay();

  // Calculate days until class
  let daysUntil = dayOfWeek - todayInClassTz;

  if (daysUntil === 0) {
    const [classHour, classMinute] = classTime.split(':').map(Number);
    const currentHour = nowInClassTz.getHours();
    const currentMinute = nowInClassTz.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const classTimeMinutes = classHour * 60 + classMinute;

    if (currentTimeMinutes >= classTimeMinutes) {
      daysUntil = 7;
    }
  } else if (daysUntil < 0) {
    daysUntil += 7;
  }

  // Create class date in timezone
  const classDate = new Date(nowInClassTz);
  classDate.setDate(nowInClassTz.getDate() + daysUntil);

  // Format as YYYY-MM-DD
  const year = classDate.getFullYear();
  const month = String(classDate.getMonth() + 1).padStart(2, '0');
  const day = String(classDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Schedule a booking attempt for a recurring class
 * Sends event to Inngest to trigger at the exact booking window time
 */
export async function scheduleBooking(classData: {
  id: string;
  class_type: string;
  day_of_week: number;
  class_time: string;
  booking_window_hours: number;
  timezone: string;
}): Promise<Date | null> {
  const bookingTime = calculateBookingWindowOpen(
    classData.day_of_week,
    classData.class_time,
    classData.booking_window_hours,
    classData.timezone
  );

  // Don't schedule if in the past
  if (bookingTime.getTime() < Date.now()) {
    console.log(
      `[Scheduler] Booking time ${bookingTime.toISOString()} is in the past, skipping`
    );
    return null;
  }

  // Calculate class date for cancelOn matching and idempotency
  const classDate = calculateNextClassDate(
    classData.day_of_week,
    classData.class_time,
    classData.timezone
  );

  console.log(
    `[Scheduler] Scheduling booking for class "${classData.class_type}" (${classData.id}) on ${classDate} at ${bookingTime.toISOString()}`
  );

  // Cancel any existing scheduled run for this class+date
  // This ensures edits and daily scheduler don't create duplicates
  await inngest.send({
    name: 'booking/cancel',
    data: {
      classId: classData.id,
      classDate,
    },
  });

  // Early-start: fire event 60s before booking window opens so GH Actions + Puppeteer
  // can complete all prep (login, navigation) and be ready to refresh at the exact moment
  const EARLY_START_MS = 60 * 1000;

  // Schedule new booking attempt
  await inngest.send({
    name: 'booking/attempt',
    data: {
      classId: classData.id,
      className: classData.class_type,
      classDate, // Required for cancelOn matching
      attemptNumber: 1,
      expectedBookingTime: bookingTime.getTime(), // UTC ms - actual booking window time
    },
    ts: bookingTime.getTime() - EARLY_START_MS, // fire 60s early
  });

  return bookingTime;
}
