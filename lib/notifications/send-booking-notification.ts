/**
 * Booking Notification Sender
 *
 * Main function to send booking result notifications.
 * Handles user preference checking, email template selection, and sending.
 *
 * Called by Inngest booking functions after booking attempt completes.
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getEmailTemplate, type BookingEmailData } from '@/lib/email/get-email-template';
import { sendEmailNotification, getUserEmail } from '@/lib/email/send-notification';

export type SendBookingNotificationParams = {
  userId: string;
  bookingAttemptId: string;
  recurringClassId: string; // For deduplication by class instance
  classDate: string; // ISO date string (YYYY-MM-DD) for deduplication
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped';
  errorMessage?: string; // Required if status === 'failed'
  className: string;
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  date: string; // Formatted date for display
  time: string; // Class time
  branchName: string;
  isRetrySuccess?: boolean; // True if this was a successful retry after being full
  isRetryExhausted?: boolean; // True if all retries failed and class time arrived
  retryCount?: number; // Number of retries
  firstAttemptTime?: string; // When we first tried to book (for retrying emails) - legacy
  classStartTime?: string; // When the class starts (for retrying emails) - legacy
  bookingStartedTime?: string; // When we started trying to book (for final/exhausted emails)
  stoppedCheckingTime?: string; // When we stopped checking (for final/exhausted emails)
};

export type NotificationResult = {
  sent: boolean;
  reason?: string; // Why notification wasn't sent (if sent === false)
  error?: string;
};

/**
 * Main function to send booking notification
 */
export async function sendBookingNotification(
  params: SendBookingNotificationParams
): Promise<NotificationResult> {
  // Use service role client to bypass RLS (called from Inngest, no user session)
  const supabase = createServiceRoleClient();

  // 1. Get user email
  const userEmail = await getUserEmail(params.userId);
  if (!userEmail) {
    console.log(`[Notification] User ${params.userId} has no email, skipping notification`);
    return {
      sent: false,
      reason: 'User has no email address',
    };
  }

  // 2. Get user notification preferences
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', params.userId)
    .single();

  if (settingsError || !settings) {
    console.error(`[Notification] Failed to fetch settings for user ${params.userId}:`, settingsError);
    // Graceful degradation: use defaults if settings not found
    // This ensures backward compatibility if settings aren't initialized yet
  }

  // Use settings or defaults
  const notificationEmail = settings?.notification_email ?? true;
  const notificationFrequency = settings?.notification_frequency ?? 'immediate';
  const emailOnSuccess = settings?.email_on_success ?? true;
  const emailOnWaitlist = settings?.email_on_waitlist ?? true;
  // Note: No emailOnFailure setting - critical/failure emails are ALWAYS sent
  const emailOnRetry = settings?.email_on_retry ?? true;

  // 3. Check if notifications are globally disabled
  if (!notificationEmail) {
    console.log(`[Notification] User ${params.userId} has notifications disabled`);
    return {
      sent: false,
      reason: 'User has email notifications disabled',
    };
  }

  // 4. Check if frequency is "off"
  if (notificationFrequency === 'off') {
    console.log(`[Notification] User ${params.userId} has notification frequency set to "off"`);
    return {
      sent: false,
      reason: 'User notification frequency is set to "off"',
    };
  }

  // 5. Handle "critical_only" mode
  if (notificationFrequency === 'critical_only') {
    // Only send if this is a critical failure (login, cancelled, etc.)
    if (params.status !== 'failed') {
      console.log(`[Notification] User ${params.userId} is in critical-only mode, skipping non-failure notification`);
      return {
        sent: false,
        reason: 'User in critical-only mode (only failures sent)',
      };
    }

    // Check if this failure is critical
    const isCritical = isCriticalFailure(params.errorMessage || '');
    if (!isCritical) {
      console.log(`[Notification] User ${params.userId} is in critical-only mode, this failure is not critical`);
      return {
        sent: false,
        reason: 'User in critical-only mode (failure is not critical)',
      };
    }
  }

  // 6. Handle "daily_digest" mode
  if (notificationFrequency === 'daily_digest') {
    // Queue for digest (post-MVP feature)
    // For MVP, we'll skip digest functionality and just log
    console.log(`[Notification] User ${params.userId} has daily digest enabled (post-MVP feature, skipping for now)`);
    return {
      sent: false,
      reason: 'Daily digest not yet implemented (post-MVP)',
    };
  }

  // 7. Apply individual notification toggles (immediate mode only)
  if (params.status === 'confirmed' && !emailOnSuccess) {
    console.log(`[Notification] User ${params.userId} has success emails disabled`);
    return {
      sent: false,
      reason: 'User has success email notifications disabled',
    };
  }

  if (params.status === 'waitlisted' && !emailOnWaitlist) {
    console.log(`[Notification] User ${params.userId} has waitlist emails disabled`);
    return {
      sent: false,
      reason: 'User has waitlist email notifications disabled',
    };
  }

  // Note: No check for emailOnFailure - failure/critical emails are ALWAYS sent
  // Users cannot disable them (login failures, class cancelled, etc. are too important)

  // 7.5. "Gave up" notifications respect emailOnRetry preference
  // (closure of retry sequence should follow same preference as retry start)
  if (params.isRetryExhausted && !emailOnRetry) {
    console.log(`[Notification] User ${params.userId} has retry emails disabled, skipping retry-exhausted notification`);
    return {
      sent: false,
      reason: 'User has retry email notifications disabled',
    };
  }

  // 8. Special case: "Class full" retry emails (first failure only per class instance)
  // "Gave up" notifications bypass deduplication - they're the final closure email,
  // separate from the initial "retrying" notification, and users need exactly one of each.
  if (params.status === 'failed' && isClassFullError(params.errorMessage || '') && !params.isRetryExhausted) {
    // Check if we already sent a "class full" email for THIS CLASS INSTANCE
    // Uses recurring_class_id + class_date for deduplication (not booking_attempt_id)
    const alreadySent = await hasClassFullEmailBeenSent(
      params.userId,
      params.recurringClassId,
      params.classDate
    );

    if (alreadySent) {
      console.log(`[Notification] Already sent "class full" email for class ${params.recurringClassId} on ${params.classDate}, skipping`);
      return {
        sent: false,
        reason: 'Class full email already sent for this class instance',
      };
    }

    // User can disable retry emails
    if (!emailOnRetry) {
      console.log(`[Notification] User ${params.userId} has retry emails disabled`);
      return {
        sent: false,
        reason: 'User has retry email notifications disabled',
      };
    }
  }

  // 9. Don't send emails for skipped classes
  if (params.status === 'skipped') {
    console.log(`[Notification] Booking was intentionally skipped, no notification sent`);
    return {
      sent: false,
      reason: 'Class was intentionally skipped by user',
    };
  }

  // 10. Get environment-specific URLs for email CTAs using getSiteUrl() for proper Vercel detection
  const { getSiteUrl } = await import('@/lib/env-utils');
  const appUrl = getSiteUrl();
  const dashboardUrl = `${appUrl}/dashboard`;
  const scheduleUrl = `${appUrl}/dashboard/schedule`;
  const credentialsUrl = `${appUrl}/dashboard/credentials`;
  const settingsUrl = `${appUrl}/dashboard/account`;

  // 11. Prepare email data
  const emailData: BookingEmailData = {
    className: params.className,
    dayOfWeek: params.dayOfWeek,
    date: params.date,
    time: params.time,
    branchName: params.branchName,
    status: params.status,
    errorMessage: params.errorMessage,
    isRetrySuccess: params.isRetrySuccess,
    isRetryExhausted: params.isRetryExhausted,
    retryCount: params.retryCount,
    bookingTimestamp: new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    firstAttemptTime: params.firstAttemptTime,
    classStartTime: params.classStartTime,
    bookingStartedTime: params.bookingStartedTime,
    stoppedCheckingTime: params.stoppedCheckingTime,
    dashboardUrl,
    scheduleUrl,
    credentialsUrl,
    settingsUrl,
  };

  // 12. Get email template
  let template;
  try {
    template = getEmailTemplate(emailData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown template error';
    console.error(`[Notification] Failed to get email template:`, error);
    return {
      sent: false,
      error: errorMessage,
    };
  }

  // 13. Send email
  const result = await sendEmailNotification({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    userId: params.userId,
    bookingAttemptId: params.bookingAttemptId,
    recurringClassId: params.recurringClassId,
    classDate: params.classDate,
    notificationType: template.notificationType,
  });

  if (!result.success) {
    console.error(`[Notification] Failed to send email:`, result.error);
    return {
      sent: false,
      error: result.error,
    };
  }

  console.log(`[Notification] Successfully sent ${template.notificationType} email to ${userEmail}`);
  return {
    sent: true,
  };
}

/**
 * Check if error message indicates a critical failure
 */
function isCriticalFailure(errorMessage: string): boolean {
  const message = errorMessage.toLowerCase();
  const criticalKeywords = [
    'login failed',
    'class cancelled',
    'class is cancelled',
    'not reservable',
    'time conflict',
    'password',
    'credentials',
  ];

  return criticalKeywords.some(keyword => message.includes(keyword));
}

/**
 * Check if error message indicates class is full
 */
function isClassFullError(errorMessage: string): boolean {
  const message = errorMessage.toLowerCase();
  return message.includes('full') || message.includes('no waitlist option');
}

/**
 * Check if we've already sent a "class full" email for this class instance
 * This implements "first failure only" logic for retry notifications
 * Uses recurring_class_id + class_date for deduplication across retries
 */
async function hasClassFullEmailBeenSent(
  userId: string,
  recurringClassId: string,
  classDate: string
): Promise<boolean> {
  try {
    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('notification_log')
      .select('id')
      .eq('user_id', userId)
      .eq('recurring_class_id', recurringClassId)
      .eq('class_date', classDate)
      .eq('notification_type', 'booking_failure_retrying')
      .limit(1);

    if (error) {
      console.error('[Notification] Error checking if class full email sent:', error);
      return false; // Default to allowing email on error
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('[Notification] Exception checking if class full email sent:', error);
    return false; // Default to allowing email on error
  }
}
