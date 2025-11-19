import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import PauseToggle from '@/components/PauseToggle'
import EmailVerificationNotification from '@/components/EmailVerificationNotification'
import { getUserSettings } from '@/app/actions/user-settings'

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
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-gray-600">
                Welcome, {user.email}! Manage your workout schedule and settings.
              </p>
            </div>
            <PauseToggle initialPaused={settings?.schedule_paused ?? false} />
          </div>

          <EmailVerificationNotification />

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Management</h3>
              <div className="space-y-2">
                <a
                  href="/dashboard/schedule"
                  className="block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                >
                  Manage Schedule
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Add, edit, and manage your recurring class schedule
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gym Credentials</h3>
              <div className="space-y-2">
                <a
                  href="/dashboard/credentials"
                  className="block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-center"
                >
                  Manage Gym Credentials
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Store your gym website login credentials securely
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Settings</h3>
              <div className="space-y-2">
                <a
                  href="/dashboard/profile"
                  className="block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
                >
                  Manage Profile
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Update email, password, and account settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

