/**
 * Notification Email Test Script
 *
 * Sends test notification emails to verify templates and Resend integration
 *
 * Usage:
 *   npx tsx test-notification-emails.ts your@email.com           # Send all templates
 *   npx tsx test-notification-emails.ts your@email.com welcome   # Send specific template
 *
 * Available templates:
 *   - welcome
 *   - pause-reminder
 *   - booking-success
 *   - booking-waitlist
 *   - booking-retry-successful
 *   - booking-failure-critical
 *   - booking-failure-config
 *   - booking-failure-technical
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import { Resend } from 'resend'
import { getResendApiKey, getEmailConfig, getSiteUrl } from './lib/env-utils'

// Import email templates
import { welcomeEmail } from './lib/email/templates/welcome'
import { pauseReminderEmail } from './lib/email/templates/pause-reminder'
import { bookingSuccessEmail } from './lib/email/templates/booking-success'
import { bookingWaitlistEmail } from './lib/email/templates/booking-waitlist'
import { bookingRetrySuccessfulEmail } from './lib/email/templates/booking-retry-successful'
import { bookingFailureCriticalEmail } from './lib/email/templates/booking-failure-critical'
import { bookingFailureConfigEmail } from './lib/email/templates/booking-failure-config'
import { bookingFailureTechnicalEmail } from './lib/email/templates/booking-failure-technical'

// Get CLI arguments
const recipientEmail = process.argv[2]
const specificTemplate = process.argv[3]

if (!recipientEmail) {
  console.error('Error: Please provide a recipient email address')
  console.log('\nUsage:')
  console.log('  npx tsx test-notification-emails.ts your@email.com           # Send all templates')
  console.log('  npx tsx test-notification-emails.ts your@email.com welcome   # Send specific template')
  console.log('\nAvailable templates:')
  console.log('  welcome, pause-reminder, booking-success, booking-waitlist,')
  console.log('  booking-retry-successful, booking-failure-critical,')
  console.log('  booking-failure-config, booking-failure-technical')
  process.exit(1)
}

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(recipientEmail)) {
  console.error('Error: Invalid email address format')
  process.exit(1)
}

// Sample data for testing (matches actual template prop interfaces)
const sampleBookingData = {
  className: 'BODYPUMP',
  dayOfWeek: 'Monday',
  date: 'Monday, January 13, 2025',
  time: '4:15 PM',
  branchName: 'Downtown YMCA',
  bookingTimestamp: new Date().toLocaleString(),
}

// Build URLs
const appUrl = getSiteUrl()
const dashboardUrl = `${appUrl}/dashboard`
const scheduleUrl = `${appUrl}/dashboard/schedule`
const credentialsUrl = `${appUrl}/dashboard/credentials`
const settingsUrl = `${appUrl}/dashboard/account`

// Define all templates
const templates: Record<string, { name: string; generate: () => { subject: string; html: string } }> = {
  'welcome': {
    name: 'Welcome Email',
    generate: () => welcomeEmail({ dashboardUrl, settingsUrl, credentialsUrl }),
  },
  'pause-reminder': {
    name: 'Pause Reminder',
    generate: () => pauseReminderEmail({ dashboardUrl, settingsUrl }),
  },
  'booking-success': {
    name: 'Booking Success',
    generate: () => bookingSuccessEmail({
      ...sampleBookingData,
      dashboardUrl,
      scheduleUrl,
      settingsUrl,
    }),
  },
  'booking-waitlist': {
    name: 'Booking Waitlist',
    generate: () => bookingWaitlistEmail({
      className: 'Spin Class',
      dayOfWeek: 'Tuesday',
      date: 'Tuesday, January 14, 2025',
      time: '6:00 AM',
      branchName: 'Westside YMCA',
      bookingTimestamp: new Date().toLocaleString(),
      dashboardUrl,
      scheduleUrl,
      settingsUrl,
    }),
  },
  'booking-retry-successful': {
    name: 'Retry Successful',
    generate: () => bookingRetrySuccessfulEmail({
      className: 'Yoga',
      dayOfWeek: 'Wednesday',
      date: 'Wednesday, January 15, 2025',
      time: '5:30 PM',
      branchName: 'Downtown YMCA',
      bookingTimestamp: new Date().toLocaleString(),
      retryCount: 5,
      dashboardUrl,
      scheduleUrl,
      settingsUrl,
    }),
  },
  'booking-failure-critical': {
    name: 'Failure - Critical',
    generate: () => bookingFailureCriticalEmail({
      ...sampleBookingData,
      errorMessage: 'We couldn\'t log into your gym account. Your password may have changed or your membership may have expired.',
      dashboardUrl,
      credentialsUrl,
      settingsUrl,
    }),
  },
  'booking-failure-config': {
    name: 'Failure - Configuration',
    generate: () => bookingFailureConfigEmail({
      ...sampleBookingData,
      errorMessage: 'We couldn\'t find a class matching your settings. The class may have been cancelled or rescheduled.',
      dashboardUrl,
      settingsUrl,
    }),
  },
  'booking-failure-technical': {
    name: 'Failure - Technical',
    generate: () => bookingFailureTechnicalEmail({
      className: 'HIIT',
      dayOfWeek: 'Thursday',
      date: 'Thursday, January 16, 2025',
      time: '7:00 AM',
      branchName: 'Eastside YMCA',
      errorMessage: 'We encountered a temporary technical issue. We\'ll automatically retry this booking.',
      dashboardUrl,
      scheduleUrl,
      settingsUrl,
    }),
  },
}

console.log('='.repeat(80))
console.log('Notification Email Test')
console.log('='.repeat(80))
console.log()

async function sendEmail(templateKey: string, template: typeof templates[string]) {
  try {
    const apiKey = getResendApiKey()
    const { fromEmail, fromName } = getEmailConfig()
    const resend = new Resend(apiKey)

    const { subject, html } = template.generate()

    console.log(`Sending: ${template.name}...`)

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      html,
    })

    if (error) {
      console.error(`  Failed: ${error.message}`)
      return false
    }

    console.log(`  Sent! ID: ${data?.id}`)
    return true
  } catch (error) {
    console.error(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function main() {
  const { fromEmail, fromName } = getEmailConfig()

  console.log('Email Configuration:')
  console.log(`  From: ${fromName} <${fromEmail}>`)
  console.log(`  To: ${recipientEmail}`)
  console.log(`  App URL: ${appUrl}`)
  console.log()

  let templatesToSend: [string, typeof templates[string]][]

  if (specificTemplate) {
    if (!templates[specificTemplate]) {
      console.error(`Error: Unknown template "${specificTemplate}"`)
      console.log('\nAvailable templates:')
      Object.keys(templates).forEach((key) => console.log(`  - ${key}`))
      process.exit(1)
    }
    templatesToSend = [[specificTemplate, templates[specificTemplate]]]
    console.log(`Sending 1 template: ${specificTemplate}`)
  } else {
    templatesToSend = Object.entries(templates)
    console.log(`Sending all ${templatesToSend.length} templates...`)
  }

  console.log()

  let successCount = 0
  let failCount = 0

  for (const [key, template] of templatesToSend) {
    const success = await sendEmail(key, template)
    if (success) {
      successCount++
    } else {
      failCount++
    }

    // Small delay between emails to avoid rate limiting
    if (templatesToSend.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log()
  console.log('='.repeat(80))
  console.log(`Results: ${successCount} sent, ${failCount} failed`)
  console.log()
  console.log('Check your inbox (and spam folder) for test emails.')
  console.log('Subject lines are prefixed with [TEST] for easy identification.')
  console.log('='.repeat(80))
}

main()
