import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecurringClassForm from '@/components/RecurringClassForm'
import { getRecurringClass } from '@/app/actions/recurring-classes'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'

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
      <nav className="bg-white shadow-card border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="font-sora text-xl font-semibold text-gray-900">
              My Workout Scheduler
            </h1>
            <Link href="/dashboard/schedule">
              <Button variant="ghost" size="sm">
                ← Back to Schedule
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="mb-6">
            <h1 className="font-sora text-2xl font-bold text-gray-900 mb-2">
              {classToCopy ? 'Copy Recurring Class' : 'Add Recurring Class'}
            </h1>
            <p className="font-dm-sans text-gray-600 text-sm">
              {classToCopy
                ? 'Copy an existing class and modify as needed'
                : 'Configure a recurring weekly class that will be automatically booked'}
            </p>
          </div>

          <RecurringClassForm initialClass={classToCopy} isCopy={!!classToCopy} />
        </Card>
      </main>
    </div>
  )
}

