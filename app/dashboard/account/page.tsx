import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProfileForm from '@/components/ProfileForm'
import EmailVerificationNotification from '@/components/EmailVerificationNotification'
import NotificationPreferencesForm from '@/components/NotificationPreferencesForm'
import EditorialLayout from '@/components/EditorialLayout'
import { Card, Divider, Alert } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Account',
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AccountPage({ searchParams }: PageProps) {
  const params = await searchParams
  const showUnsubscribeInfo = params.unsubscribe === 'true'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user notification preferences
  let { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Default notification preferences if none exist
  const notificationPreferences = {
    notification_email: settings?.notification_email ?? true,
    notification_frequency: settings?.notification_frequency ?? 'immediate',
    email_on_success: settings?.email_on_success ?? true,
    email_on_waitlist: settings?.email_on_waitlist ?? true,
    email_on_retry: settings?.email_on_retry ?? true,
    email_on_pause_reminder: settings?.email_on_pause_reminder ?? true,
  }

  return (
    <EditorialLayout
      title="Account"
      subtitle="Your notifications, email, and password."
    >
      <Suspense fallback={null}>
        <EmailVerificationNotification />
      </Suspense>

      <div className="max-w-2xl mx-auto">
        {/* Unsubscribe Info Alert - shown when arriving from email unsubscribe link */}
        {showUnsubscribeInfo && (
          <Alert variant="info" className="mb-6">
            You landed here from an email unsubscribe link. Dial in exactly which emails you want — or turn them all off.
          </Alert>
        )}

        {/* Notification Preferences - Primary focus */}
        <Card className="opacity-0 animate-fade-in-up">
          <h3 className="font-sora text-lg font-bold text-gray-900 mb-2">Emails</h3>
          <p className="font-dm-sans text-sm text-gray-600 mb-6">
            Pick what lands in your inbox.
          </p>
          <NotificationPreferencesForm initialPreferences={notificationPreferences} />
        </Card>

        {/* Editorial Divider */}
        <Divider variant="editorial" className="my-6 sm:my-8" />

        {/* Security Section */}
        <Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-sora text-lg font-bold text-gray-900 mb-2">Security</h3>
          <p className="font-dm-sans text-sm text-gray-600 mb-6">
            Change your email or password.
          </p>
          <ProfileForm userEmail={user.email} />
        </Card>
      </div>
    </EditorialLayout>
  )
}
