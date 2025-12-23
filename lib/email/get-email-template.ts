/**
 * Email Template Selector
 *
 * Determines which email template to use based on booking status and error message.
 * Categorizes failures by error type (critical, config, technical) using keyword matching.
 */

import {
  bookingSuccessEmail,
  type BookingSuccessEmailProps,
} from './templates/booking-success';
import {
  bookingWaitlistEmail,
  type BookingWaitlistEmailProps,
} from './templates/booking-waitlist';
import {
  bookingRetrySuccessfulEmail,
  type BookingRetrySuccessfulEmailProps,
} from './templates/booking-retry-successful';
import {
  bookingFailureCriticalEmail,
  type BookingFailureCriticalEmailProps,
} from './templates/booking-failure-critical';
import {
  bookingFailureConfigEmail,
  type BookingFailureConfigEmailProps,
} from './templates/booking-failure-config';
import {
  bookingFailureTechnicalEmail,
  type BookingFailureTechnicalEmailProps,
} from './templates/booking-failure-technical';

export type BookingEmailData = {
  className: string;
  dayOfWeek: string;
  date: string; // Formatted display date
  time: string; // Class time
  branchName: string;
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped';
  errorMessage?: string; // Required if status === 'failed'
  isRetrySuccess?: boolean; // True if this was a successful retry after class was full
  retryCount?: number; // Number of retries before success (if isRetrySuccess)
  bookingTimestamp: string; // When booking was made
  dashboardUrl: string;
  settingsUrl: string;
};

export type EmailTemplate = {
  notificationType:
    | 'booking_success'
    | 'booking_waitlist'
    | 'booking_retry_successful'
    | 'booking_failure_critical'
    | 'booking_failure_config'
    | 'booking_failure_technical';
  subject: string;
  html: string;
};

/**
 * Categorize failure by error message keywords
 */
function categorizeFailure(errorMessage: string): 'critical' | 'config' | 'technical' {
  const message = errorMessage.toLowerCase();

  // Critical errors (user must take action)
  const criticalKeywords = [
    'login failed',
    'class cancelled',
    'class is cancelled',
    'not reservable',
    'time conflict',
    'already have a class',
    'password',
    'credentials',
  ];

  // Configuration errors (wrong settings)
  const configKeywords = [
    'not found',
    'class disappeared',
    'branch selection failed',
    'branch mismatch',
    'wrong class',
    'class name',
  ];

  // Everything else is technical
  const isCritical = criticalKeywords.some(keyword => message.includes(keyword));
  const isConfig = configKeywords.some(keyword => message.includes(keyword));

  if (isCritical) return 'critical';
  if (isConfig) return 'config';
  return 'technical';
}

/**
 * Get appropriate email template based on booking result
 */
export function getEmailTemplate(data: BookingEmailData): EmailTemplate {
  // Success (confirmed booking)
  if (data.status === 'confirmed') {
    // Special template for retry successes
    if (data.isRetrySuccess) {
      const emailData: BookingRetrySuccessfulEmailProps = {
        className: data.className,
        dayOfWeek: data.dayOfWeek,
        date: data.date,
        time: data.time,
        branchName: data.branchName,
        bookingTimestamp: data.bookingTimestamp,
        retryCount: data.retryCount || 1,
        dashboardUrl: data.dashboardUrl,
        settingsUrl: data.settingsUrl,
      };

      const { subject, html } = bookingRetrySuccessfulEmail(emailData);
      return {
        notificationType: 'booking_retry_successful',
        subject,
        html,
      };
    }

    // Standard success template
    const emailData: BookingSuccessEmailProps = {
      className: data.className,
      dayOfWeek: data.dayOfWeek,
      date: data.date,
      time: data.time,
      branchName: data.branchName,
      bookingTimestamp: data.bookingTimestamp,
      dashboardUrl: data.dashboardUrl,
      settingsUrl: data.settingsUrl,
    };

    const { subject, html } = bookingSuccessEmail(emailData);
    return {
      notificationType: 'booking_success',
      subject,
      html,
    };
  }

  // Waitlisted
  if (data.status === 'waitlisted') {
    const emailData: BookingWaitlistEmailProps = {
      className: data.className,
      dayOfWeek: data.dayOfWeek,
      date: data.date,
      time: data.time,
      branchName: data.branchName,
      bookingTimestamp: data.bookingTimestamp,
      dashboardUrl: data.dashboardUrl,
      settingsUrl: data.settingsUrl,
    };

    const { subject, html } = bookingWaitlistEmail(emailData);
    return {
      notificationType: 'booking_waitlist',
      subject,
      html,
    };
  }

  // Failed
  if (data.status === 'failed') {
    if (!data.errorMessage) {
      throw new Error('Error message required for failed bookings');
    }

    const failureType = categorizeFailure(data.errorMessage);

    if (failureType === 'critical') {
      const emailData: BookingFailureCriticalEmailProps = {
        className: data.className,
        dayOfWeek: data.dayOfWeek,
        date: data.date,
        time: data.time,
        branchName: data.branchName,
        errorMessage: data.errorMessage,
        dashboardUrl: data.dashboardUrl,
        settingsUrl: data.settingsUrl,
      };

      const { subject, html } = bookingFailureCriticalEmail(emailData);
      return {
        notificationType: 'booking_failure_critical',
        subject,
        html,
      };
    }

    if (failureType === 'config') {
      const emailData: BookingFailureConfigEmailProps = {
        className: data.className,
        dayOfWeek: data.dayOfWeek,
        date: data.date,
        time: data.time,
        branchName: data.branchName,
        errorMessage: data.errorMessage,
        dashboardUrl: data.dashboardUrl,
        settingsUrl: data.settingsUrl,
      };

      const { subject, html } = bookingFailureConfigEmail(emailData);
      return {
        notificationType: 'booking_failure_config',
        subject,
        html,
      };
    }

    // Technical failure
    const emailData: BookingFailureTechnicalEmailProps = {
      className: data.className,
      dayOfWeek: data.dayOfWeek,
      date: data.date,
      time: data.time,
      branchName: data.branchName,
      errorMessage: data.errorMessage,
      dashboardUrl: data.dashboardUrl,
      settingsUrl: data.settingsUrl,
    };

    const { subject, html } = bookingFailureTechnicalEmail(emailData);
    return {
      notificationType: 'booking_failure_technical',
      subject,
      html,
    };
  }

  // Skipped - should not send email for skipped classes
  throw new Error(`No email template for status: ${data.status}`);
}
