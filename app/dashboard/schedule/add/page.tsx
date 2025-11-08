import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecurringClassForm from '@/components/RecurringClassForm'
import { getRecurringClass } from '@/app/actions/recurring-classes'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ copyFrom?: string }>
}

export default async function AddClassPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if we're copying from an existing class
  const params = await searchParams
  const copyFromId = params.copyFrom
  let classToCopy = null

  if (copyFromId) {
    const result = await getRecurringClass(copyFromId)
    if (result.success && result.class) {
      // Create a copy - the form checks for initialClass?.id to determine if it's an edit
      // By not including id, the form will treat it as a new class
      classToCopy = {
        ...result.class,
        id: undefined as any, // Remove id so form treats as new class
        active: true, // Always start copied classes as active
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <Link
              href="/dashboard/schedule"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Schedule
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {classToCopy ? 'Copy Recurring Class' : 'Add Recurring Class'}
            </h1>
            <p className="text-gray-600 text-sm">
              {classToCopy
                ? 'Copy an existing class and modify as needed'
                : 'Configure a recurring weekly class that will be automatically booked'}
            </p>
          </div>

          <RecurringClassForm initialClass={classToCopy} isCopy={!!classToCopy} />
        </div>
      </main>
    </div>
  )
}

