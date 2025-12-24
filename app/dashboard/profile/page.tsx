import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LogoutButton from '@/components/LogoutButton'
import ProfileForm from '@/components/ProfileForm'
import EmailVerificationNotification from '@/components/EmailVerificationNotification'
import NotificationPreferencesForm from '@/components/NotificationPreferencesForm'
import Link from 'next/link'

export default async function ProfilePage() {
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
    email_on_failure: settings?.email_on_failure ?? true,
    email_on_retry: settings?.email_on_retry ?? true,
    daily_digest_time: settings?.daily_digest_time ?? '08:00:00',
    timezone: settings?.timezone ?? 'America/New_York',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                My Workout Scheduler
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Profile Settings</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600 text-sm">
              Manage your account settings, update your email and password
            </p>
          </div>

          <Suspense fallback={null}>
            <EmailVerificationNotification />
          </Suspense>

          <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">User ID:</span>
                <span className="text-gray-600 font-mono text-xs">{user.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Current Email:</span>
                <span className="text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Account Created:</span>
                <span className="text-gray-600">
                  {new Date(user.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <ProfileForm userEmail={user.email} />
        </div>

        {/* Notification Preferences Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
            <p className="text-gray-600 text-sm">
              Control when and how you receive booking notifications
            </p>
          </div>

          <NotificationPreferencesForm initialPreferences={notificationPreferences} />
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
