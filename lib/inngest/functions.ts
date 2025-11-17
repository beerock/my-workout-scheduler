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
  clearSkipDate,
  type ClassNeedingBooking,
} from '@/scripts/database-helpers';
import { calculateClassStartTime, scheduleBooking } from './scheduler';
import { differenceInMinutes } from 'date-fns';

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

    // Step 3: Trigger GitHub Actions workflow
    console.log(`[Inngest] Triggering GitHub Actions workflow for class ${classId}...`);
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
      timeout: '10m', // GitHub Actions can take 6-7 min with clock drift retries (12 × 15s = 3 min)
      match: 'data.attemptId',
    });

    if (!bookingResult) {
      console.log(`[Inngest] ⚠️  Timeout waiting for booking result`);
      return {
        classId,
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

      // Only retry if:
      // 1. Class hasn't started yet (minutesUntilClass > 0)
      // 2. We have at least 15 minutes before class starts
      // 3. We haven't exceeded max retries (prevent infinite loops)
      const MAX_RETRIES = 20; // Max 5 hours of retries (20 × 15 min)
      if (
        minutesUntilClass > 15 &&
        attemptNumber < MAX_RETRIES
      ) {
        console.log(
          `[Inngest] Scheduling retry in 15 minutes (attempt #${attemptNumber + 1})`
        );

        // Sleep for 15 minutes, then trigger another booking attempt
        await step.sleep('wait-before-retry', '15m');

        await step.run('send-retry-event', async () => {
          await inngest.send({
            name: 'booking/attempt',
            data: {
              classId,
              attemptNumber: attemptNumber + 1,
            },
          });
        });

        return {
          classId,
          attemptId,
          status: 'retrying',
          message: `Class full - scheduled retry #${attemptNumber + 1} in 15 minutes`,
          nextAttemptNumber: attemptNumber + 1,
        };
      } else if (minutesUntilClass <= 15) {
        console.log(
          `[Inngest] Not retrying - class starts in ${minutesUntilClass} minutes (too soon)`
        );
      } else if (attemptNumber >= MAX_RETRIES) {
        console.log(
          `[Inngest] Not retrying - max retries reached (${MAX_RETRIES})`
        );
      }
    }

    // Final result (success, waitlisted, or permanent failure)
    return {
      classId,
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
