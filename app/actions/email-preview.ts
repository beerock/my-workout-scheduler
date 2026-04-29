'use server'

/**
 * Server action for generating email template previews.
 * Used by the admin email preview page.
 *
 * Admin-only: both server actions below call assertAdmin() first to prevent
 * template data from leaking to non-admin users. This is layer 2 of a
 * defense-in-depth setup - layer 1 is the layout.tsx at
 * app/admin/email-preview/layout.tsx which silently redirects non-admins
 * before the page even renders.
 */

import { createClient } from '@/lib/supabase/server'
import { getAdminUserIds } from '@/lib/env-utils'
import { bookingSuccessEmail } from '@/lib/email/templates/booking-success'
import { bookingWaitlistEmail } from '@/lib/email/templates/booking-waitlist'
import { bookingRetrySuccessfulEmail } from '@/lib/email/templates/booking-retry-successful'
import { bookingRetryWaitlistedEmail } from '@/lib/email/templates/booking-retry-waitlisted'
import { bookingFailureCriticalEmail } from '@/lib/email/templates/booking-failure-critical'
import { bookingFailureConfigEmail } from '@/lib/email/templates/booking-failure-config'
import { bookingFailureTechnicalEmail } from '@/lib/email/templates/booking-failure-technical'
import { bookingFailureRetryingEmail } from '@/lib/email/templates/booking-failure-retrying'
import { bookingFailureFinalEmail } from '@/lib/email/templates/booking-failure-final'
import { welcomeEmail } from '@/lib/email/templates/welcome'
import { pauseReminderEmail } from '@/lib/email/templates/pause-reminder'
import { dailyDigestEmail } from '@/lib/email/templates/daily-digest'
import { bookingAlreadyRegisteredEmail } from '@/lib/email/templates/booking-already-registered'
import { bookingAlreadyWaitlistedEmail } from '@/lib/email/templates/booking-already-waitlisted'
import { bookingNoRegistrationEmail } from '@/lib/email/templates/booking-no-registration'
import { waitlistConfirmationEmail } from '@/lib/email/templates/waitlist-confirmation'
import { waitlistInviteEmail } from '@/lib/email/templates/waitlist-invite'

/**
 * Guard for admin-only access to email preview data.
 * Throws 'Unauthorized' if the caller is not logged in or not in ADMIN_USER_IDS.
 */
async function assertAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  const adminUserIds = getAdminUserIds()
  if (!adminUserIds.includes(user.id)) {
    throw new Error('Unauthorized')
  }
}

export type EmailTemplateType =
  | 'welcome'
  | 'pauseReminder'
  | 'bookingSuccess'
  | 'bookingWaitlist'
  | 'bookingAlreadyRegistered'
  | 'bookingAlreadyWaitlisted'
  | 'bookingRetrySuccessful'
  | 'bookingRetryWaitlisted'
  | 'bookingFailureCritical'
  | 'bookingFailureCriticalClassCancelled'
  | 'bookingFailureConfig'
  | 'bookingFailureTechnical'
  | 'bookingFailureTechnicalYmcaSystemError'
  | 'bookingFailureRetrying'
  | 'bookingFailureFinal'
  | 'bookingNoRegistration'
  | 'dailyDigest'
  | 'waitlistConfirmation'
  | 'waitlistInvite'

export type TemplateInfo = {
  name: string
  subject: string
  severity: 'success' | 'warning' | 'error' | 'info'
  html: string
}

const sampleUrls = {
  dashboardUrl: 'https://example.com/dashboard',
  settingsUrl: 'https://example.com/dashboard/account',
  credentialsUrl: 'https://example.com/dashboard/credentials',
  scheduleUrl: 'https://example.com/dashboard/schedule',
}

export async function getEmailTemplatePreview(
  templateType: EmailTemplateType
): Promise<TemplateInfo> {
  await assertAdmin()

  switch (templateType) {
    case 'welcome': {
      const result = welcomeEmail({
        dashboardUrl: sampleUrls.dashboardUrl,
        settingsUrl: sampleUrls.settingsUrl,
        credentialsUrl: sampleUrls.credentialsUrl,
      })
      return {
        name: 'Welcome Email',
        subject: result.subject,
        severity: 'info',
        html: result.html,
      }
    }

    case 'pauseReminder': {
      const result = pauseReminderEmail({
        dashboardUrl: sampleUrls.dashboardUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Pause Reminder (7 days)',
        subject: result.subject,
        severity: 'warning',
        html: result.html,
      }
    }

    case 'bookingSuccess': {
      const result = bookingSuccessEmail({
        className: 'BODYPUMP',
        dayOfWeek: 'Monday',
        date: 'January 13, 2026',
        time: '4:15 PM',
        branchName: 'Downtown YMCA',
        bookingTimestamp: 'Jan 12, 2026, 2:15 PM',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Booking Success',
        subject: result.subject,
        severity: 'success',
        html: result.html,
      }
    }

    case 'bookingWaitlist': {
      const result = bookingWaitlistEmail({
        className: 'Spin Class',
        dayOfWeek: 'Tuesday',
        date: 'January 14, 2026',
        time: '6:00 AM',
        branchName: 'Westside YMCA',
        bookingTimestamp: 'Jan 13, 2026, 4:00 AM',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Booking Waitlisted',
        subject: result.subject,
        severity: 'warning',
        html: result.html,
      }
    }

    case 'bookingAlreadyRegistered': {
      const result = bookingAlreadyRegisteredEmail({
        className: 'BODYPUMP',
        dayOfWeek: 'Monday',
        date: 'January 13, 2026',
        time: '5:00 PM',
        branchName: 'Woodfin YMCA',
        bookingTimestamp: 'Jan 12, 2026, 3:00 PM',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Already Registered',
        subject: result.subject,
        severity: 'success',
        html: result.html,
      }
    }

    case 'bookingAlreadyWaitlisted': {
      const result = bookingAlreadyWaitlistedEmail({
        className: 'Cycle',
        dayOfWeek: 'Wednesday',
        date: 'January 15, 2026',
        time: '7:00 AM',
        branchName: 'Woodfin YMCA',
        bookingTimestamp: 'Jan 14, 2026, 5:00 AM',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Already Waitlisted',
        subject: result.subject,
        severity: 'success',
        html: result.html,
      }
    }

    case 'bookingRetrySuccessful': {
      const result = bookingRetrySuccessfulEmail({
        className: 'Yoga',
        dayOfWeek: 'Wednesday',
        date: 'January 15, 2026',
        time: '5:30 PM',
        branchName: 'Downtown YMCA',
        bookingTimestamp: 'Jan 14, 2026, 3:30 PM',
        retryCount: 3,
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Retry Successful (class was full)',
        subject: result.subject,
        severity: 'success',
        html: result.html,
      }
    }

    case 'bookingRetryWaitlisted': {
      const result = bookingRetryWaitlistedEmail({
        className: 'Yoga',
        dayOfWeek: 'Wednesday',
        date: 'January 15, 2026',
        time: '5:30 PM',
        branchName: 'Downtown YMCA',
        bookingTimestamp: 'Jan 14, 2026, 3:30 PM',
        retryCount: 4,
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Retry Waitlisted (class was full, waitlist opened)',
        subject: result.subject,
        severity: 'warning',
        html: result.html,
      }
    }

    case 'bookingFailureCritical': {
      // Intentionally WITHOUT branchPhone - this is a regression check to
      // verify the template still renders cleanly when phone doesn't apply
      // (login failures, credentials, time conflicts).
      const result = bookingFailureCriticalEmail({
        className: 'BODYPUMP',
        dayOfWeek: 'Monday',
        date: 'January 13, 2026',
        time: '4:15 PM',
        branchName: 'Downtown YMCA',
        errorMessage:
          "We couldn't log into your gym account. Your password may have changed, or there may be an issue with your membership.",
        dashboardUrl: sampleUrls.dashboardUrl,
        credentialsUrl: sampleUrls.credentialsUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Failure - Critical (login failed)',
        subject: result.subject,
        severity: 'error',
        html: result.html,
      }
    }

    case 'bookingFailureCriticalClassCancelled': {
      // Class-cancelled variant WITH branchPhone - verifies the new yellow
      // "call the YMCA to confirm" section renders between the red error
      // box and the support email line.
      const result = bookingFailureCriticalEmail({
        className: 'BODYPUMP',
        dayOfWeek: 'Wednesday',
        date: 'April 15, 2026',
        time: '6:00 PM',
        branchName: 'Hendersonville Family YMCA',
        errorMessage: 'This class has been cancelled by the gym.',
        branchPhone: '(828) 697-9622',
        dashboardUrl: sampleUrls.dashboardUrl,
        credentialsUrl: sampleUrls.credentialsUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Failure - Critical (class cancelled)',
        subject: result.subject,
        severity: 'error',
        html: result.html,
      }
    }

    case 'bookingFailureConfig': {
      const result = bookingFailureConfigEmail({
        className: 'BodyPump',
        dayOfWeek: 'Monday',
        date: 'January 13, 2026',
        time: '4:15 PM',
        branchName: 'Downtown YMCA',
        errorMessage:
          "We couldn't find a class matching your settings. The class may have been cancelled, rescheduled, or renamed.",
        dashboardUrl: sampleUrls.dashboardUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Failure - Configuration (class not found)',
        subject: result.subject,
        severity: 'warning',
        html: result.html,
      }
    }

    case 'bookingFailureTechnical': {
      // Generic variant (default) WITH branchPhone - verifies the new
      // "if it's urgent" phone sub-line appears in the "What happens next"
      // footer while the rest of the template stays unchanged.
      const result = bookingFailureTechnicalEmail({
        className: 'HIIT',
        dayOfWeek: 'Thursday',
        date: 'January 16, 2026',
        time: '7:00 AM',
        branchName: 'Ferguson Family YMCA',
        errorMessage:
          'We encountered a technical issue while trying to book your class. This may be temporary.',
        branchPhone: '(828) 575-2940',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Failure - Technical (unexpected error)',
        subject: result.subject,
        severity: 'warning',
        html: result.html,
      }
    }

    case 'bookingFailureTechnicalYmcaSystemError': {
      // YMCA system error variant - the new variant added in this PR.
      // Verifies the confident travel-agent tone, hero call-to-action box
      // with tappable phone link, and quiet closing footer.
      const result = bookingFailureTechnicalEmail({
        className: 'BODYPUMP HEAVY',
        dayOfWeek: 'Friday',
        date: 'April 10, 2026',
        time: '8:00 AM',
        branchName: 'Woodfin YMCA',
        errorMessage:
          "The YMCA's booking system is having trouble with this class right now - it looks like an issue on their end. We recommend calling the YMCA to let them know, and you can also try booking directly through the YMCA website or app. We'll pick back up automatically for future classes.",
        variant: 'ymca_system_error',
        branchPhone: '(828) 505-3990',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Failure - YMCA System Error',
        subject: result.subject,
        severity: 'warning',
        html: result.html,
      }
    }

    case 'bookingFailureRetrying': {
      const result = bookingFailureRetryingEmail({
        className: 'BODYPUMP',
        dayOfWeek: 'Monday',
        date: 'January 12, 2026',
        time: '4:15 PM',
        branchName: 'Asheville YMCA',
        firstAttemptTime: 'Jan 11, 2026 11:54 PM',
        classStartTime: "Monday, January 12 at 4:15 PM",
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Class Full - Retrying ("We\'ve Got This")',
        subject: result.subject,
        severity: 'info',
        html: result.html,
      }
    }

    case 'bookingFailureFinal': {
      const result = bookingFailureFinalEmail({
        className: 'BODYPUMP',
        dayOfWeek: 'Monday',
        date: 'January 12, 2026',
        time: '4:15 PM',
        branchName: 'Asheville YMCA',
        bookingStartedTime: 'Sunday, January 11 at 2:15 PM',
        stoppedCheckingTime: 'Monday, January 12 at 4:15 PM',
        retryCount: 5,
        branchPhone: '(828) 210-9622',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Retries Exhausted ("Could Not Get You In")',
        subject: result.subject,
        severity: 'warning',
        html: result.html,
      }
    }

    case 'bookingNoRegistration': {
      const result = bookingNoRegistrationEmail({
        className: 'Pickle Ball',
        dayOfWeek: 'Thursday',
        date: 'April 10, 2026',
        time: '1:15 PM',
        branchName: 'Asheville YMCA',
        bookingTimestamp: 'Apr 9, 2026, 11:15 AM',
        branchPhone: '(828) 210-9622',
        dashboardUrl: sampleUrls.dashboardUrl,
        scheduleUrl: sampleUrls.scheduleUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'No Auto-Registration',
        subject: result.subject,
        severity: 'info',
        html: result.html,
      }
    }

    case 'dailyDigest': {
      const result = dailyDigestEmail({
        items: [
          {
            className: 'BODYPUMP',
            time: '4:15 PM',
            date: 'Monday, January 13',
            status: 'confirmed',
          },
          {
            className: 'Spin Class',
            time: '6:00 AM',
            date: 'Tuesday, January 14',
            status: 'waitlisted',
          },
          {
            className: 'Yoga',
            time: '5:30 PM',
            date: 'Wednesday, January 15',
            status: 'confirmed',
          },
          {
            className: 'HIIT',
            time: '7:00 AM',
            date: 'Thursday, January 16',
            status: 'failed',
            errorSummary: 'Class was cancelled',
          },
        ],
        dashboardUrl: sampleUrls.dashboardUrl,
        settingsUrl: sampleUrls.settingsUrl,
      })
      return {
        name: 'Daily Digest (post-MVP)',
        subject: result.subject,
        severity: 'info',
        html: result.html,
      }
    }

    case 'waitlistConfirmation': {
      const result = waitlistConfirmationEmail({
        email: 'new-signup@example.com',
        siteUrl: 'https://myworkout.beerock.com',
      })
      return {
        name: 'Waitlist Confirmation (showcase → coach voice hand-off)',
        subject: result.subject,
        severity: 'info',
        html: result.html,
      }
    }

    case 'waitlistInvite': {
      const result = waitlistInviteEmail({
        email: 'approved-invitee@example.com',
        inviteUrl: 'https://myworkout.beerock.com/auth/callback?code=PREVIEW_PLACEHOLDER&next=%2Fdashboard',
        siteUrl: 'https://myworkout.beerock.com',
      })
      return {
        name: 'Waitlist Invite (branded, replaces Supabase default)',
        subject: result.subject,
        severity: 'info',
        html: result.html,
      }
    }

    default:
      throw new Error(`Unknown template type: ${templateType}`)
  }
}

export async function getAllTemplateTypes(): Promise<
  Array<{ type: EmailTemplateType; name: string; severity: string }>
> {
  await assertAdmin()

  return [
    { type: 'welcome', name: 'Welcome Email', severity: 'info' },
    { type: 'pauseReminder', name: 'Pause Reminder (7 days)', severity: 'warning' },
    { type: 'bookingSuccess', name: 'Booking Success', severity: 'success' },
    { type: 'bookingWaitlist', name: 'Booking Waitlisted', severity: 'warning' },
    { type: 'bookingAlreadyRegistered', name: 'Already Registered', severity: 'success' },
    { type: 'bookingAlreadyWaitlisted', name: 'Already Waitlisted', severity: 'success' },
    { type: 'bookingRetrySuccessful', name: 'Retry Successful', severity: 'success' },
    { type: 'bookingRetryWaitlisted', name: 'Retry Waitlisted', severity: 'warning' },
    { type: 'bookingFailureCritical', name: 'Failure - Critical (login)', severity: 'error' },
    { type: 'bookingFailureCriticalClassCancelled', name: 'Failure - Critical (class cancelled)', severity: 'error' },
    { type: 'bookingFailureConfig', name: 'Failure - Configuration', severity: 'warning' },
    { type: 'bookingFailureTechnical', name: 'Failure - Technical', severity: 'warning' },
    { type: 'bookingFailureTechnicalYmcaSystemError', name: 'Failure - YMCA System Error', severity: 'warning' },
    { type: 'bookingFailureRetrying', name: 'Class Full - Retrying', severity: 'info' },
    { type: 'bookingFailureFinal', name: 'Retries Exhausted', severity: 'warning' },
    { type: 'bookingNoRegistration', name: 'No Auto-Registration', severity: 'info' },
    { type: 'dailyDigest', name: 'Daily Digest (post-MVP)', severity: 'info' },
    { type: 'waitlistConfirmation', name: 'Waitlist Confirmation', severity: 'info' },
    { type: 'waitlistInvite', name: 'Waitlist Invite (branded)', severity: 'info' },
  ]
}
