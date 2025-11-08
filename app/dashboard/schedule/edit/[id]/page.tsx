import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRecurringClass } from '@/app/actions/recurring-classes'
import RecurringClassForm from '@/components/RecurringClassForm'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditClassPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const classResult = await getRecurringClass(id)

  if (!classResult.success || !classResult.class) {
    redirect('/dashboard/schedule')
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Recurring Class</h1>
            <p className="text-gray-600 text-sm">
              Update your recurring class configuration
            </p>
          </div>

          <RecurringClassForm initialClass={classResult.class} />
        </div>
      </main>
    </div>
  )
}

