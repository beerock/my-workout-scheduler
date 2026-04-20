'use server'

/**
 * Admin-only server actions for reviewing the waitlist.
 *
 * All actions gate on assertAdmin() first. The assertAdmin pattern mirrors
 * app/actions/email-preview.ts - defense-in-depth against a future layout
 * misconfiguration that lets a non-admin reach these endpoints.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getAdminUserIds, getAuthCallbackUrl } from '@/lib/env-utils'
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
 * One-click invite: creates a Supabase auth user for the waitlist entry's
 * email (if they don't already have one) and flips status → invited.
 *
 * Supabase's admin.inviteUserByEmail sends its built-in magic-link invite
 * email. For a branded invite email sent via Resend instead, we'd switch to
 * admin.generateLink({ type: 'invite' }) and send our own - deferred to a
 * future iteration per the Sprint 1 scope note.
 *
 * Error modes we handle gracefully:
 * - User already exists in auth (they've been invited or signed up before):
 *   skip the invite send, still flip status so the audit trail is correct.
 *   Return alreadyHadAccount=true so the admin UI can note this.
 * - Any other auth admin error: surface to the caller, don't flip status.
 *
 * The redirectTo URL sends invitees through the existing /auth/callback
 * route after they click the magic link - same callback used for signup
 * verification and password reset, which already handles the session
 * exchange and sends a welcome email for new users.
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

  // Send the invite. Supabase creates the user and sends the built-in
  // invite email. redirectTo sends them to our auth callback so the
  // existing welcome-email hook fires on first login.
  let alreadyHadAccount = false
  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    row.email,
    { redirectTo: `${getAuthCallbackUrl()}?next=/dashboard` }
  )

  if (inviteError) {
    // Supabase returns "User already registered" (or similar) if the email
    // already has an auth user. Treat as informational: we still want to
    // flip status so the admin log reflects the invite intent.
    const msg = (inviteError.message || '').toLowerCase()
    const alreadyExists =
      msg.includes('already') ||
      msg.includes('exists') ||
      msg.includes('registered')

    if (!alreadyExists) {
      console.error('[admin-waitlist] invite send failed:', inviteError)
      throw new Error(
        `Could not send invite email: ${inviteError.message}`
      )
    }
    alreadyHadAccount = true
    console.log(`[admin-waitlist] ${row.email} already has an account — flipping status only`)
  }

  // Flip status + stamp invited_at
  const { error: updateError } = await supabase
    .from('waitlist_signups')
    .update({ status: 'invited', invited_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[admin-waitlist] post-invite status update failed:', updateError)
    // Invite was sent but status update failed — surface so admin can retry.
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
