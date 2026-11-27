/**
 * Inngest functions for automated class booking
 * Handles booking attempts with early-start optimization and retries for full classes
 */
import { inngest } from './client';
import {
  createBookingAttempt,
  getClassById,
  getAllActiveClasses,
} from '@/scripts/database-helpers';
import { scheduleBooking } from './scheduler';
import { differenceInMinutes, subHours } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { getDayName } from '@/lib/date-utils';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendBookingNotification } from '@/lib/notifications/send-booking-notification';
import { formatTime12Hour } from '@/lib/date-utils';

/**
 * Main booking function - triggered at exact booking window time
 * Handles:
 * 1. Early-start optimization (fires 90s early, waits on class details page, refreshes at booking window open)
 * 2. Class full retries (every 15 minutes until class starts)
 */
export const bookClassFunction = inngest.createFunction(
  {
    id: 'book-class',
    // Inngest will retry the entire function if it crashes (network errors, etc.)
    retries: 3,
    // Cancel any pending run when a cancel event matches classId + classDate
    cancelOn: [
      {
        event: 'booking/cancel',
        if: 'async.data.classId == event.data.classId && async.data.classDate == event.data.classDate',
      },
    ],
  },
  { event: 'booking/attempt' },
  async ({ event, step }) => {
    const { classId, className, attemptNumber = 1, expectedBookingTime } = event.data;

    console.log(
      `[Inngest] Booking attempt #${attemptNumber} for class "${className}" (${classId})`
    );

    // Timing guard: defense-in-depth against premature event delivery
    if (expectedBookingTime && attemptNumber === 1) {
      const now = Date.now();
      const earlyByMs = expectedBookingTime - now;
      const earlyByMinutes = earlyByMs / (1000 * 60);

      if (earlyByMinutes > 60 * 24) {
        // More than 24 hours early - clearly a bug, abort
        console.error(
          `[Inngest] ABORTING: Event fired ${Math.round(earlyByMinutes / 60)} hours early for "${className}". ` +
          `Expected: ${new Date(expectedBookingTime).toISOString()}, Now: ${new Date(now).toISOString()}`
        );
        return {
          classId,
          className,
          status: 'aborted',
          error: `Event fired ${Math.round(earlyByMinutes / 60)} hours before expected booking time`,
        };
      }

      if (earlyByMinutes > 30) {
        // 30 min to 24h early - wait until the right time
        console.log(
          `[Inngest] Event fired ${Math.round(earlyByMinutes)} minutes early. ` +
          `Sleeping until ${new Date(expectedBookingTime).toISOString()}`
        );
        await step.sleepUntil('wait-for-booking-window', new Date(expectedBookingTime));
      }
    }

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

    // Runtime guard: events queued before deactivate still fire (toggle off doesn't cancel).
    if (classData.active === false) {
      console.log(
        `[Inngest] Class "${className}" (${classId}) is inactive - aborting booking`
      );
      return {
        classId,
        className,
        status: 'inactive',
        message: 'Class is inactive - skipping booking',
      };
    }

    // Clear skip_target_datetime from previous week (cleanup stale data)
    // This happens at the NEXT occurrence after the skipped one
    // UI already shows badge only when current_time < skip_target_datetime
    await step.run('clear-previous-skip-datetime', async () => {
      // Only clear datetime if we're NOT currently skipping
      // (i.e., this is cleanup from a previous week's skip)
      if (classData.skip_target_datetime && !classData.skip_next_occurrence) {
        const supabase = createServiceRoleClient();
        const { error } = await supabase
          .from('recurring_classes')
          .update({ skip_target_datetime: null })
          .eq('id', classData.id);

        if (error) {
          console.error(`[Inngest] ❌ Failed to clear skip_target_datetime:`, error);
          throw new Error(`Failed to clear skip datetime: ${error.message}`);
        }

        console.log(`[Inngest] ✅ Cleared skip_target_datetime from previous occurrence`);
        return { success: true };
      }
      return { success: true, skipped: 'skip still active or no datetime' };
    });

    // Check if we should skip this booking (simple boolean flag check)
    if (classData.skip_next_occurrence === true) {
      const skipTargetDate = classData.skip_target_datetime
        ? new Date(classData.skip_target_datetime)
        : null

      // Stale/orphaned flag: skip_target_datetime is in the past (or missing), meaning
      // the flag was set after the booking window had already opened for that occurrence
      // and was never consumed. Clear both fields and fall through to booking.
      if (skipTargetDate === null || skipTargetDate < new Date()) {
        await step.run('clear-stale-skip-flag', async () => {
          const supabase = createServiceRoleClient();
          const { error } = await supabase
            .from('recurring_classes')
            .update({ skip_next_occurrence: false, skip_target_datetime: null })
            .eq('id', classData.id);
          if (error) throw new Error(`Failed to clear stale skip: ${error.message}`);
          console.log(`[Inngest] ✅ Cleared stale skip flag (target was in the past)`);
          return { success: true };
        });
        // Fall through to booking below
      } else {
        // Valid skip — consume it
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
          const supabase = createServiceRoleClient();
          const { error } = await supabase
            .from('recurring_classes')
            .update({ skip_next_occurrence: false })
            .eq('id', classData.id);

          if (error) {
            console.error(`[Inngest] ❌ Failed to clear skip_next_occurrence flag:`, error);
            throw new Error(`Failed to clear skip flag: ${error.message}`);
          }

          console.log(`[Inngest] ✅ Cleared skip_next_occurrence flag for next week`);
          return { success: true };
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
    }

    // Check for duplicate runs - 5-minute lockout per class.
    // Any non-skipped attempt started in the last 5 minutes blocks a new run,
    // whatever its status. This is the server-side brake on Book Now -> cancel
    // -> Book Now spam (cancel stops the Inngest run but not a GitHub Actions
    // run already dispatched). Don't narrow this to status='pending': since
    // v2.39 the single attempt row reaches a final status ~1 min in, which
    // would shrink the lockout to ~1 min. (Before v2.39 an orphaned 'pending'
    // row held the lock for the full 5 minutes.) Class-full retries (15 min)
    // and timeout retries (25+ min) fall outside the window.
    const hasDuplicateRun = await step.run('check-duplicate-runs', async () => {
      const supabase = createServiceRoleClient();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: recentAttempts, error } = await supabase
        .from('booking_attempts')
        .select('id, status, attempt_timestamp')
        .eq('recurring_class_id', classId)
        .neq('status', 'skipped')
        .gte('attempt_timestamp', fiveMinutesAgo)
        .limit(10);

      if (error) {
        console.error('[Inngest] Error checking for duplicate runs:', error);
        return false; // Proceed with caution
      }

      if (recentAttempts && recentAttempts.length > 0) {
        console.log(
          `[Inngest] Found ${recentAttempts.length} attempt(s) for this class in the last 5 minutes - duplicate run lockout`
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
      const { createAppAuth } = await import('@octokit/auth-app');
      const githubRepo = process.env.GITHUB_REPOSITORY || 'beerock/my-workout-scheduler';

      // Validate GitHub App credentials
      if (!process.env.GITHUB_APP_ID || !process.env.GITHUB_APP_PRIVATE_KEY || !process.env.GITHUB_APP_INSTALLATION_ID) {
        throw new Error('Missing GitHub App environment variables (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_INSTALLATION_ID)');
      }

      const [owner, repo] = githubRepo.split('/');

      try {
        // Generate installation access token using GitHub App
        const auth = createAppAuth({
          appId: process.env.GITHUB_APP_ID,
          privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
          installationId: process.env.GITHUB_APP_INSTALLATION_ID,
        });

        const { token } = await auth({ type: 'installation' });

        // Trigger the workflow using GitHub API
        const dispatch = (inputs: Record<string, string>) =>
          fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/workflows/booking-automation.yml/dispatches`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ref: 'main', inputs }),
            }
          );

        const baseInputs = {
          class_id: classId,
          expected_booking_time: expectedBookingTime ? String(expectedBookingTime) : '',
        };

        // Pass our attempt row so the workflow updates it instead of creating
        // a second one (single booking_attempts row per run).
        let response = await dispatch({ ...baseInputs, attempt_id: attemptId });

        // The workflow always runs from main. If main's workflow file doesn't
        // declare attempt_id yet (e.g. this code is live on a preview deploy
        // before merge), GitHub rejects the unknown input with a 422. Retry
        // without it on any 422 (don't depend on GitHub's error wording) so
        // booking still happens - the script then creates its own row. If the
        // retry also fails, the !response.ok check below throws as before.
        // Logged at error level: after merge this should never happen, and if
        // it does every booking is back to writing duplicate rows.
        let attemptIdPassed = true;
        if (response.status === 422) {
          const errorText = await response.text();
          console.error(`[Inngest] Dispatch with attempt_id rejected (422: ${errorText}) - retrying without it (script will create its own attempt row)`);
          attemptIdPassed = false;
          response = await dispatch(baseInputs);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }

        console.log(`[Inngest] ✅ GitHub Actions workflow triggered successfully`);

        return {
          success: true,
          message: 'GitHub Actions workflow triggered',
          attemptIdPassed,
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
      timeout: '10m', // GitHub Actions can take 5-6 min (includes early-start wait + page loads)
      match: 'data.classId',  // Match on classId (present in both original and result events)
    });

    if (!bookingResult) {
      console.log(`[Inngest] ⚠️  Timeout waiting for booking result for "${className}"`);

      // Mark the attempt failed - but only if it's still pending. The script
      // writes its result to this same row, so if the result event was lost or
      // late, the row may already hold the real status (e.g. 'confirmed').
      // Never overwrite that, and don't retry a class that's already handled.
      const timeoutUpdate = await step.run('update-attempt-timeout', async () => {
        const supabase = createServiceRoleClient();
        const { data: updatedRows, error } = await supabase
          .from('booking_attempts')
          // @ts-ignore - Supabase client type inference issue (same as scripts/database-helpers updateBookingAttempt)
          .update({
            status: 'failed',
            error_message: 'Timeout waiting for GitHub Actions result',
          })
          .eq('id', attemptId)
          .eq('status', 'pending')
          .select('id');

        if (error) {
          console.error('[Inngest] Failed to mark attempt as timed out:', error);
          throw new Error(`Failed to update booking attempt: ${error.message}`);
        }

        if (updatedRows && updatedRows.length > 0) {
          return { markedFailed: true, existingStatus: null as string | null };
        }

        const { data: existing, error: readError } = await supabase
          .from('booking_attempts')
          .select('status')
          .eq('id', attemptId)
          .maybeSingle();

        if (readError) {
          console.error('[Inngest] Failed to read attempt after timeout:', readError);
        }

        return {
          markedFailed: false,
          existingStatus: (existing as { status: string } | null)?.status ?? null,
        };
      });

      // Only a handled outcome stops the run. A 'failed' row (e.g. class full,
      // result event lost) or an unreadable status falls through to the normal
      // timeout retry below, same as before v2.39.
      const HANDLED_STATUSES = ['confirmed', 'waitlisted', 'no_registration', 'skipped'];
      if (
        !timeoutUpdate.markedFailed &&
        timeoutUpdate.existingStatus &&
        HANDLED_STATUSES.includes(timeoutUpdate.existingStatus)
      ) {
        console.warn(
          `[Inngest] Result event never arrived, but attempt ${attemptId} already has status "${timeoutUpdate.existingStatus}" - leaving it and not retrying`
        );
        return {
          classId,
          className: classData.class_type,
          attemptId,
          status: 'result_event_missing',
          message: `No booking/result event; attempt row already final (${timeoutUpdate.existingStatus})`,
        };
      }

      // Check if we should retry (use fixed class date, not recalculated)
      const timeoutClassStartTime = getFixedClassStartTime(
        event.data.classDate,
        classData.class_time,
        classData.timezone
      );
      const timeoutNow = new Date();
      const timeoutMinutesUntilClass = differenceInMinutes(timeoutClassStartTime, timeoutNow);

      console.log(`[Inngest] Minutes until class starts: ${timeoutMinutesUntilClass}`);

      if (timeoutMinutesUntilClass > 15) {
        console.log(`[Inngest] Scheduling retry in 15 minutes after timeout (attempt #${attemptNumber + 1})`);

        await step.sleep('wait-before-timeout-retry', '15m');

        await step.run('send-timeout-retry-event', async () => {
          await inngest.send({
            name: 'booking/attempt',
            id: `book-retry-${classId}-${event.data.classDate}-${attemptNumber + 1}-${crypto.randomUUID().slice(0, 8)}`,
            data: {
              classId,
              className: classData.class_type,
              classDate: event.data.classDate, // Propagate original date
              attemptNumber: attemptNumber + 1,
              // expectedBookingTime intentionally omitted: window already open, no early-start wait needed
            },
          });
        });

        return {
          classId,
          className: classData.class_type,
          attemptId,
          status: 'timeout_retrying',
          message: `GitHub Actions timeout - scheduled retry #${attemptNumber + 1} in 15 minutes`,
          nextAttemptNumber: attemptNumber + 1,
        };
      }

      // No time left for retry - send "gave up" notification
      console.log(`[Inngest] Not retrying after timeout - class starts in ${timeoutMinutesUntilClass} minutes (too soon)`);

      await step.run('send-timeout-exhausted-notification', async () => {
        try {
          const formattedDate = formatInTimeZone(timeoutClassStartTime, classData.timezone, 'MMMM d, yyyy');
          const dayName = formatInTimeZone(timeoutClassStartTime, classData.timezone, 'EEEE');
          const classDateISO = formatInTimeZone(timeoutClassStartTime, classData.timezone, 'yyyy-MM-dd');
          const stoppedCheckingTime = formatInTimeZone(timeoutClassStartTime, classData.timezone, "EEEE, MMMM d 'at' h:mm a");

          // Query for actual first attempt time from database
          const supabase = createServiceRoleClient();
          const bookingWindowStart = subHours(timeoutClassStartTime, classData.booking_window_hours);

          const { data: firstAttempt } = await supabase
            .from('booking_attempts')
            .select('attempt_timestamp')
            .eq('recurring_class_id', classId)
            .gte('attempt_timestamp', bookingWindowStart.toISOString())
            .lt('attempt_timestamp', timeoutClassStartTime.toISOString())
            .order('attempt_timestamp', { ascending: true })
            .limit(1)
            .maybeSingle();

          const bookingStartedTime = firstAttempt?.attempt_timestamp
            ? new Date(firstAttempt.attempt_timestamp)
            : timeoutClassStartTime;

          // Match format with stoppedCheckingTime for consistency
          const bookingStartedTimeFormatted = formatInTimeZone(bookingStartedTime, classData.timezone, "EEEE, MMMM d 'at' h:mm a");

          await sendBookingNotification({
            userId: classData.user_id,
            bookingAttemptId: attemptId,
            recurringClassId: classId,
            classDate: classDateISO,
            status: 'failed',
            errorMessage: 'Booking timed out and ran out of time to retry',
            className: classData.class_type,
            dayOfWeek: dayName,
            date: formattedDate,
            time: formatTime12Hour(classData.class_time),
            branchName: classData.branch,
            isRetryExhausted: true,
            retryCount: attemptNumber,
            bookingStartedTime: bookingStartedTimeFormatted,
            stoppedCheckingTime: stoppedCheckingTime,
          });

          console.log(`[Inngest] Sent "gave up" notification - timeout retries exhausted`);
        } catch (error) {
          console.error(`[Inngest] Failed to send "gave up" notification:`, error);
          // Don't throw - notification failure shouldn't break flow
        }
      });

      return {
        classId,
        className: classData.class_type,
        attemptId,
        status: 'timeout',
        message: 'Timeout waiting for GitHub Actions result - no time for retry',
      };
    }

    const { status, errorMessage, alreadyBooked } = bookingResult.data;
    // The row that holds the real result. Normally this is our own attemptId
    // (passed to the workflow). Only trust a different ID from the event when
    // the dispatch fell back to running without attempt_id (script created its
    // own row) - otherwise a different ID means this event belongs to another
    // run of the same class (waitForEvent matches on classId only, e.g. a late
    // result from a run that was cancelled or timed out).
    const eventAttemptId = bookingResult.data.attemptId;
    let resultAttemptId: string = attemptId;
    if (typeof eventAttemptId === 'string' && eventAttemptId !== attemptId) {
      if (workflowResult.attemptIdPassed === false) {
        resultAttemptId = eventAttemptId;
      } else {
        console.warn(
          `[Inngest] booking/result attemptId ${eventAttemptId} doesn't match this run's attempt ${attemptId} - likely another run's result; linking notifications to ${attemptId}`
        );
      }
    }
    console.log(`[Inngest] Booking result: ${status}`);
    if (errorMessage) {
      console.log(`[Inngest] Error message: ${errorMessage}`);
    }

    // Step 4.5: Send notification email (if user preferences allow)
    await step.run('send-notification', async () => {
      try {
        // Calculate formatted date for email (use fixed date from event)
        const classStartTime = getFixedClassStartTime(
          event.data.classDate,
          classData.class_time,
          classData.timezone
        );
        const formattedDate = formatInTimeZone(classStartTime, classData.timezone, 'MMMM d, yyyy');
        const dayName = formatInTimeZone(classStartTime, classData.timezone, 'EEEE');
        const classDateISO = formatInTimeZone(classStartTime, classData.timezone, 'yyyy-MM-dd');
        // Formatted class start time for email display
        const classStartTimeFormatted = formatInTimeZone(classStartTime, classData.timezone, "EEEE, MMMM d 'at' h:mm a");

        // Check if this is a retry success (was previously full, now confirmed)
        const isRetrySuccess = attemptNumber > 1 && status === 'confirmed';
        // Check if a retry landed a waitlist spot (was previously full, now waitlisted)
        const isRetryWaitlisted = attemptNumber > 1 && status === 'waitlisted';

        // First attempt time for "class full" emails - format in gym timezone
        const now = new Date();
        const firstAttemptTimeFormatted = formatInTimeZone(now, classData.timezone, 'MMM d, yyyy h:mm a');

        await sendBookingNotification({
          userId: classData.user_id,
          bookingAttemptId: resultAttemptId,
          recurringClassId: classId,
          classDate: classDateISO,
          status: status as 'confirmed' | 'waitlisted' | 'failed' | 'skipped' | 'no_registration',
          errorMessage,
          className: classData.class_type,
          dayOfWeek: dayName,
          date: formattedDate,
          time: formatTime12Hour(classData.class_time),
          branchName: classData.branch,
          alreadyBooked: alreadyBooked || false,
          isRetrySuccess,
          isRetryWaitlisted,
          retryCount: attemptNumber,
          firstAttemptTime: firstAttemptTimeFormatted,
          classStartTime: classStartTimeFormatted,
        });

        console.log(`[Inngest] Notification sent (or skipped per user preferences)`);
      } catch (error) {
        console.error(`[Inngest] Failed to send notification:`, error);
        // Don't throw - notification failure shouldn't break booking flow
      }
    });

    // No-registration classes: no retry logic needed
    if (status === 'no_registration') {
      return {
        classId,
        className: classData.class_type,
        attemptId,
        status: 'no_registration',
        message: 'Class does not offer online registration',
      };
    }

    // Step 5: Handle retry logic for class full scenarios
    // If class is full, retry every 15 minutes until class starts.
    // NOTE: "unable to reserve" (YMCA system error) is intentionally NOT
    // retried here - it's handled as a one-shot action email in v2.35 since
    // silent retries don't help when the fix requires a human at YMCA to
    // notice and correct the backend issue. See routing in get-email-template.ts.
    if (status === 'failed' && errorMessage?.toLowerCase().includes('full')) {
      console.log(`[Inngest] Class is full - checking if we should retry...`);

      // Calculate time until class starts (use fixed date from event)
      const classStartTime = getFixedClassStartTime(
        event.data.classDate,
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
          await inngest.send({
            name: 'booking/attempt',
            // SECURITY: Random suffix prevents event ID prediction/enumeration
            id: `book-retry-${classId}-${event.data.classDate}-${attemptNumber + 1}-${crypto.randomUUID().slice(0, 8)}`,
            data: {
              classId,
              className: classData.class_type,
              classDate: event.data.classDate, // Propagate original date
              attemptNumber: attemptNumber + 1,
              // expectedBookingTime intentionally omitted: window already open, no early-start wait needed
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

        // Send "gave up" notification - retries exhausted, class time arrived
        await step.run('send-retry-exhausted-notification', async () => {
          try {
            const formattedDate = formatInTimeZone(classStartTime, classData.timezone, 'MMMM d, yyyy');
            const dayName = formatInTimeZone(classStartTime, classData.timezone, 'EEEE');
            const classDateISO = formatInTimeZone(classStartTime, classData.timezone, 'yyyy-MM-dd');
            const stoppedCheckingTime = formatInTimeZone(classStartTime, classData.timezone, "EEEE, MMMM d 'at' h:mm a");

            // Query for actual first attempt time from database
            const supabase = createServiceRoleClient();
            const bookingWindowStart = subHours(classStartTime, classData.booking_window_hours);

            const { data: firstAttempt } = await supabase
              .from('booking_attempts')
              .select('attempt_timestamp')
              .eq('recurring_class_id', classId)
              .gte('attempt_timestamp', bookingWindowStart.toISOString())
              .lt('attempt_timestamp', classStartTime.toISOString())
              .order('attempt_timestamp', { ascending: true })
              .limit(1)
              .maybeSingle();

            const bookingStartedTime = firstAttempt?.attempt_timestamp
              ? new Date(firstAttempt.attempt_timestamp)
              : classStartTime;

            // Match format with stoppedCheckingTime for consistency
            const bookingStartedTimeFormatted = formatInTimeZone(bookingStartedTime, classData.timezone, "EEEE, MMMM d 'at' h:mm a");

            await sendBookingNotification({
              userId: classData.user_id,
              bookingAttemptId: resultAttemptId,
              recurringClassId: classId,
              classDate: classDateISO,
              status: 'failed',
              errorMessage: 'Class stayed full until class time - retries exhausted',
              className: classData.class_type,
              dayOfWeek: dayName,
              date: formattedDate,
              time: formatTime12Hour(classData.class_time),
              branchName: classData.branch,
              isRetryExhausted: true,
              retryCount: attemptNumber,
              bookingStartedTime: bookingStartedTimeFormatted,
              stoppedCheckingTime: stoppedCheckingTime,
            });

            console.log(`[Inngest] Sent "gave up" notification - retries exhausted`);
          } catch (error) {
            console.error(`[Inngest] Failed to send "gave up" notification:`, error);
            // Don't throw - notification failure shouldn't break flow
          }
        });
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
 * Pause reminder function - sends email 7 days after user pauses schedule
 * Cancelled automatically if user unpauses before 7 days
 */
export const pauseReminderFunction = inngest.createFunction(
  {
    id: 'pause-reminder',
    // Cancel if user unpauses before 7 days
    cancelOn: [
      {
        event: 'schedule/unpause',
        if: 'async.data.userId == event.data.userId',
      },
    ],
  },
  { event: 'schedule/pause' },
  async ({ event, step }) => {
    const { userId } = event.data;

    console.log(`[Inngest] Pause reminder scheduled for user ${userId} (7 days from now)`);

    // Wait 7 days before sending reminder
    await step.sleep('wait-7-days', '7d');

    console.log(`[Inngest] 7 days passed, checking if user ${userId} is still paused...`);

    // Check if user is still paused and has pause reminder enabled
    const shouldSendReminder = await step.run('check-user-status', async () => {
      const supabase = createServiceRoleClient();

      // Get user settings
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('schedule_paused, email_on_pause_reminder, notification_email')
        .eq('user_id', userId)
        .single();

      if (error || !settings) {
        console.log(`[Inngest] Could not fetch settings for user ${userId}:`, error);
        return false;
      }

      // Check all conditions
      const isPaused = settings.schedule_paused === true;
      const notificationsEnabled = settings.notification_email !== false;
      const pauseReminderEnabled = settings.email_on_pause_reminder !== false;

      console.log(`[Inngest] User ${userId} status: paused=${isPaused}, notifications=${notificationsEnabled}, pauseReminder=${pauseReminderEnabled}`);

      return isPaused && notificationsEnabled && pauseReminderEnabled;
    });

    if (!shouldSendReminder) {
      console.log(`[Inngest] Not sending pause reminder - user unpaused or preference disabled`);
      return {
        userId,
        status: 'skipped',
        reason: 'User unpaused or reminder preference disabled',
      };
    }

    // Send pause reminder email
    await step.run('send-pause-reminder', async () => {
      const { getUserEmail, sendEmailNotification } = await import('@/lib/email/send-notification');
      const { pauseReminderEmail } = await import('@/lib/email/templates/pause-reminder');

      const userEmail = await getUserEmail(userId);
      if (!userEmail) {
        console.log(`[Inngest] User ${userId} has no email, skipping pause reminder`);
        return { sent: false, reason: 'No email address' };
      }

      // Get environment-specific URLs using getSiteUrl() for proper Vercel detection
      const { getSiteUrl } = await import('@/lib/env-utils');
      const appUrl = getSiteUrl();
      const dashboardUrl = `${appUrl}/dashboard`;
      const settingsUrl = `${appUrl}/dashboard/account`;

      // Generate email
      const { subject, html } = pauseReminderEmail({
        dashboardUrl,
        settingsUrl,
      });

      // Send email
      const result = await sendEmailNotification({
        to: userEmail,
        subject,
        html,
        userId,
        notificationType: 'pause_reminder',
      });

      if (result.success) {
        console.log(`[Inngest] Pause reminder sent to user ${userId}`);
      } else {
        console.error(`[Inngest] Failed to send pause reminder:`, result.error);
      }

      return result;
    });

    return {
      userId,
      status: 'sent',
      message: 'Pause reminder email sent after 7 days',
    };
  }
);

/**
 * Supabase keep-alive - prevents free-tier database pause (7-day inactivity limit)
 * Runs every 3 days as a safety net, independent of the daily scheduler
 */
export const supabaseKeepAliveFunction = inngest.createFunction(
  { id: 'supabase-keep-alive' },
  { cron: '0 0 */3 * *' }, // Every 3 days at midnight UTC
  async ({ step }) => {
    return await step.run('ping-supabase', async () => {
      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from('user_settings')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('[KeepAlive] Supabase ping failed:', error);
        throw new Error(`Keep-alive query failed: ${error.message}`);
      }

      console.log('[KeepAlive] Supabase ping successful');
      return { success: true, timestamp: new Date().toISOString() };
    });
  }
);

/**
 * Calculate class start time from a fixed date string (not relative to now).
 * Unlike calculateClassStartTime(), this won't roll forward to next week
 * during retries when the original class date has passed.
 */
function getFixedClassStartTime(
  classDate: string,      // "YYYY-MM-DD"
  classTime: string,      // "HH:MM" or "HH:MM:SS"
  timezone: string
): Date {
  const [hours, minutes] = classTime.split(':').map(Number);
  const [year, month, day] = classDate.split('-').map(Number);
  // Build an ISO-like string so fromZonedTime interprets it in the given timezone
  // (avoids new Date() constructor which uses runtime-local timezone)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  return fromZonedTime(dateStr, timezone);
}

