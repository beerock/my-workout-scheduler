import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRecurringClasses } from '@/app/actions/recurring-classes'
import { getUserSettings } from '@/app/actions/user-settings'
import ScheduleList from '@/components/ScheduleList'
import PauseToggle from '@/components/PauseToggle'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'

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
      <nav className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="font-sora text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-sora text-2xl font-bold text-gray-900 mb-2">My Schedule</h1>
              <p className="font-dm-sans text-gray-600 text-sm">
                Manage your recurring class schedule and booking preferences
              </p>
            </div>
            <div className="flex items-center gap-4">
              <PauseToggle
                initialPaused={settings?.schedule_paused ?? false}
              />
              <Link href="/dashboard/schedule/add">
                <Button variant="primary">
                  + Add Class
                </Button>
              </Link>
            </div>
          </div>

          <ScheduleList
            classes={classes}
            gymUrl={credentials?.gym_url || null}
            schedulePaused={settings?.schedule_paused ?? false}
          />
        </Card>
      </main>
    </div>
  )
}

