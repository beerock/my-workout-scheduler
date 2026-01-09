'use server'

/**
 * Server action for generating email template previews.
 * Used by the email preview prototype page.
 */

import { bookingSuccessEmail } from '@/lib/email/templates/booking-success'
import { bookingWaitlistEmail } from '@/lib/email/templates/booking-waitlist'
import { bookingRetrySuccessfulEmail } from '@/lib/email/templates/booking-retry-successful'
import { bookingFailureCriticalEmail } from '@/lib/email/templates/booking-failure-critical'
import { bookingFailureConfigEmail } from '@/lib/email/templates/booking-failure-config'
import { bookingFailureTechnicalEmail } from '@/lib/email/templates/booking-failure-technical'
import { welcomeEmail } from '@/lib/email/templates/welcome'
import { pauseReminderEmail } from '@/lib/email/templates/pause-reminder'
import { dailyDigestEmail } from '@/lib/email/templates/daily-digest'

export type EmailTemplateType =
  | 'welcome'
  | 'pauseReminder'
  | 'bookingSuccess'
  | 'bookingWaitlist'
  | 'bookingRetrySuccessful'
  | 'bookingFailureCritical'
  | 'bookingFailureConfig'
  | 'bookingFailureTechnical'
  | 'dailyDigest'

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
        bookingTimestamp: new Date().toISOString(),
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
        bookingTimestamp: new Date().toISOString(),
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

    case 'bookingRetrySuccessful': {
      const result = bookingRetrySuccessfulEmail({
        className: 'Yoga',
        dayOfWeek: 'Wednesday',
        date: 'January 15, 2026',
        time: '5:30 PM',
        branchName: 'Downtown YMCA',
        bookingTimestamp: new Date().toISOString(),
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

    case 'bookingFailureCritical': {
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
      const result = bookingFailureTechnicalEmail({
        className: 'HIIT',
        dayOfWeek: 'Thursday',
        date: 'January 16, 2026',
        time: '7:00 AM',
        branchName: 'Eastside YMCA',
        errorMessage:
          'We encountered a technical issue while trying to book your class. This may be temporary.',
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

    default:
      throw new Error(`Unknown template type: ${templateType}`)
  }
}

export async function getAllTemplateTypes(): Promise<
  Array<{ type: EmailTemplateType; name: string; severity: string }>
> {
  return [
    { type: 'welcome', name: 'Welcome Email', severity: 'info' },
    { type: 'pauseReminder', name: 'Pause Reminder (7 days)', severity: 'warning' },
    { type: 'bookingSuccess', name: 'Booking Success', severity: 'success' },
    { type: 'bookingWaitlist', name: 'Booking Waitlisted', severity: 'warning' },
    { type: 'bookingRetrySuccessful', name: 'Retry Successful', severity: 'success' },
    { type: 'bookingFailureCritical', name: 'Failure - Critical', severity: 'error' },
    { type: 'bookingFailureConfig', name: 'Failure - Configuration', severity: 'warning' },
    { type: 'bookingFailureTechnical', name: 'Failure - Technical', severity: 'warning' },
    { type: 'dailyDigest', name: 'Daily Digest (post-MVP)', severity: 'info' },
  ]
}
