import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getRecurringClass } from '@/app/actions/recurring-classes'
import RecurringClassForm from '@/components/RecurringClassForm'
import EditorialLayout from '@/components/EditorialLayout'
import { Card } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Edit Class',
}

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
    <EditorialLayout
      title="Edit Class"
      subtitle={`Update ${classResult.class.class_type} on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][classResult.class.day_of_week]}s`}
    >
      <div className="max-w-2xl mx-auto">
        <Card className="opacity-0 animate-fade-in-up">
          <RecurringClassForm initialClass={classResult.class} />
        </Card>
      </div>
    </EditorialLayout>
  )
}

