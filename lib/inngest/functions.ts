/**
 * Inngest functions for automated class booking
 * Handles booking attempts, retries for clock drift, and retries for full classes
 */
import { inngest } from './client';
import { bookClass, type BookingParams } from '@/scripts/booking-automation';
import {
  createBookingAttempt,
  updateBookingAttempt,
  getClassById,
  getAllActiveClasses,
  clearSkipDate,
  type ClassNeedingBooking,
} from '@/scripts/database-helpers';
import { decryptPassword } from '@/lib/encryption';
import { calculateClassStartTime, scheduleBooking } from './scheduler';

/**
 * Main booking function - triggered at exact booking window time
 * Handles:
 * 1. Clock drift retries (12 attempts × 15 seconds = 3 minutes)
 * 2. Class full retries (every 15 minutes until class starts)
 */
export const bookClassFunction = inngest.createFunction(
  {
    id: 'book-class',
    // Inngest will retry the entire function if it crashes (network errors, etc.)
    retries: 3,
  },
  { event: 'booking/attempt' },
  async ({ event, step }) => {
    const { classId, attemptNumber = 1 } = event.data;

    console.log(
      `[Inngest] Booking attempt #${attemptNumber} for class ${classId}`
    );

    // Step 1: Fetch class data from database
    const classData = await step.run('fetch-class-data', async () => {
      return await getClassById(classId);
    });

    if (!classData) {
      console.log(`[Inngest] Class ${classId} not found (may have been deleted)`);
      return { error: 'Class not found', classId };
    }

    console.log(
      `[Inngest] Found class: ${classData.class_type} on ${getDayName(classData.day_of_week)} at ${classData.class_time}`
    );

    // Check if we should skip today
    const today = new Date().toISOString().split('T')[0];
    if (classData.next_skip_date === today) {
      console.log(`[Inngest] Skipping class (next_skip_date = today)`);

      const attemptId = await step.run('create-skip-attempt', async () => {
        return await createBookingAttempt(
          classData.id,
          'skipped',
          null,
          `Skipped: next_skip_date equals today (${today})`
        );
      });

      await step.run('clear-skip-date', async () => {
        await clearSkipDate(classData.id);
      });

      return { status: 'skipped', attemptId, reason: 'next_skip_date' };
    }

    // Step 2: Create booking attempt record
    const attemptId = await step.run('create-attempt-record', async () => {
      return await createBookingAttempt(
        classData.id,
        'pending',
        classData.branch
      );
    });

    console.log(`[Inngest] Created booking attempt record: ${attemptId}`);

    // Step 3: Decrypt password
    const password = await step.run('decrypt-password', async () => {
      return decryptPassword(classData.encrypted_password);
    });

    // Step 4: Prepare booking parameters
    const bookingParams: BookingParams = {
      gymUrl: classData.gym_url,
      username: classData.username,
      password: password,
      branch: classData.branch,
      dayOfWeek: classData.day_of_week,
      classTime: classData.class_time,
      classType: classData.class_type,
      timezone: classData.timezone,
      nextSkipDate: classData.next_skip_date,
    };

    // Step 5: Execute booking with Puppeteer
    console.log(`[Inngest] Starting Puppeteer automation...`);
    const result = await step.run('execute-booking', async () => {
      try {
        return await bookClass(bookingParams);
      } catch (error) {
        console.error(`[Inngest] Puppeteer error:`, error);
        return {
          status: 'failed' as const,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          branchUsed: null,
          screenshotPath: null,
        };
      }
    });

    console.log(
      `[Inngest] Booking result: ${result.status} - ${result.errorMessage || 'success'}`
    );

    // Step 6: Update booking attempt with result
    await step.run('update-attempt-record', async () => {
      await updateBookingAttempt(attemptId, {
        status: result.status,
        branch_used: result.branchUsed,
        error_message: result.errorMessage,
      });
    });

    // Step 7: Handle different result scenarios
    const nextAction = await step.run('handle-result', async () => {
      // Scenario 1: Success (confirmed or waitlisted)
      if (result.status === 'confirmed' || result.status === 'waitlisted') {
        console.log(
          `[Inngest] ✅ Booking ${result.status} - no further action needed`
        );
        return { action: 'complete', status: result.status };
      }

      // Scenario 2: Already booked (skipped)
      if (
        result.status === 'skipped' ||
        result.errorMessage?.toLowerCase().includes('already')
      ) {
        console.log(`[Inngest] ⏭️  Class already booked - stopping`);
        return { action: 'complete', status: 'skipped' };
      }

      // Scenario 3: Booking window not open yet (clock drift)
      const isClockDrift =
        result.errorMessage?.includes('Booking window not open yet') ||
        result.errorMessage?.includes('tooltip shown') ||
        result.errorMessage?.includes('not yet open');

      if (isClockDrift && attemptNumber < 12) {
        console.log(
          `[Inngest] ⏰ Clock drift detected - scheduling retry #${attemptNumber + 1} in 15 seconds`
        );

        // Schedule retry in 15 seconds
        await inngest.send({
          name: 'booking/attempt',
          data: {
            classId,
            attemptNumber: attemptNumber + 1,
          },
          ts: Date.now() + 15000, // 15 seconds
        });

        return {
          action: 'retry-clock-drift',
          nextRetry: attemptNumber + 1,
          nextRetryTime: new Date(Date.now() + 15000),
        };
      }

      if (isClockDrift && attemptNumber >= 12) {
        console.log(
          `[Inngest] ❌ Clock drift - max retries (12) reached, giving up`
        );
        return {
          action: 'stop',
          reason: 'max-clock-drift-retries-reached',
        };
      }

      // Scenario 4: Class is full
      const isFull =
        result.errorMessage?.toLowerCase().includes('full') ||
        result.errorMessage?.toLowerCase().includes('no waitlist');

      if (isFull) {
        console.log(`[Inngest] 🔒 Class is full - checking if we should retry`);

        // Calculate class start time
        const classStartTime = calculateClassStartTime(
          classData.day_of_week,
          classData.class_time,
          classData.timezone
        );

        // Schedule retry in 15 minutes (if before class starts)
        const nextRetryTime = Date.now() + 15 * 60 * 1000; // 15 minutes

        if (nextRetryTime < classStartTime.getTime()) {
          console.log(
            `[Inngest] 🔄 Scheduling retry in 15 minutes (class starts at ${classStartTime.toISOString()})`
          );

          await inngest.send({
            name: 'booking/attempt',
            data: {
              classId,
              attemptNumber: 1, // Reset attempt number for class full retries
            },
            ts: nextRetryTime,
          });

          return {
            action: 'retry-class-full',
            nextRetryTime: new Date(nextRetryTime),
            classStartTime,
          };
        } else {
          console.log(
            `[Inngest] ⏱️  Class starting soon (${classStartTime.toISOString()}) - stopping retries`
          );
          return {
            action: 'stop',
            reason: 'class-starting-soon',
            classStartTime,
          };
        }
      }

      // Scenario 5: Other failures (technical errors, etc.)
      console.log(
        `[Inngest] ❌ Booking failed: ${result.errorMessage} - not retrying`
      );
      return {
        action: 'stop',
        reason: 'technical-error',
        errorMessage: result.errorMessage,
      };
    });

    return {
      classId,
      status: result.status,
      attemptId,
      nextAction,
    };
  }
);

/**
 * Daily scheduler - runs once per day to schedule all upcoming bookings
 * Ensures all active classes get scheduled even if user adds them mid-week
 */
export const dailySchedulerFunction = inngest.createFunction(
  { id: 'daily-scheduler' },
  { cron: '0 0 * * *' }, // Run at midnight UTC every day
  async ({ step }) => {
    console.log(`[Scheduler] Starting daily scheduling run`);

    // Get all active classes
    const activeClasses = await step.run('fetch-active-classes', async () => {
      return await getAllActiveClasses();
    });

    console.log(`[Scheduler] Found ${activeClasses.length} active classes`);

    if (activeClasses.length === 0) {
      return { scheduledCount: 0, total: 0 };
    }

    // Schedule bookings for each class
    const scheduled = await step.run('schedule-bookings', async () => {
      const results = [];
      for (const classData of activeClasses) {
        try {
          const bookingTime = await scheduleBooking(classData);
          results.push({ classId: classData.id, bookingTime });
        } catch (error) {
          console.error(
            `[Scheduler] Error scheduling class ${classData.id}:`,
            error
          );
          results.push({ classId: classData.id, bookingTime: null, error });
        }
      }
      return results;
    });

    const scheduledCount = scheduled.filter((s) => s.bookingTime).length;

    console.log(
      `[Scheduler] Scheduled ${scheduledCount}/${activeClasses.length} bookings`
    );

    return {
      scheduledCount,
      total: activeClasses.length,
      results: scheduled,
    };
  }
);

/**
 * Helper function to get day name from day of week number
 */
function getDayName(dayOfWeek: number): string {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dayOfWeek] || `Day ${dayOfWeek}`;
}
