'use server'

/**
 * Admin-only server actions for reviewing the waitlist.
 *
 * All actions gate on assertAdmin() first. The assertAdmin pattern mirrors
 * app/actions/email-preview.ts - defense-in-depth against a future layout
 * misconfiguration that lets a non-admin reach these endpoints.
 */

import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  getAdminUserIds,
  getAuthCallbackUrl,
  getEmailConfig,
  getSiteUrl,
} from '@/lib/env-utils'
import { waitlistInviteEmail } from '@/lib/email/templates/waitlist-invite'
import type { WaitlistSignup } from '@/lib/database.types'

async function assertAdmin(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  if (!getAdminUserIds().includes(user.id)) throw new Error('Unauthorized')
}

export async function listWaitlistSignups(): Promise<WaitlistSignup[]> {
  await assertAdmin()
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('waitlist_signups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-waitlist] list failed:', error)
    throw new Error('Could not load waitlist.')
  }
  return (data ?? []) as WaitlistSignup[]
}

/**
 * Result shape for inviteWaitlistEntry. Discriminated so the admin UI can
 * render specific states without needing a try/catch around the call.
 *
 * We intentionally return errors as data instead of throwing because a
 * thrown server-action error in Next.js 16 surfaces to the client as a
 * generic "Server Components render" error overlay (especially in prod
 * builds where messages are stripped), losing the actual reason. Returning
 * a Result preserves the message.
 */
export type InviteResult =
  | { success: true; alreadyHadAccount: boolean; emailSent: boolean }
  | { success: false; stage: 'load' | 'link' | 'send' | 'status'; error: string }

/**
 * One-click invite with a BRANDED email.
 *
 * Supabase's built-in admin.inviteUserByEmail would also work, but it sends
 * a plain "You have been invited" template that visually breaks from the
 * rest of the product. Instead:
 *   1. admin.generateLink({ type: 'invite' }) creates the user AND returns
 *      a magic link WITHOUT sending an email (unlike inviteUserByEmail).
 *   2. We compose our own email with the waitlist-invite template and send
 *      it via Resend - same path every other email in the app uses.
 *
 * Semantics:
 * - Status is only flipped to 'invited' when the email actually sends
 *   successfully. If send fails, status stays 'pending' so the admin can
 *   retry after fixing the underlying config.
 * - User already exists in auth: skip the email send, flip status. This
 *   is a re-invite audit-trail case, not an error.
 */
export async function inviteWaitlistEntry(id: string): Promise<InviteResult> {
  await assertAdmin()
  const supabase = createServiceRoleClient()

  // Load the row so we have the email. Service-role bypasses RLS.
  const { data: row, error: loadError } = await supabase
    .from('waitlist_signups')
    .select('id, email, status')
    .eq('id', id)
    .single()

  if (loadError || !row) {
    console.error('[admin-waitlist] load for invite failed:', loadError)
    return {
      success: false,
      stage: 'load',
      error: loadError?.message ?? 'Could not load that waitlist entry.',
    }
  }

  // Generate the invite magic link. `generateLink` with type='invite'
  // creates the auth user if missing AND does NOT auto-send an email —
  // we own the send path.
  const redirectTo = `${getAuthCallbackUrl()}?next=/dashboard`
  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: 'invite',
      email: row.email,
      options: { redirectTo },
    })

  let alreadyHadAccount = false
  let inviteUrl: string | undefined = linkData?.properties?.action_link

  if (linkError) {
    const msg = (linkError.message || '').toLowerCase()
    const alreadyExists =
      msg.includes('already') ||
      msg.includes('exists') ||
      msg.includes('registered')

    if (!alreadyExists) {
      console.error('[admin-waitlist] generateLink failed:', linkError)
      return {
        success: false,
        stage: 'link',
        error: linkError.message || 'Could not generate invite link.',
      }
    }
    alreadyHadAccount = true
    inviteUrl = undefined
    console.log(
      `[admin-waitlist] ${row.email} already has an account — flipping status only, no email sent`
    )
  }

  // Send our branded invite email via Resend (only if we have a link).
  let emailSent = false
  if (inviteUrl) {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.error('[admin-waitlist] RESEND_API_KEY missing in this environment')
      return {
        success: false,
        stage: 'send',
        error:
          'RESEND_API_KEY is not configured for this environment. The invite link was generated but no email was sent; status stays pending.',
      }
    }

    const resend = new Resend(resendKey)
    const { fromEmail, fromName } = getEmailConfig()
    const { subject, html } = waitlistInviteEmail({
      email: row.email,
      inviteUrl,
      siteUrl: getSiteUrl(),
    })

    const { error: sendError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: row.email,
      subject,
      html,
    })

    if (sendError) {
      // Log the FULL serialized error so Vercel log truncation doesn't hide
      // the Resend statusCode / name / message. Common causes: fromEmail
      // falling back to onboarding@resend.dev (sandbox restriction) if
      // RESEND_FROM_EMAIL isn't set on this deployment's env.
      console.error(
        '[admin-waitlist] invite email send failed:',
        JSON.stringify(
          {
            sendError,
            fromEmail,
            fromName,
            to: row.email,
            hasResendKey: !!resendKey,
            resendKeyLength: resendKey.length,
          },
          null,
          2
        )
      )
      const msgParts = [
        sendError.message || 'Resend send failed',
        sendError.name ? `(${sendError.name})` : '',
      ].filter(Boolean)
      return {
        success: false,
        stage: 'send',
        error: `${msgParts.join(' ')}. Status stays pending — fix the config and retry. From: ${fromEmail}.`,
      }
    }
    emailSent = true
  }

  // Flip status + stamp invited_at
  const { error: updateError } = await supabase
    .from('waitlist_signups')
    .update({ status: 'invited', invited_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[admin-waitlist] post-invite status update failed:', updateError)
    return {
      success: false,
      stage: 'status',
      error: emailSent
        ? 'Invite email sent, but could not flip status. Reload and try again.'
        : updateError.message || 'Could not update status.',
    }
  }

  revalidatePath('/dashboard/admin/waitlist')
  return { success: true, alreadyHadAccount, emailSent }
}

export async function markWaitlistDeclined(id: string): Promise<void> {
  await assertAdmin()
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('waitlist_signups')
    .update({ status: 'declined' })
    .eq('id', id)

  if (error) {
    console.error('[admin-waitlist] mark declined failed:', error)
    throw new Error('Could not update waitlist entry.')
  }
  revalidatePath('/dashboard/admin/waitlist')
}

export async function deleteWaitlistEntry(id: string): Promise<void> {
  await assertAdmin()
  const supabase = createServiceRoleClient()
  const { error } = await supabase.from('waitlist_signups').delete().eq('id', id)

  if (error) {
    console.error('[admin-waitlist] delete failed:', error)
    throw new Error('Could not delete waitlist entry.')
  }
  revalidatePath('/dashboard/admin/waitlist')
}
