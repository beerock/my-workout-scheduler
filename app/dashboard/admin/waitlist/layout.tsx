/**
 * Admin Waitlist Layout - Admin-only access guard.
 *
 * Mirrors the pattern used by app/prototype/email-preview/layout.tsx:
 * - Runs as a server component before the child page renders, so unauthorized
 *   users never see even a flicker of the admin UI.
 * - Not logged in → silent redirect to '/'
 * - Logged in but not admin → silent redirect to '/'
 *
 * This is layer 1 of defense-in-depth. Layer 2 is assertAdmin() inside the
 * server actions in app/actions/admin-waitlist.ts which refuse to return
 * waitlist data to non-admins even if this layout is bypassed.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminUserIds } from '@/lib/env-utils'

export default async function AdminWaitlistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const adminUserIds = getAdminUserIds()
  if (!adminUserIds.includes(user.id)) redirect('/')

  return <>{children}</>
}
