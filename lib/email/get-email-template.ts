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
import {
  bookingAlreadyRegisteredEmail,
  type BookingAlreadyRegisteredEmailProps,
} from './templates/booking-already-registered';
import {
  bookingAlreadyWaitlistedEmail,
  type BookingAlreadyWaitlistedEmailProps,
} from './templates/booking-already-waitlisted';
import {
  bookingNoRegistrationEmail,
  type BookingNoRegistrationEmailProps,
} from './templates/booking-no-registration';
import { getBranchPhone } from '@/lib/constants/ymca';

export type BookingEmailData = {
  className: string;
  dayOfWeek: string;
  date: string; // Formatted display date
  time: string; // Class time
  branchName: string;
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped' | 'no_registration';
  errorMessage?: string; // Required if status === 'failed'
  alreadyBooked?: boolean; // True if user was already registered/waitlisted (no new action taken)
  isRetrySuccess?: boolean; // True if this was a successful retry after class was full
  isRetryExhausted?: boolean; // True if all retries failed and class time arrived
  retryCount?: number; // Number of retries (for success or exhausted scenarios)
  bookingTimestamp: string; // When booking was made
  firstAttemptTime?: string; // When we first tried to book (for retrying emails) - legacy
  classStartTime?: string; // When the class starts (for retrying emails) - legacy
  bookingStartedTime?: string; // When we started trying to book (for final/exhausted emails)
  stoppedCheckingTime?: string; // When we stopped checking (for final/exhausted emails)
  dashboardUrl: string;
  scheduleUrl: string; // Link to schedule page (CTA destination for success/waitlist/retry/technical)
  credentialsUrl: string; // Link to credentials page (CTA destination for login-related errors)
  settingsUrl: string;
};

export type EmailTemplate = {
  notificationType:
    | 'booking_success'
    | 'booking_waitlist'
    | 'booking_already_registered'
    | 'booking_already_waitlisted'
    | 'booking_retry_successful'
    | 'booking_failure_critical'
    | 'booking_failure_config'
    | 'booking_failure_technical'
    | 'booking_failure_retrying'
    | 'booking_failure_final'
    | 'booking_no_registration';
  subject: string;
  html: string;
};

/**
 * Detect the class-cancelled subset of critical errors. Used to gate whether
 * we pass a branch phone number to the critical template - calling the front
 * desk is useful for confirming a cancellation, but doesn't help with login
 * failures, credentials issues, or time conflicts.
 */
function isClassCancelledError(errorMessage: string): boolean {
  const msg = errorMessage.toLowerCase();
  return msg.includes('class cancelled') ||
    msg.includes('class is cancelled') ||
    msg.includes('class has been cancelled') ||
    msg.includes('class has been canceled');
}

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
  // No online registration (drop-in, special program, paid, etc.)
  if (data.status === 'no_registration') {
    const emailData: BookingNoRegistrationEmailProps = {
      className: data.className,
      dayOfWeek: data.dayOfWeek,
      date: data.date,
      time: data.time,
      branchName: data.branchName,
      bookingTimestamp: data.bookingTimestamp,
      branchPhone: getBranchPhone(data.branchName) ?? undefined,
      dashboardUrl: data.dashboardUrl,
      scheduleUrl: data.scheduleUrl,
      settingsUrl: data.settingsUrl,
    };

    const { subject, html } = bookingNoRegistrationEmail(emailData);
    return {
      notificationType: 'booking_no_registration',
      subject,
      html,
    };
  }

  // Already registered (detected on class details page - no new action taken)
  if (data.status === 'confirmed' && data.alreadyBooked) {
    const emailData: BookingAlreadyRegisteredEmailProps = {
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

    const { subject, html } = bookingAlreadyRegisteredEmail(emailData);
    return {
      notificationType: 'booking_already_registered',
      subject,
      html,
    };
  }

  // Already on waitlist (detected on class details page - no new action taken)
  if (data.status === 'waitlisted' && data.alreadyBooked) {
    const emailData: BookingAlreadyWaitlistedEmailProps = {
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

    const { subject, html } = bookingAlreadyWaitlistedEmail(emailData);
    return {
      notificationType: 'booking_already_waitlisted',
      subject,
      html,
    };
  }

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
        bookingStartedTime: data.bookingStartedTime || data.firstAttemptTime || data.bookingTimestamp,
        stoppedCheckingTime: data.stoppedCheckingTime || data.classStartTime || 'class start time',
        retryCount: data.retryCount || 1,
        branchPhone: getBranchPhone(data.branchName) ?? undefined,
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
      // Only pass phone for class-cancelled errors - login/credentials/time
      // conflicts don't benefit from phone. The template renders the "call
      // the YMCA to confirm" section only when branchPhone is provided.
      const branchPhone = isClassCancelledError(data.errorMessage)
        ? (getBranchPhone(data.branchName) ?? undefined)
        : undefined;

      const emailData: BookingFailureCriticalEmailProps = {
        className: data.className,
        dayOfWeek: data.dayOfWeek,
        date: data.date,
        time: data.time,
        branchName: data.branchName,
        errorMessage: data.errorMessage,
        branchPhone,
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
    // Detect the YMCA system error variant via the routing marker phrase
    // "booking system" in the errorMessage (emitted by scripts/booking-automation.ts
    // when GroupExPro returns "Unable to reserve a spot" / "Unable to join the waitlist").
    // Phone is passed for BOTH variants - the template decides its prominence.
    const isYmcaSystemError = data.errorMessage.toLowerCase().includes('booking system');
    const emailData: BookingFailureTechnicalEmailProps = {
      className: data.className,
      dayOfWeek: data.dayOfWeek,
      date: data.date,
      time: data.time,
      branchName: data.branchName,
      errorMessage: data.errorMessage,
      variant: isYmcaSystemError ? 'ymca_system_error' : 'generic',
      branchPhone: getBranchPhone(data.branchName) ?? undefined,
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
