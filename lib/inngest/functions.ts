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

    // Step 4: Wait briefly and return
    // Note: The actual booking happens in GitHub Actions asynchronously
    // Results will be written directly to Supabase by the GitHub Actions workflow
    const result = {
      status: 'pending' as const,
      message: 'Booking initiated via GitHub Actions',
    };

    console.log(
      `[Inngest] Booking initiated via GitHub Actions for class ${classId}`
    );

    // Note: GitHub Actions will handle:
    // - Running Puppeteer automation
    // - Retrying for clock drift (if needed)
    // - Writing results to Supabase
    // - Uploading screenshots

    // The booking attempt record will be updated by GitHub Actions workflow
    // when the booking completes

    return {
      classId,
      attemptId,
      message: 'GitHub Actions workflow triggered successfully',
      workflowTriggered: true,
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
