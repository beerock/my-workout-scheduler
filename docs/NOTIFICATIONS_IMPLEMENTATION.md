# Notification System Implementation Guide

**Last Updated:** November 28, 2025 (v2.10)

This document provides step-by-step instructions for implementing the user notification system for booking results.

> **⚠️ Note:** There is a previous implementation attempt on branch
> `claude/email-booking-notifications-01Dzs7tw6eGn5MsdqbSoJpMA`
> from the session "Add email notifications for booking results".
>
> **Before implementing:** Review that branch to see if any code can be
> reused or if there are conflicts to resolve. This design may supersede
> or complement that work.
>
> **Recommended approach:** Use that branch as the implementation branch,
> updating it to follow this design document.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Database Setup](#phase-1-database-setup)
4. [Phase 2: Email Service Integration](#phase-2-email-service-integration)
5. [Phase 3: Notification Logic](#phase-3-notification-logic)
6. [Phase 4: User Preferences UI](#phase-4-user-preferences-ui)
7. [Phase 5: Testing](#phase-5-testing)
8. [Phase 6: Deployment](#phase-6-deployment)
9. [Rollback Plan](#rollback-plan)

---

## Overview

### What We're Building

A comprehensive notification system that:
- Sends email notifications for booking results
- Respects user preferences (immediate, daily digest, critical only)
- Categorizes errors by severity (no action, action recommended, action required)
- Uses user-friendly error messages from `ERROR_MESSAGES.md`
- Tracks notification delivery status
- Supports batching to avoid spam

### Architecture

```
Booking Attempt (Inngest/Puppeteer)
          ↓
Update booking_attempts table
          ↓
Trigger notification function
          ↓
Check user preferences
          ↓
    /           \
Immediate    Daily Digest
   ↓              ↓
Send email   Queue for batch
   ↓              ↓
Update notification_log
```

### Estimated Timeline

- **Phase 1-2:** 2-3 hours (database + email setup)
- **Phase 3:** 4-6 hours (notification logic + templates)
- **Phase 4:** 2-3 hours (user preferences UI)
- **Phase 5:** 2-3 hours (testing)
- **Total:** ~12-15 hours (2 days)

---

## Prerequisites

### Required
- ✅ Resend API key configured (`RESEND_API_KEY` env var)
- ✅ Production email domain verified (`noreply@beerock.com`)
- ✅ Supabase service role key for database access
- ✅ Access to Inngest dashboard
- ✅ Node.js 18+ with TypeScript

### Nice to Have
- Email testing tool (mail-tester.com, Mailtrap, etc.)
- Postman or similar for API testing
- Access to multiple email clients for testing (Gmail, Outlook, Apple Mail)

---

## Phase 1: Database Setup

### Step 1.1: Create Migration File

Create: `supabase/migrations/010_notification_system.sql`

```sql
-- Migration: Add notification system tables and preferences
-- Version: 2.10
-- Date: 2025-11-28

-- ========================================
-- Part 1: Add notification preferences to user_settings
-- ========================================

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily_digest', 'critical_only', 'off')),
ADD COLUMN IF NOT EXISTS email_on_success BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_on_waitlist BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_on_failure BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_on_retry BOOLEAN DEFAULT TRUE, -- First failure only
ADD COLUMN IF NOT EXISTS daily_digest_time TIME DEFAULT '08:00:00', -- Local time for digest
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York'; -- For digest scheduling

-- ========================================
-- Part 2: Create notification_log table
-- ========================================

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_attempt_id UUID REFERENCES booking_attempts(id) ON DELETE SET NULL,

  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms')),
  notification_category TEXT NOT NULL CHECK (notification_category IN ('success', 'waitlist', 'failure', 'retry', 'digest')),
  subject TEXT NOT NULL,

  -- Delivery tracking
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,

  -- Metadata
  template_used TEXT, -- Template name for debugging
  variables JSONB, -- Template variables for debugging

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_attempt_id ON notification_log(booking_attempt_id);

-- ========================================
-- Part 3: Row Level Security (RLS)
-- ========================================

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert notifications (Inngest/server)
CREATE POLICY "Service role can insert notifications"
  ON notification_log FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway

-- ========================================
-- Part 4: Create digest queue table (for batching)
-- ========================================

CREATE TABLE IF NOT EXISTS notification_digest_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_attempt_id UUID NOT NULL REFERENCES booking_attempts(id) ON DELETE CASCADE,

  -- Queue status
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for queue processing
CREATE INDEX IF NOT EXISTS idx_digest_queue_user_processed ON notification_digest_queue(user_id, processed);
CREATE INDEX IF NOT EXISTS idx_digest_queue_queued_at ON notification_digest_queue(queued_at);

-- ========================================
-- Part 5: RLS for digest queue
-- ========================================

ALTER TABLE notification_digest_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Service role only (users don't need direct access)
CREATE POLICY "Service role can manage digest queue"
  ON notification_digest_queue FOR ALL
  USING (true);

-- ========================================
-- Part 6: Add helpful comments
-- ========================================

COMMENT ON TABLE notification_log IS 'Tracks all notifications sent to users (email, SMS)';
COMMENT ON TABLE notification_digest_queue IS 'Queue for batching notifications into daily digest emails';

COMMENT ON COLUMN user_settings.notification_frequency IS 'How often to send notifications: immediate, daily_digest, critical_only, off';
COMMENT ON COLUMN user_settings.daily_digest_time IS 'Local time (HH:MM:SS) to send daily digest email';
```

### Step 1.2: Run Migration Locally

```bash
# Apply migration to local Supabase
npx supabase migration up

# Verify tables created
npx supabase db diff
```

### Step 1.3: Verify Schema

```sql
-- Check user_settings columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
  AND column_name LIKE 'notification%';

-- Check notification_log table
\d notification_log

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('notification_log', 'notification_digest_queue');
```

---

## Phase 2: Email Service Integration

### Step 2.1: Create Email Utility Functions

Create: `lib/email/send-notification.ts`

```typescript
/**
 * Email notification service using Resend
 */

import { Resend } from 'resend'
import { getEmailConfig } from '@/lib/env-utils'

const resend = new Resend(process.env.RESEND_API_KEY)

export type NotificationCategory = 'success' | 'waitlist' | 'failure' | 'retry' | 'digest'

export type EmailNotificationParams = {
  to: string
  category: NotificationCategory
  subject: string
  html: string
  variables?: Record<string, any> // For logging/debugging
  bookingAttemptId?: string
}

/**
 * Send email notification to user
 */
export async function sendEmailNotification(params: EmailNotificationParams): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    const { fromEmail, fromName } = getEmailConfig()

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      console.error('Resend API error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data?.id) {
      return {
        success: false,
        error: 'No message ID returned from Resend',
      }
    }

    return {
      success: true,
      messageId: data.id,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Log notification in database for tracking
 */
export async function logNotification(params: {
  userId: string
  bookingAttemptId: string | null
  notificationType: 'email' | 'sms'
  notificationCategory: NotificationCategory
  subject: string
  deliveryStatus: 'sent' | 'failed'
  errorMessage?: string
  templateUsed?: string
  variables?: Record<string, any>
}): Promise<void> {
  // Import dynamically to avoid circular dependencies
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const { error } = await supabase
    .from('notification_log')
    .insert({
      user_id: params.userId,
      booking_attempt_id: params.bookingAttemptId,
      notification_type: params.notificationType,
      notification_category: params.notificationCategory,
      subject: params.subject,
      delivery_status: params.deliveryStatus,
      error_message: params.errorMessage,
      template_used: params.templateUsed,
      variables: params.variables,
    })

  if (error) {
    console.error('Error logging notification:', error)
    // Don't throw - logging failure shouldn't break notification flow
  }
}
```

### Step 2.2: Create Email Templates

Create: `lib/email/templates/booking-success.ts`

```typescript
/**
 * Email template: Booking Success
 */

export type BookingSuccessVariables = {
  className: string
  dayOfWeek: string
  date: string
  time: string
  branchName: string
  bookingTimestamp: string
  dashboardUrl: string
}

export function bookingSuccessTemplate(vars: BookingSuccessVariables): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Success Banner -->
  <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 28px;">✅ You're In!</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <p style="font-size: 16px; color: #1f2937; margin-bottom: 15px;">
      <strong>Great news!</strong> We successfully booked your class:
    </p>

    <div style="background-color: white; padding: 15px; border-left: 4px solid #10b981; margin-bottom: 15px;">
      <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #1f2937;">
        ${vars.className}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        ${vars.dayOfWeek}, ${vars.date} at ${vars.time}
      </p>
      <p style="margin: 5px 0; color: #6b7280;">
        📍 ${vars.branchName}
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
      Booked at: ${vars.bookingTimestamp}
    </p>
  </div>

  <!-- What's Next -->
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">What's next?</h2>
    <ul style="color: #4b5563; line-height: 1.6;">
      <li>Show up at ${vars.time} on ${vars.dayOfWeek}</li>
      <li>Check your gym account to confirm the reservation</li>
      <li>We'll automatically book this class again next week (if active)</li>
    </ul>
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="${vars.dashboardUrl}"
       style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      View Booking History
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>
      <a href="${vars.dashboardUrl}/schedule" style="color: #3b82f6;">Manage Schedule</a> •
      <a href="${vars.dashboardUrl}/settings" style="color: #3b82f6;">Notification Preferences</a>
    </p>
    <p style="margin-top: 10px;">
      My Workout Scheduler - Automated Class Booking
    </p>
  </div>

</body>
</html>
  `.trim()
}
```

Create similar template files for:
- `booking-waitlist.ts`
- `booking-failure.ts` (with categorized templates for each failure type)
- `booking-retry.ts`
- `daily-digest.ts`

### Step 2.3: Create Template Selector

Create: `lib/email/get-email-template.ts`

```typescript
/**
 * Get appropriate email template based on booking result
 */

import { bookingSuccessTemplate, type BookingSuccessVariables } from './templates/booking-success'
// ... import other templates

export type GetEmailTemplateParams = {
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
  errorMessage?: string | null
  className: string
  dayOfWeek: string
  date: string
  time: string
  branchName: string
  bookingTimestamp: string
  dashboardUrl: string
}

export function getEmailTemplate(params: GetEmailTemplateParams): {
  subject: string
  html: string
  category: 'success' | 'waitlist' | 'failure' | 'retry'
  templateName: string
} {
  const { status, errorMessage } = params

  // Success
  if (status === 'confirmed') {
    return {
      subject: `✅ Booked! ${params.className} on ${params.dayOfWeek} at ${params.time}`,
      html: bookingSuccessTemplate({
        className: params.className,
        dayOfWeek: params.dayOfWeek,
        date: params.date,
        time: params.time,
        branchName: params.branchName,
        bookingTimestamp: params.bookingTimestamp,
        dashboardUrl: params.dashboardUrl,
      }),
      category: 'success',
      templateName: 'booking-success',
    }
  }

  // Waitlist
  if (status === 'waitlisted') {
    // ... use waitlist template
  }

  // Failed - categorize by error message
  if (status === 'failed' && errorMessage) {
    // Check error message to determine which failure template to use
    const errorLower = errorMessage.toLowerCase()

    // Class full (retrying)
    if (errorLower.includes('full')) {
      // Use retry template
      return {
        subject: `🔄 Class Full - We're Keeping an Eye Out for You`,
        html: bookingRetryTemplate({ /* ... */ }),
        category: 'retry',
        templateName: 'booking-retry',
      }
    }

    // Login failed
    if (errorLower.includes('login failed')) {
      // Use login-failed template
    }

    // Class cancelled
    if (errorLower.includes('cancelled')) {
      // Use cancelled template
    }

    // Class not found
    if (errorLower.includes('not found')) {
      // Use not-found template
    }

    // ... etc for other failure types
  }

  // Default failure template
  return {
    subject: `⚠️ Booking Failed - ${params.className}`,
    html: bookingFailureTemplate({ /* ... */ }),
    category: 'failure',
    templateName: 'booking-failure-generic',
  }
}
```

---

## Phase 3: Notification Logic

### Step 3.1: Create Notification Function

Create: `lib/notifications/send-booking-notification.ts`

```typescript
/**
 * Send notification for booking attempt based on user preferences
 */

import { createClient } from '@/lib/supabase/server'
import { sendEmailNotification, logNotification } from '@/lib/email/send-notification'
import { getEmailTemplate } from '@/lib/email/get-email-template'

export async function sendBookingNotification(params: {
  userId: string
  bookingAttemptId: string
  status: 'confirmed' | 'waitlisted' | 'failed' | 'skipped'
  errorMessage?: string | null
  className: string
  dayOfWeek: string
  date: string
  time: string
  branchName: string
}): Promise<void> {
  const supabase = createClient()

  // Step 1: Get user email and preferences
  const { data: user } = await supabase.auth.admin.getUserById(params.userId)
  if (!user || !user.email) {
    console.error('User not found or no email:', params.userId)
    return
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', params.userId)
    .single()

  if (!settings) {
    console.error('User settings not found:', params.userId)
    return
  }

  // Step 2: Check if notifications are enabled
  if (!settings.notification_email || settings.notification_frequency === 'off') {
    console.log('Notifications disabled for user:', params.userId)
    return
  }

  // Step 3: Check frequency preferences
  const isSuccess = params.status === 'confirmed'
  const isWaitlist = params.status === 'waitlisted'
  const isFailure = params.status === 'failed'
  const isRetrying = isFailure && params.errorMessage?.toLowerCase().includes('full')

  // Critical only: only send for login failed, cancelled, etc.
  if (settings.notification_frequency === 'critical_only') {
    const isCritical = isFailure && (
      params.errorMessage?.toLowerCase().includes('login failed') ||
      params.errorMessage?.toLowerCase().includes('cancelled') ||
      params.errorMessage?.toLowerCase().includes('time conflict')
    )
    if (!isCritical) {
      console.log('Skipping non-critical notification for user:', params.userId)
      return
    }
  }

  // Daily digest: queue for batch sending
  if (settings.notification_frequency === 'daily_digest') {
    await supabase
      .from('notification_digest_queue')
      .insert({
        user_id: params.userId,
        booking_attempt_id: params.bookingAttemptId,
      })
    console.log('Queued notification for daily digest:', params.userId)
    return
  }

  // Immediate: send now
  // Check individual preferences
  if (isSuccess && !settings.email_on_success) return
  if (isWaitlist && !settings.email_on_waitlist) return
  if (isFailure && !isRetrying && !settings.email_on_failure) return
  if (isRetrying && !settings.email_on_retry) return

  // Step 4: Get email template
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-workout-scheduler.vercel.app'
  const bookingTimestamp = new Date().toLocaleString('en-US', {
    timeZone: settings.timezone || 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const template = getEmailTemplate({
    status: params.status,
    errorMessage: params.errorMessage,
    className: params.className,
    dayOfWeek: params.dayOfWeek,
    date: params.date,
    time: params.time,
    branchName: params.branchName,
    bookingTimestamp,
    dashboardUrl,
  })

  // Step 5: Send email
  const result = await sendEmailNotification({
    to: user.email,
    category: template.category,
    subject: template.subject,
    html: template.html,
    variables: params,
    bookingAttemptId: params.bookingAttemptId,
  })

  // Step 6: Log notification
  await logNotification({
    userId: params.userId,
    bookingAttemptId: params.bookingAttemptId,
    notificationType: 'email',
    notificationCategory: template.category,
    subject: template.subject,
    deliveryStatus: result.success ? 'sent' : 'failed',
    errorMessage: result.error,
    templateUsed: template.templateName,
    variables: params,
  })

  if (!result.success) {
    console.error('Failed to send notification:', result.error)
  } else {
    console.log('Notification sent successfully:', result.messageId)
  }
}
```

### Step 3.2: Integrate with Booking Flow

Update: `inngest/bookClass.ts` (or wherever booking results are written)

```typescript
// After writing booking attempt to database
await sendBookingNotification({
  userId: recurringClass.user_id,
  bookingAttemptId: bookingAttempt.id,
  status: result.status,
  errorMessage: result.errorMessage,
  className: recurringClass.class_type,
  dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][recurringClass.day_of_week],
  date: classDate.toLocaleDateString(),
  time: recurringClass.class_time,
  branchName: result.branchUsed || recurringClass.branch,
})
```

### Step 3.3: Create Daily Digest Function

Create: `inngest/functions/sendDailyDigest.ts`

```typescript
/**
 * Inngest function: Send daily digest emails
 * Runs at 8 AM in each user's timezone
 */

import { inngest } from '@/lib/inngest/client'
import { createClient } from '@/lib/supabase/server'
import { sendEmailNotification, logNotification } from '@/lib/email/send-notification'
import { dailyDigestTemplate } from '@/lib/email/templates/daily-digest'

export const sendDailyDigest = inngest.createFunction(
  { id: 'send-daily-digest' },
  { cron: '0 * * * *' }, // Run every hour to catch all timezones
  async ({ step }) => {
    const supabase = createClient()

    // Get all users with daily digest enabled
    const { data: users } = await step.run('fetch-digest-users', async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('user_id, timezone, daily_digest_time')
        .eq('notification_frequency', 'daily_digest')
        .eq('notification_email', true)

      return data || []
    })

    if (!users || users.length === 0) {
      return { message: 'No users with daily digest enabled' }
    }

    // Filter users whose digest time matches current hour in their timezone
    const now = new Date()
    const usersToSend = users.filter((user) => {
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: user.timezone || 'America/New_York',
        hour: 'numeric',
        hour12: false,
      }).format(now)

      const digestHour = parseInt(user.daily_digest_time.split(':')[0])
      const currentHour = parseInt(userTime)

      return currentHour === digestHour
    })

    console.log(`Sending digests to ${usersToSend.length} users`)

    // Send digest for each user
    const results = await Promise.all(
      usersToSend.map((user) =>
        step.run(`send-digest-${user.user_id}`, async () => {
          return await sendDigestForUser(user.user_id)
        })
      )
    )

    return {
      message: `Sent ${results.filter((r) => r.success).length} digests`,
      total: usersToSend.length,
      errors: results.filter((r) => !r.success).length,
    }
  }
)

async function sendDigestForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Get queued notifications for this user (last 24 hours)
  const { data: queued } = await supabase
    .from('notification_digest_queue')
    .select(`
      *,
      booking_attempts (
        id,
        status,
        error_message,
        attempt_date,
        recurring_classes (
          class_type,
          class_time,
          day_of_week,
          branch
        )
      )
    `)
    .eq('user_id', userId)
    .eq('processed', false)
    .gte('queued_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (!queued || queued.length === 0) {
    return { success: true } // No notifications to send
  }

  // Get user email
  const { data: user } = await supabase.auth.admin.getUserById(userId)
  if (!user || !user.email) {
    return { success: false, error: 'User not found' }
  }

  // Categorize notifications
  const successes = queued.filter((n) => n.booking_attempts?.status === 'confirmed')
  const retrying = queued.filter((n) => n.booking_attempts?.status === 'failed' && n.booking_attempts?.error_message?.includes('full'))
  const failures = queued.filter((n) => n.booking_attempts?.status === 'failed' && !n.booking_attempts?.error_message?.includes('full'))

  // Generate digest email
  const html = dailyDigestTemplate({
    dateRange: 'Last 24 hours',
    successCount: successes.length,
    retryCount: retrying.length,
    failedCount: failures.length,
    successes: successes.map((n) => ({
      className: n.booking_attempts.recurring_classes.class_type,
      dayTime: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][n.booking_attempts.recurring_classes.day_of_week]} ${n.booking_attempts.recurring_classes.class_time}`,
      status: 'Confirmed',
    })),
    retrying: retrying.map((n) => ({
      className: n.booking_attempts.recurring_classes.class_type,
      dayTime: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][n.booking_attempts.recurring_classes.day_of_week]} ${n.booking_attempts.recurring_classes.class_time}`,
    })),
    failures: failures.map((n) => ({
      className: n.booking_attempts.recurring_classes.class_type,
      dayTime: `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][n.booking_attempts.recurring_classes.day_of_week]} ${n.booking_attempts.recurring_classes.class_time}`,
      errorSummary: getShortErrorSummary(n.booking_attempts.error_message),
    })),
    dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://my-workout-scheduler.vercel.app',
  })

  // Send email
  const result = await sendEmailNotification({
    to: user.email,
    category: 'digest',
    subject: `📊 Daily Booking Summary - ${successes.length + retrying.length + failures.length} Classes`,
    html,
  })

  if (result.success) {
    // Mark queue items as processed
    await supabase
      .from('notification_digest_queue')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .in('id', queued.map((n) => n.id))

    // Log notification
    await logNotification({
      userId,
      bookingAttemptId: null,
      notificationType: 'email',
      notificationCategory: 'digest',
      subject: `Daily Digest (${queued.length} items)`,
      deliveryStatus: 'sent',
      templateUsed: 'daily-digest',
    })
  }

  return result
}

function getShortErrorSummary(errorMessage: string | null): string {
  if (!errorMessage) return 'Unknown error'

  // Truncate long error messages
  const firstSentence = errorMessage.split('.')[0]
  return firstSentence.length > 80
    ? firstSentence.substring(0, 77) + '...'
    : firstSentence
}
```

---

## Phase 4: User Preferences UI

### Step 4.1: Create Settings Page

Create: `app/dashboard/settings/page.tsx`

```typescript
/**
 * User Settings Page - Notification Preferences
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationPreferencesForm from '@/components/NotificationPreferencesForm'

export default async function SettingsPage() {
  const supabase = createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!settings) {
    // Create default settings if not exists
    const { data: newSettings } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id })
      .select()
      .single()

    return <NotificationPreferencesForm settings={newSettings} />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <NotificationPreferencesForm settings={settings} />
    </div>
  )
}
```

### Step 4.2: Create Preferences Form Component

Create: `components/NotificationPreferencesForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { updateNotificationPreferences } from '@/app/actions/user-settings'

export default function NotificationPreferencesForm({ settings }: any) {
  const [formData, setFormData] = useState({
    notification_email: settings.notification_email ?? true,
    notification_frequency: settings.notification_frequency ?? 'immediate',
    email_on_success: settings.email_on_success ?? true,
    email_on_waitlist: settings.email_on_waitlist ?? true,
    email_on_failure: settings.email_on_failure ?? true,
    email_on_retry: settings.email_on_retry ?? true,
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await updateNotificationPreferences(formData)

    if (result.success) {
      setMessage({ type: 'success', text: 'Preferences saved successfully!' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save preferences' })
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>

        {/* Email Enabled */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.notification_email}
              onChange={(e) => setFormData({ ...formData, notification_email: e.target.checked })}
              className="rounded"
            />
            <span>Enable email notifications</span>
          </label>
        </div>

        {/* Frequency */}
        {formData.notification_email && (
          <div className="mb-6 pl-6 space-y-2">
            <p className="font-medium mb-2">Frequency:</p>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="immediate"
                checked={formData.notification_frequency === 'immediate'}
                onChange={(e) => setFormData({ ...formData, notification_frequency: e.target.value })}
              />
              <span>Immediate (as they happen)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="daily_digest"
                checked={formData.notification_frequency === 'daily_digest'}
                onChange={(e) => setFormData({ ...formData, notification_frequency: e.target.value })}
              />
              <span>Daily Digest (8 AM summary)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="critical_only"
                checked={formData.notification_frequency === 'critical_only'}
                onChange={(e) => setFormData({ ...formData, notification_frequency: e.target.value })}
              />
              <span>Critical Only (action required)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="off"
                checked={formData.notification_frequency === 'off'}
                onChange={(e) => setFormData({ ...formData, notification_frequency: e.target.value })}
              />
              <span>Off (check dashboard manually)</span>
            </label>
          </div>
        )}

        {/* Individual Preferences (only show if immediate mode) */}
        {formData.notification_email && formData.notification_frequency === 'immediate' && (
          <div className="mb-6 pl-6 space-y-2">
            <p className="font-medium mb-2">What to notify me about:</p>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.email_on_success}
                onChange={(e) => setFormData({ ...formData, email_on_success: e.target.checked })}
              />
              <span>Successful bookings</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.email_on_waitlist}
                onChange={(e) => setFormData({ ...formData, email_on_waitlist: e.target.checked })}
              />
              <span>Waitlist confirmations</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.email_on_retry}
                onChange={(e) => setFormData({ ...formData, email_on_retry: e.target.checked })}
              />
              <span>Class full (first attempt)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.email_on_failure}
                onChange={(e) => setFormData({ ...formData, email_on_failure: e.target.checked })}
              />
              <span>Booking failures</span>
            </label>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}
    </form>
  )
}
```

### Step 4.3: Create Server Action

Create: `app/actions/user-settings.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateNotificationPreferences(data: {
  notification_email: boolean
  notification_frequency: string
  email_on_success: boolean
  email_on_waitlist: boolean
  email_on_failure: boolean
  email_on_retry: boolean
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Update settings
  const { error } = await supabase
    .from('user_settings')
    .update({
      notification_email: data.notification_email,
      notification_frequency: data.notification_frequency,
      email_on_success: data.email_on_success,
      email_on_waitlist: data.email_on_waitlist,
      email_on_failure: data.email_on_failure,
      email_on_retry: data.email_on_retry,
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating notification preferences:', error)
    return { success: false, error: 'Failed to update preferences' }
  }

  revalidatePath('/dashboard/settings')

  return { success: true }
}
```

---

## Phase 5: Testing

### Step 5.1: Unit Tests

Create: `__tests__/email-templates.test.ts`

```typescript
import { bookingSuccessTemplate } from '@/lib/email/templates/booking-success'

describe('Email Templates', () => {
  test('booking success template renders correctly', () => {
    const html = bookingSuccessTemplate({
      className: 'BODYPUMP',
      dayOfWeek: 'Monday',
      date: '12/01/2025',
      time: '4:15 PM',
      branchName: 'Downtown YMCA',
      bookingTimestamp: '11/30/2025 7:30 AM',
      dashboardUrl: 'https://example.com',
    })

    expect(html).toContain('BODYPUMP')
    expect(html).toContain('Monday')
    expect(html).toContain('4:15 PM')
    expect(html).not.toContain('undefined')
  })
})
```

### Step 5.2: Integration Tests

```bash
# Test database migration
npx supabase migration up

# Test email sending (local)
npm run test:send-email

# Test notification logic
npm run test:notifications

# Test user preferences UI
npm run dev
# Navigate to /dashboard/settings
```

### Step 5.3: End-to-End Test

1. **Trigger a real booking:**
   ```bash
   npm run test:single-booking
   ```

2. **Verify email sent:**
   - Check email inbox
   - Verify template rendered correctly
   - Test all links work

3. **Check notification log:**
   ```sql
   SELECT * FROM notification_log
   ORDER BY created_at DESC
   LIMIT 10;
   ```

4. **Test daily digest:**
   - Set notification_frequency to 'daily_digest'
   - Trigger multiple bookings
   - Wait for digest cron or manually trigger

### Step 5.4: Email Client Testing

Test templates in:
- [ ] Gmail (web)
- [ ] Gmail (mobile app)
- [ ] Outlook (web)
- [ ] Apple Mail (macOS)
- [ ] Apple Mail (iOS)

Use [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/) for comprehensive testing.

---

## Phase 6: Deployment

### Step 6.1: Production Database Migration

```bash
# Push migration to production
npx supabase db push

# Verify in Supabase dashboard
# Check Tables → notification_log, notification_digest_queue
# Check Policies → RLS enabled
```

### Step 6.2: Deploy Code Changes

```bash
# Commit all changes
git add .
git commit -m "feat: implement user notification system with email templates"

# Push to GitHub
git push origin claude/improve-error-messaging-018svexLpyabBHYz6kbYfXQu

# Vercel will automatically deploy
```

### Step 6.3: Environment Variables

Verify in Vercel:
- ✅ `RESEND_API_KEY` is set
- ✅ `NEXT_PUBLIC_APP_URL` is set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is set

### Step 6.4: Deploy Inngest Functions

```bash
# Sync Inngest functions
npx inngest-cli deploy

# Verify in Inngest dashboard
# Check Functions → sendDailyDigest
```

### Step 6.5: Production Testing

1. **Test with real user:**
   - Trigger a booking
   - Verify email received
   - Check spam folder

2. **Monitor logs:**
   - Vercel logs for errors
   - Inngest dashboard for function runs
   - Supabase logs for database errors

3. **Check metrics:**
   - Email delivery rate (Resend dashboard)
   - Notification log counts
   - User complaints (support email)

---

## Rollback Plan

### If Something Goes Wrong

**Level 1: Disable notifications**
```sql
-- Temporarily disable all notifications
UPDATE user_settings
SET notification_email = FALSE;
```

**Level 2: Revert migration**
```bash
# Revert database migration
npx supabase db reset --db-url <PRODUCTION_URL>

# Restore from backup (if available)
# Contact Supabase support
```

**Level 3: Rollback deployment**
```bash
# In Vercel dashboard:
# Deployments → Find previous deployment → Promote to Production
```

### Monitoring & Alerts

Set up alerts for:
- Email delivery failures > 10%
- Database errors in notification_log
- Inngest function failures
- User complaints about spam

---

## Success Metrics

After deployment, track:
- **Email delivery rate:** > 95%
- **Email open rate:** > 30%
- **Unsubscribe rate:** < 2%
- **User satisfaction:** Positive feedback
- **Error rate:** < 5% of notifications fail

---

## Next Steps (Post-MVP)

1. **SMS notifications** using Twilio
2. **In-app notifications** using real-time updates
3. **Push notifications** using browser Push API
4. **Notification analytics** dashboard
5. **A/B testing** for email templates

---

## Troubleshooting

### Common Issues

**Emails not sending:**
- Check Resend API key
- Verify domain DNS records
- Check rate limits

**Templates not rendering:**
- Verify template syntax
- Check variable substitution
- Test in email clients

**Database errors:**
- Check RLS policies
- Verify user permissions
- Review migration logs

**Digest not sending:**
- Check timezone logic
- Verify cron schedule
- Check Inngest logs

---

## Related Documentation
- `docs/ERROR_MESSAGES.md` - User-friendly error messages
- `docs/NOTIFICATIONS_DESIGN.md` - Email templates and design
- `docs/PRODUCTION_EMAIL_SETUP.md` - Resend email configuration

---

**Questions?** Open an issue on GitHub or contact the development team.
