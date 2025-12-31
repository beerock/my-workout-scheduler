import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LogoutButton from '@/components/LogoutButton'
import PauseToggle from '@/components/PauseToggle'
import EmailVerificationNotification from '@/components/EmailVerificationNotification'
import { getUserSettings } from '@/app/actions/user-settings'
import { Button, Card } from '@/components/ui'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user settings for pause toggle
  const settingsResult = await getUserSettings()
  const settings = settingsResult.success ? settingsResult.settings : null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="font-sora text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-sora text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="font-dm-sans text-gray-600">
                Welcome, {user.email}! Manage your workout schedule and settings.
              </p>
            </div>
            <PauseToggle initialPaused={settings?.schedule_paused ?? false} />
          </div>

          <Suspense fallback={null}>
            <EmailVerificationNotification />
          </Suspense>

          <div className="space-y-4">
            <Card variant="outlined" padding="md">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-2">Schedule Management</h3>
              <div className="space-y-2">
                <Link href="/dashboard/schedule">
                  <Button variant="primary" className="w-full">
                    Manage Schedule
                  </Button>
                </Link>
                <p className="font-dm-sans text-sm text-gray-500 mt-2">
                  Add, edit, and manage your recurring class schedule
                </p>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-2">Gym Credentials</h3>
              <div className="space-y-2">
                <Link href="/dashboard/credentials">
                  <Button variant="secondary" className="w-full">
                    Manage Gym Credentials
                  </Button>
                </Link>
                <p className="font-dm-sans text-sm text-gray-500 mt-2">
                  Store your gym website login credentials securely
                </p>
              </div>
            </Card>

            <Card variant="outlined" padding="md">
              <h3 className="font-sora text-lg font-semibold text-gray-900 mb-2">Profile Settings</h3>
              <div className="space-y-2">
                <Link href="/dashboard/profile">
                  <Button variant="success" className="w-full">
                    Manage Profile
                  </Button>
                </Link>
                <p className="font-dm-sans text-sm text-gray-500 mt-2">
                  Update email, password, and account settings
                </p>
              </div>
            </Card>
          </div>
        </Card>
      </main>
    </div>
  )
}

