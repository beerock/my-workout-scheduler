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
import { getAdminUserIds } from '@/lib/env-utils'
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

export async function markWaitlistInvited(id: string): Promise<void> {
  await assertAdmin()
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('waitlist_signups')
    .update({ status: 'invited', invited_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin-waitlist] mark invited failed:', error)
    throw new Error('Could not update waitlist entry.')
  }
  revalidatePath('/dashboard/admin/waitlist')
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
