'use server'

/**
 * Server actions for the public waitlist flow.
 *
 * The submitWaitlist action is called from the public landing-page waitlist
 * form (app/(auth)/signup/page.tsx) by any visitor. It writes to
 * waitlist_signups (INSERT policy allows anon/authenticated) and sends a
 * confirmation email directly via Resend - the notification_log path is
 * skipped because the submitter is not a Supabase auth user and therefore
 * has no user_id to foreign-key against.
 *
 * Admin actions (list, mark invited, decline, delete) live in
 * admin-waitlist.ts to keep the public-facing server action file narrow.
 */

import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getEmailConfig, getSiteUrl } from '@/lib/env-utils'
import { waitlistConfirmationEmail } from '@/lib/email/templates/waitlist-confirmation'

export type WaitlistSubmitResult =
  | { success: true; alreadyOnList: boolean }
  | { success: false; error: string }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NOTE_LENGTH = 500

/**
 * Validate and submit a waitlist entry. Returns a discriminated result so the
 * client form can render the exact error without leaking internals.
 *
 * Duplicate emails are treated as success with alreadyOnList=true so the form
 * shows the same confirmation state - this prevents the form from being used
 * to enumerate which emails are already on the waitlist.
 */
export async function submitWaitlist(
  emailRaw: string,
  noteRaw: string | null
): Promise<WaitlistSubmitResult> {
  const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : ''
  const note =
    typeof noteRaw === 'string' && noteRaw.trim().length > 0
      ? noteRaw.trim().slice(0, MAX_NOTE_LENGTH)
      : null

  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const supabase = createServiceRoleClient()

  // Insert. If the email already exists, Postgres raises a unique-violation
  // (code 23505) which we treat as "already on the list" - identical UX to a
  // brand-new submission. The form never reveals which case happened.
  const { error: insertError } = await supabase
    .from('waitlist_signups')
    .insert({ email, note })

  if (insertError) {
    const isUniqueViolation =
      (insertError as { code?: string }).code === '23505'

    if (isUniqueViolation) {
      // Do not re-send the confirmation email on duplicate submits. We already
      // sent one the first time through; repeated submits should not generate
      // a second email.
      return { success: true, alreadyOnList: true }
    }

    console.error('[waitlist] Insert failed:', insertError)
    return { success: false, error: 'Could not save your waitlist entry. Try again in a moment.' }
  }

  // Fire-and-log the confirmation email. We do NOT fail the overall submit
  // if the email send fails - the row is already saved, so the user is on the
  // waitlist either way. Log the failure for admin follow-up.
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.warn('[waitlist] RESEND_API_KEY missing - skipping confirmation email')
    } else {
      const resend = new Resend(resendKey)
      const { fromEmail, fromName } = getEmailConfig()
      const { subject, html } = waitlistConfirmationEmail({
        email,
        siteUrl: getSiteUrl(),
      })

      const { error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject,
        html,
      })

      if (emailError) {
        console.error('[waitlist] Confirmation email failed:', emailError)
      }
    }
  } catch (err) {
    console.error('[waitlist] Confirmation email threw:', err)
  }

  return { success: true, alreadyOnList: false }
}
