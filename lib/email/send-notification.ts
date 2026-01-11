/**
 * Email Notification Sending Utility
 *
 * Handles sending emails via Resend API with:
 * - Admin toggle support (ADMIN_DISABLE_* env vars for testing)
 * - Logging to notification_log table
 * - Error handling and retry logic
 */

import { Resend } from 'resend';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getEmailConfig } from '@/lib/env-utils';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export type SendEmailParams = {
  to: string; // User email address
  subject: string;
  html: string;
  userId: string;
  bookingAttemptId?: string; // Optional: link to booking attempt
  recurringClassId?: string; // Optional: for deduplication by class instance
  classDate?: string; // Optional: for deduplication by class instance (ISO date string)
  notificationType:
    | 'booking_success'
    | 'booking_waitlist'
    | 'booking_retry_successful'
    | 'booking_failure_critical'
    | 'booking_failure_config'
    | 'booking_failure_technical'
    | 'booking_failure_retrying'
    | 'booking_failure_retrying_4hr'
    | 'welcome'
    | 'first_booking_success'
    | 'credentials_updated'
    | 'daily_digest'
    | 'pause_reminder';
};

export type SendEmailResult = {
  success: boolean;
  resendId?: string; // Resend email ID for tracking
  error?: string;
};

/**
 * Check admin email toggles
 * Returns null if emails are enabled, or error message if disabled
 */
function checkAdminToggles(notificationType: SendEmailParams['notificationType']): string | null {
  // Master kill switch - disables ALL emails
  if (process.env.ADMIN_DISABLE_ALL_EMAILS === 'true') {
    console.log('[ADMIN TOGGLE] All emails disabled via ADMIN_DISABLE_ALL_EMAILS');
    return 'All emails disabled by admin toggle (ADMIN_DISABLE_ALL_EMAILS=true)';
  }

  // Booking email toggle
  const isBookingEmail = notificationType.startsWith('booking_');
  if (isBookingEmail && process.env.ADMIN_DISABLE_BOOKING_EMAILS === 'true') {
    console.log(`[ADMIN TOGGLE] Booking emails disabled via ADMIN_DISABLE_BOOKING_EMAILS (type: ${notificationType})`);
    return 'Booking emails disabled by admin toggle (ADMIN_DISABLE_BOOKING_EMAILS=true)';
  }

  // Error email toggle (failure emails only)
  const isErrorEmail = notificationType.includes('failure');
  if (isErrorEmail && process.env.ADMIN_DISABLE_ERROR_EMAILS === 'true') {
    console.log(`[ADMIN TOGGLE] Error emails disabled via ADMIN_DISABLE_ERROR_EMAILS (type: ${notificationType})`);
    return 'Error emails disabled by admin toggle (ADMIN_DISABLE_ERROR_EMAILS=true)';
  }

  return null; // Emails enabled
}

/**
 * Log notification to database
 */
async function logNotification(params: {
  userId: string;
  bookingAttemptId?: string;
  recurringClassId?: string;
  classDate?: string;
  notificationType: SendEmailParams['notificationType'];
  emailSubject: string;
  emailBody: string;
  deliveryStatus: 'sent' | 'delivered' | 'bounced' | 'failed';
  resendId?: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    // Use service role to bypass RLS for logging
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from('notification_log').insert({
      user_id: params.userId,
      booking_attempt_id: params.bookingAttemptId || null,
      recurring_class_id: params.recurringClassId || null,
      class_date: params.classDate || null,
      notification_type: params.notificationType,
      sent_at: new Date().toISOString(),
      delivery_status: params.deliveryStatus,
      email_subject: params.emailSubject,
      email_body: params.emailBody, // Store full HTML for debugging
      resend_id: params.resendId || null,
      error_message: params.errorMessage || null,
    });

    if (error) {
      console.error('[Email] Failed to log notification to database:', error);
      // Don't throw - logging failure shouldn't block email sending
    }
  } catch (error) {
    console.error('[Email] Exception while logging notification:', error);
    // Don't throw - logging failure shouldn't block email sending
  }
}

/**
 * Send email notification via Resend
 */
export async function sendEmailNotification(params: SendEmailParams): Promise<SendEmailResult> {
  // Check admin toggles first
  const toggleError = checkAdminToggles(params.notificationType);
  if (toggleError) {
    // Log as "failed" with toggle reason
    await logNotification({
      userId: params.userId,
      bookingAttemptId: params.bookingAttemptId,
      recurringClassId: params.recurringClassId,
      classDate: params.classDate,
      notificationType: params.notificationType,
      emailSubject: params.subject,
      emailBody: params.html,
      deliveryStatus: 'failed',
      errorMessage: toggleError,
    });

    return {
      success: true, // Return success to avoid breaking automation
      error: toggleError,
    };
  }

  // Get email config (production vs development sender)
  const emailConfig = getEmailConfig();

  try {
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('[Email] Resend API error:', error);

      // Log failed delivery
      await logNotification({
        userId: params.userId,
        bookingAttemptId: params.bookingAttemptId,
        recurringClassId: params.recurringClassId,
        classDate: params.classDate,
        notificationType: params.notificationType,
        emailSubject: params.subject,
        emailBody: params.html,
        deliveryStatus: 'failed',
        errorMessage: error.message || 'Unknown Resend error',
      });

      return {
        success: false,
        error: error.message || 'Failed to send email via Resend',
      };
    }

    // Log successful delivery
    await logNotification({
      userId: params.userId,
      bookingAttemptId: params.bookingAttemptId,
      recurringClassId: params.recurringClassId,
      classDate: params.classDate,
      notificationType: params.notificationType,
      emailSubject: params.subject,
      emailBody: params.html,
      deliveryStatus: 'sent', // Initially "sent", Resend webhooks can update to "delivered"
      resendId: data?.id,
    });

    console.log(`[Email] Sent ${params.notificationType} email to ${params.to} (Resend ID: ${data?.id})`);

    return {
      success: true,
      resendId: data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Exception while sending email:', error);

    // Log exception
    await logNotification({
      userId: params.userId,
      bookingAttemptId: params.bookingAttemptId,
      recurringClassId: params.recurringClassId,
      classDate: params.classDate,
      notificationType: params.notificationType,
      emailSubject: params.subject,
      emailBody: params.html,
      deliveryStatus: 'failed',
      errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Helper: Get user email using Supabase Auth Admin API
 * Used by notification functions to fetch recipient email
 * REQUIRES service role client for auth.admin access
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    // Must use service role client for auth.admin API
    const supabase = createServiceRoleClient();

    // Use auth.admin.getUserById() - requires service role
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data?.user?.email) {
      console.error(`[Email] Failed to fetch email for user ${userId}:`, error);
      return null;
    }

    return data.user.email;
  } catch (error) {
    console.error(`[Email] Exception while fetching user email:`, error);
    return null;
  }
}
