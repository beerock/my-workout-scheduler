import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRecurringClasses } from '@/app/actions/recurring-classes'
import { getUserSettings } from '@/app/actions/user-settings'
import ScheduleList from '@/components/ScheduleList'
import PauseToggle from '@/components/PauseToggle'
import Link from 'next/link'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get classes and settings
  const [classesResult, settingsResult] = await Promise.all([
    getRecurringClasses(),
    getUserSettings(),
  ])

  const classes = classesResult.success ? classesResult.classes || [] : []
  const settings = settingsResult.success ? settingsResult.settings : null

  // Get gym URL for skip button
  const { data: credentials } = await supabase
    .from('gym_credentials')
    .select('gym_url')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Schedule</h1>
              <p className="text-gray-600 text-sm">
                Manage your recurring class schedule and booking preferences
              </p>
            </div>
            <div className="flex items-center gap-4">
              <PauseToggle
                initialPaused={settings?.schedule_paused ?? false}
              />
              <Link
                href="/dashboard/schedule/add"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Class
              </Link>
            </div>
          </div>

          <ScheduleList
            classes={classes}
            gymUrl={credentials?.gym_url || null}
            schedulePaused={settings?.schedule_paused ?? false}
          />
        </div>
      </main>
    </div>
  )
}

