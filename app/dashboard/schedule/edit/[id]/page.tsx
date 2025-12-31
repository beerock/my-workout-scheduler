import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRecurringClass } from '@/app/actions/recurring-classes'
import RecurringClassForm from '@/components/RecurringClassForm'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'

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
            <h1 className="font-sora text-2xl font-bold text-gray-900 mb-2">Edit Recurring Class</h1>
            <p className="font-dm-sans text-gray-600 text-sm">
              Update your recurring class configuration
            </p>
          </div>

          <RecurringClassForm initialClass={classResult.class} />
        </Card>
      </main>
    </div>
  )
}

