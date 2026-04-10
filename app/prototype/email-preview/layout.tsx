/**
 * Email Preview Layout - Admin-only access guard
 *
 * Runs as a server component BEFORE the child page renders, so unauthorized
 * users never see even a flicker of the preview UI.
 *
 * Flow:
 * - Not logged in → silent redirect to '/'
 * - Logged in but not in ADMIN_USER_IDS → silent redirect to '/'
 * - Admin → render the page normally
 *
 * This is layer 1 of a defense-in-depth setup. Layer 2 is the assertAdmin()
 * guard inside app/actions/email-preview.ts which refuses to return template
 * data for non-admins even if this layout is bypassed.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminUserIds } from '@/lib/env-utils'

export default async function EmailPreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → silent redirect to home
  if (!user) {
    redirect('/')
  }

  // Logged in but not admin → silent redirect to home
  const adminUserIds = getAdminUserIds()
  if (!adminUserIds.includes(user.id)) {
    redirect('/')
  }

  return <>{children}</>
}
