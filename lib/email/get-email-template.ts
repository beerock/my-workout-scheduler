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
import {
  bookingFailureRetryingEmail,
  type BookingFailureRetryingEmailProps,
} from './templates/booking-failure-retrying';
import {
  bookingFailureFinalEmail,
  type BookingFailureFinalEmailProps,
} from './templates/booking-failure-final';

export type BookingEmailData = {
  className: string;
  dayOfWeek: string;
  date: string; // Formatted display date
  time: string; // Class time
  branchName: string;
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped';
  errorMessage?: string; // Required if status === 'failed'
  isRetrySuccess?: boolean; // True if this was a successful retry after class was full
  isRetryExhausted?: boolean; // True if all retries failed and class time arrived
  retryCount?: number; // Number of retries (for success or exhausted scenarios)
  bookingTimestamp: string; // When booking was made
  firstAttemptTime?: string; // When we first tried to book (for retrying emails)
  classStartTime?: string; // When the class starts (for retrying emails)
  dashboardUrl: string;
  scheduleUrl: string; // Link to schedule page (CTA destination for success/waitlist/retry/technical)
  credentialsUrl: string; // Link to credentials page (CTA destination for login-related errors)
  settingsUrl: string;
};

export type EmailTemplate = {
  notificationType:
    | 'booking_success'
    | 'booking_waitlist'
    | 'booking_retry_successful'
    | 'booking_failure_critical'
    | 'booking_failure_config'
    | 'booking_failure_technical'
    | 'booking_failure_retrying'
    | 'booking_failure_final';
  subject: string;
  html: string;
};

/**
 * Categorize failure by error message keywords
 */
function categorizeFailure(errorMessage: string): 'critical' | 'config' | 'retrying' | 'technical' {
  const message = errorMessage.toLowerCase();

  // Retrying errors (class full, system will retry automatically)
  // Check this FIRST before other categories
  const retryingKeywords = [
    'full',
    'no spots',
    'no waitlist option',
  ];

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

  // Check retrying first - this is the most specific case
  const isRetrying = retryingKeywords.some(keyword => message.includes(keyword));
  const isCritical = criticalKeywords.some(keyword => message.includes(keyword));
  const isConfig = configKeywords.some(keyword => message.includes(keyword));

  if (isRetrying) return 'retrying';
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
        scheduleUrl: data.scheduleUrl,
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
      scheduleUrl: data.scheduleUrl,
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
      scheduleUrl: data.scheduleUrl,
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

    // Special case: retries exhausted (class time arrived, couldn't book)
    if (data.isRetryExhausted) {
      const emailData: BookingFailureFinalEmailProps = {
        className: data.className,
        dayOfWeek: data.dayOfWeek,
        date: data.date,
        time: data.time,
        branchName: data.branchName,
        firstAttemptTime: data.firstAttemptTime || data.bookingTimestamp,
        classStartTime: data.classStartTime || 'class start time',
        retryCount: data.retryCount || 1,
        dashboardUrl: data.dashboardUrl,
        scheduleUrl: data.scheduleUrl,
        settingsUrl: data.settingsUrl,
      };

      const { subject, html } = bookingFailureFinalEmail(emailData);
      return {
        notificationType: 'booking_failure_final',
        subject,
        html,
      };
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
        credentialsUrl: data.credentialsUrl,
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

    if (failureType === 'retrying') {
      const emailData: BookingFailureRetryingEmailProps = {
        className: data.className,
        dayOfWeek: data.dayOfWeek,
        date: data.date,
        time: data.time,
        branchName: data.branchName,
        firstAttemptTime: data.firstAttemptTime || data.bookingTimestamp,
        classStartTime: data.classStartTime || 'class start time',
        dashboardUrl: data.dashboardUrl,
        scheduleUrl: data.scheduleUrl,
        settingsUrl: data.settingsUrl,
      };

      const { subject, html } = bookingFailureRetryingEmail(emailData);
      return {
        notificationType: 'booking_failure_retrying',
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
      scheduleUrl: data.scheduleUrl,
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
