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

export type InviteResult = {
  alreadyHadAccount: boolean
}

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
 * Error modes we handle gracefully:
 * - User already exists in auth: generateLink still returns a link (for
 *   subsequent re-invite use cases). We skip re-sending and flip status.
 *   Return alreadyHadAccount=true so the admin UI can note this.
 * - generateLink fails for other reasons: surface to caller, don't flip
 *   status.
 * - Resend send fails: surface to caller with explicit "link generated but
 *   email didn't send - check Resend logs" message so the admin knows the
 *   user record DID get created.
 *
 * The invite link redirects through /auth/callback with next=/dashboard,
 * where the existing welcome-email hook fires on first-time sign-in.
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
    throw new Error('Could not load that waitlist entry.')
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
      throw new Error(`Could not generate invite link: ${linkError.message}`)
    }
    // User already has an account. We won't send a re-invite email — they
    // should use /login or password reset. Fall through to the status flip
    // so the audit trail reflects the intent.
    alreadyHadAccount = true
    inviteUrl = undefined
    console.log(
      `[admin-waitlist] ${row.email} already has an account — flipping status only, no email sent`
    )
  }

  // Send our branded invite email via Resend (only if we have a link).
  if (inviteUrl) {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      throw new Error(
        'RESEND_API_KEY is not configured; the invite link was generated but no email was sent.'
      )
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
      console.error('[admin-waitlist] invite email send failed:', sendError)
      throw new Error(
        `Invite link generated but email send failed: ${sendError.message || 'unknown error'}`
      )
    }
  }

  // Flip status + stamp invited_at
  const { error: updateError } = await supabase
    .from('waitlist_signups')
    .update({ status: 'invited', invited_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[admin-waitlist] post-invite status update failed:', updateError)
    throw new Error(
      'Invite email sent, but could not update the row status. Reload and try again.'
    )
  }

  revalidatePath('/dashboard/admin/waitlist')
  return { alreadyHadAccount }
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
