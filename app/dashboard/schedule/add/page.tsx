import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import RecurringClassForm from '@/components/RecurringClassForm'
import { getRecurringClass } from '@/app/actions/recurring-classes'
import EditorialLayout from '@/components/EditorialLayout'
import { Card } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Add Class',
}

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
    <EditorialLayout
      title={classToCopy ? 'Copy Class' : 'Add Class'}
      subtitle={classToCopy
        ? 'Copy an existing class and modify as needed'
        : 'Configure a recurring weekly class that will be automatically booked'}
      backLink={{ href: '/dashboard/schedule', label: 'Schedule' }}
    >
      <Card className="opacity-0 animate-fade-in-up max-w-2xl mx-auto">
        <RecurringClassForm initialClass={classToCopy} isCopy={!!classToCopy} />
      </Card>
    </EditorialLayout>
  )
}

