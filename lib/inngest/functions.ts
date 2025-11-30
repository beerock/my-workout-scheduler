/**
 * Inngest functions for automated class booking
 * Handles booking attempts, retries for clock drift, and retries for full classes
 */
import { inngest } from './client';
import {
  createBookingAttempt,
  updateBookingAttempt,
  getClassById,
  getAllActiveClasses,
  type ClassNeedingBooking,
} from '@/scripts/database-helpers';
import { calculateClassStartTime, calculateNextClassDate, scheduleBooking } from './scheduler';
import { differenceInMinutes } from 'date-fns';
import { createClient } from '@/lib/supabase/server';

/**
 * Main booking function - triggered at exact booking window time
 * Handles:
 * 1. Clock drift/window detection (9 attempts × 5 seconds = 45s, inside Puppeteer)
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
    const { classId, className, attemptNumber = 1 } = event.data;

    console.log(
      `[Inngest] Booking attempt #${attemptNumber} for class "${className}" (${classId})`
    );

    // Step 1: Fetch class data from database
    const classData = await step.run('fetch-class-data', async () => {
      return await getClassById(classId);
    });

    if (!classData) {
      console.log(`[Inngest] Class "${className}" (${classId}) not found (may have been deleted)`);
      return { error: 'Class not found', classId, className };
    }

    console.log(
      `[Inngest] Found class: ${classData.class_type} on ${getDayName(classData.day_of_week)} at ${classData.class_time}`
    );
    console.log(`[Inngest] Skip flag: ${classData.skip_next_occurrence}, Skip target: ${classData.skip_target_datetime}`);

    // Clear skip_target_datetime from previous week (cleanup stale data)
    // This happens at the NEXT occurrence after the skipped one
    // UI already shows badge only when current_time < skip_target_datetime
    await step.run('clear-previous-skip-datetime', async () => {
      if (classData.skip_target_datetime) {
        const supabase = await createClient();
        await supabase
          .from('recurring_classes')
          .update({ skip_target_datetime: null })
          .eq('id', classData.id);
        console.log(`[Inngest] ✅ Cleared skip_target_datetime from previous occurrence`);
      }
    });

    // Check if we should skip this booking (simple boolean flag check)
    if (classData.skip_next_occurrence === true) {
      console.log(`[Inngest] ⏭️  Skip flag is TRUE - skipping booking for "${className}"`);

      const attemptId = await step.run('create-skip-attempt', async () => {
        return await createBookingAttempt(
          classData.id,
          'skipped',
          null,
          `Skipped: User set skip_next_occurrence flag`
        );
      });

      // Clear the skip flag (so next week books normally)
      await step.run('clear-skip-flag', async () => {
        const supabase = await createClient();
        await supabase
          .from('recurring_classes')
          .update({ skip_next_occurrence: false })
          .eq('id', classData.id);
        console.log(`[Inngest] ✅ Cleared skip_next_occurrence flag for next week`);
      });

      // Keep skip_target_datetime (UI still needs it until class time passes)
      console.log(`[Inngest] Kept skip_target_datetime for UI display`);

      return {
        status: 'skipped',
        attemptId,
        reason: 'user_requested_skip',
        message: 'Skipped based on user skip flag'
      };
    }

    // Check for duplicate runs - if another booking attempt is already in progress, exit
    const hasDuplicateRun = await step.run('check-duplicate-runs', async () => {
      const supabase = await createClient();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: pendingAttempts, error } = await supabase
        .from('booking_attempts')
        .select('id, attempt_timestamp')
        .eq('recurring_class_id', classId)
        .eq('status', 'pending')
        .gte('attempt_timestamp', fiveMinutesAgo)
        .limit(10);

      if (error) {
        console.error('[Inngest] Error checking for duplicate runs:', error);
        return false; // Proceed with caution
      }

      if (pendingAttempts && pendingAttempts.length > 0) {
        console.log(
          `[Inngest] Found ${pendingAttempts.length} recent pending attempt(s) - potential duplicate run detected`
        );
        return true;
      }

      return false;
    });

    if (hasDuplicateRun) {
      console.log(`[Inngest] Exiting to avoid duplicate booking for "${className}"`);
      return {
        classId,
        className,
        status: 'duplicate',
        message: 'Another booking run already in progress - exiting to prevent duplicate',
      };
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

    // Step 3: Trigger GitHub Actions workflow
    console.log(`[Inngest] Triggering GitHub Actions workflow for class "${className}" (${classId})...`);
    const workflowResult = await step.run('trigger-github-actions', async () => {
      const githubToken = process.env.GITHUB_TOKEN;
      const githubRepo = process.env.GITHUB_REPOSITORY || 'beerock/my-workout-scheduler';

      if (!githubToken) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }

      const [owner, repo] = githubRepo.split('/');

      try {
        // Trigger the workflow using GitHub API
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/workflows/booking-automation.yml/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: 'main',
              inputs: {
                class_id: classId,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }

        console.log(`[Inngest] ✅ GitHub Actions workflow triggered successfully`);

        return {
          success: true,
          message: 'GitHub Actions workflow triggered',
        };
      } catch (error) {
        console.error(`[Inngest] Failed to trigger GitHub Actions:`, error);
        throw error;
      }
    });

    console.log(`[Inngest] Workflow trigger result:`, workflowResult);

    // Step 4: Wait for booking result from GitHub Actions
    console.log(`[Inngest] Waiting for booking result...`);
    const bookingResult = await step.waitForEvent('wait-for-result', {
      event: 'booking/result',
      timeout: '10m', // GitHub Actions can take 5-6 min (includes 45s fast retry + page loads)
      match: 'data.classId',  // Match on classId (present in both original and result events)
    });

    if (!bookingResult) {
      console.log(`[Inngest] ⚠️  Timeout waiting for booking result for "${className}"`);
      return {
        classId,
        className: classData.class_type,
        attemptId,
        status: 'timeout',
        message: 'Timeout waiting for GitHub Actions result',
      };
    }

    const { status, errorMessage } = bookingResult.data;
    console.log(`[Inngest] Booking result: ${status}`);
    if (errorMessage) {
      console.log(`[Inngest] Error message: ${errorMessage}`);
    }

    // Step 5: Handle retry logic for class full scenarios
    // If class is full, retry every 15 minutes until class starts
    if (status === 'failed' && errorMessage?.toLowerCase().includes('full')) {
      console.log(`[Inngest] Class is full - checking if we should retry...`);

      // Calculate time until class starts
      const classStartTime = calculateClassStartTime(
        classData.day_of_week,
        classData.class_time,
        classData.timezone
      );
      const now = new Date();
      const minutesUntilClass = differenceInMinutes(classStartTime, now);

      console.log(
        `[Inngest] Minutes until class starts: ${minutesUntilClass}`
      );

      // Only retry if we have at least 15 minutes before class starts
      // No max attempts limit - keep trying until class starts
      if (minutesUntilClass > 15) {
        console.log(
          `[Inngest] Scheduling retry in 15 minutes (attempt #${attemptNumber + 1})`
        );

        // Sleep for 15 minutes, then trigger another booking attempt
        await step.sleep('wait-before-retry', '15m');

        await step.run('send-retry-event', async () => {
          // Calculate class date for idempotency key (prevents duplicate retries)
          const classDate = calculateNextClassDate(
            classData.day_of_week,
            classData.class_time,
            classData.timezone
          );

          await inngest.send({
            name: 'booking/attempt',
            id: `book-retry-${classId}-${classDate}-${attemptNumber + 1}`, // Unique per retry attempt
            data: {
              classId,
              className: classData.class_type,
              attemptNumber: attemptNumber + 1,
            },
          });
        });

        return {
          classId,
          className: classData.class_type,
          attemptId,
          status: 'retrying',
          message: `Class full - scheduled retry #${attemptNumber + 1} in 15 minutes`,
          nextAttemptNumber: attemptNumber + 1,
        };
      } else {
        console.log(
          `[Inngest] Not retrying - class starts in ${minutesUntilClass} minutes (too soon)`
        );
      }
    }

    // Final result (success, waitlisted, or permanent failure)
    return {
      classId,
      className: classData.class_type,
      attemptId,
      status,
      errorMessage,
      message: 'Booking completed',
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
          results.push({ classId: classData.id, className: classData.class_type, bookingTime });
        } catch (error) {
          console.error(
            `[Scheduler] Error scheduling class "${classData.class_type}" (${classData.id}):`,
            error
          );
          results.push({ classId: classData.id, className: classData.class_type, bookingTime: null, error });
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
