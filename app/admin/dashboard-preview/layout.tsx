/**
 * Admin Dashboard Preview Layout - Admin-only access guard.
 *
 * Mirrors the pattern used by app/admin/email-preview/layout.tsx and
 * app/admin/waitlist/layout.tsx — runs as a server component before the
 * child page renders so unauthorized users never see the preview UI.
 * Not logged in or logged in as a non-admin → silent redirect to '/'.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminUserIds } from '@/lib/env-utils'

export default async function AdminDashboardPreviewLayout({
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
