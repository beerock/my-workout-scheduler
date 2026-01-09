/**
 * Send Welcome Email
 *
 * Sends welcome email to newly verified users.
 * Called from auth callback after successful email verification.
 */

import { createClient } from '@/lib/supabase/server'
import { getUserEmail, sendEmailNotification } from '@/lib/email/send-notification'
import { welcomeEmail } from '@/lib/email/templates/welcome'

export type WelcomeEmailResult = {
  sent: boolean
  reason?: string
  error?: string
}

/**
 * Send welcome email to a newly signed up user
 */
export async function sendWelcomeEmail(userId: string): Promise<WelcomeEmailResult> {
  const supabase = await createClient()

  // 1. Get user email
  const userEmail = await getUserEmail(userId)
  if (!userEmail) {
    console.log(`[WelcomeEmail] User ${userId} has no email, skipping welcome email`)
    return {
      sent: false,
      reason: 'User has no email address',
    }
  }

  // 2. Check if user notification preferences allow welcome emails
  // For MVP, we always send welcome emails (cannot be disabled)
  // This is an onboarding email, not a notification email

  // 3. Check if we've already sent a welcome email to this user
  // Prevent duplicate sends if user verifies multiple times
  const { data: existingWelcome, error: checkError } = await supabase
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', 'welcome')
    .limit(1)

  if (!checkError && existingWelcome && existingWelcome.length > 0) {
    console.log(`[WelcomeEmail] Welcome email already sent to user ${userId}, skipping`)
    return {
      sent: false,
      reason: 'Welcome email already sent',
    }
  }

  // 4. Get environment-specific URLs
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const dashboardUrl = `${appUrl}/dashboard`
  const settingsUrl = `${appUrl}/dashboard/profile`
  const credentialsUrl = `${appUrl}/dashboard/credentials`

  // 5. Generate email
  const { subject, html } = welcomeEmail({
    dashboardUrl,
    settingsUrl,
    credentialsUrl,
  })

  // 6. Send email
  const result = await sendEmailNotification({
    to: userEmail,
    subject,
    html,
    userId,
    notificationType: 'welcome',
  })

  if (!result.success) {
    console.error(`[WelcomeEmail] Failed to send welcome email:`, result.error)
    return {
      sent: false,
      error: result.error,
    }
  }

  console.log(`[WelcomeEmail] Successfully sent welcome email to ${userEmail}`)
  return {
    sent: true,
  }
}
