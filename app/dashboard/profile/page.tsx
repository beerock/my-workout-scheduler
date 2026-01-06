import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProfileForm from '@/components/ProfileForm'
import EmailVerificationNotification from '@/components/EmailVerificationNotification'
import NotificationPreferencesForm from '@/components/NotificationPreferencesForm'
import EditorialLayout from '@/components/EditorialLayout'
import { Card, Badge, Divider } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Profile',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const accountAge = Math.floor((Date.now() - new Date(user.created_at || '').getTime()) / (1000 * 60 * 60 * 24))

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
    <EditorialLayout
      title="Profile"
      subtitle="Manage your account settings, update your email and password"
      backLink={{ href: '/dashboard', label: 'Dashboard' }}
    >
      <Suspense fallback={null}>
        <EmailVerificationNotification />
      </Suspense>

      {/* Account Summary Card */}
      <Card
        variant="outlined"
        padding="md"
        className="mb-6 border-l-4 border-l-success-500 bg-gradient-to-br from-success-50/50 to-emerald-50/30 opacity-0 animate-fade-in-up"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="font-sora text-2xl font-bold text-white">
              {user.email?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>

          {/* Account Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-sora text-lg font-bold text-gray-900 truncate">
                {user.email}
              </h3>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
            <p className="font-dm-sans text-sm text-gray-600">
              Member for {accountAge} {accountAge === 1 ? 'day' : 'days'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8">
            <div className="text-center">
              <div className="font-sora text-xl font-bold text-gray-900">{accountAge}</div>
              <div className="font-dm-sans text-xs text-gray-500">Days</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Details */}
      <Card
        variant="outlined"
        padding="md"
        className="mb-6 opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <h3 className="font-sora text-base font-bold text-gray-900 mb-4">Account Details</h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <span className="font-dm-sans text-sm font-medium text-gray-500">User ID</span>
            <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded truncate max-w-full sm:max-w-xs">{user.id}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <span className="font-dm-sans text-sm font-medium text-gray-500">Email</span>
            <span className="font-dm-sans text-sm text-gray-900">{user.email}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
            <span className="font-dm-sans text-sm font-medium text-gray-500">Account Created</span>
            <span className="font-dm-sans text-sm text-gray-600">
              {new Date(user.created_at || '').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </Card>

      {/* Editorial Divider */}
      <Divider variant="editorial" className="my-6 sm:my-8" />

      {/* Profile Form */}
      <Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="font-sora text-lg font-bold text-gray-900 mb-4">Update Account</h3>
        <ProfileForm userEmail={user.email} />
      </Card>

      {/* Editorial Divider */}
      <Divider variant="editorial" className="my-6 sm:my-8" />

      {/* Notification Preferences */}
      <Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="font-sora text-lg font-bold text-gray-900 mb-2">Notification Preferences</h3>
        <p className="font-dm-sans text-sm text-gray-600 mb-6">
          Control when and how you receive booking notifications
        </p>
        <NotificationPreferencesForm initialPreferences={notificationPreferences} />
      </Card>
    </EditorialLayout>
  )
}
