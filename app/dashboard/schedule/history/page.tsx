import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getBookingHistory } from '@/app/actions/booking-history'
import EditorialLayout from '@/components/EditorialLayout'
import BookingHistoryWrapper from '@/components/BookingHistoryWrapper'
import { Card } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Booking History',
}

const DAYS = 90
const INITIAL_ITEMS = 50 // Load initial batch, then Load More

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Load initial batch with total count for pagination and status counts for pills
  const historyResult = await getBookingHistory(DAYS, INITIAL_ITEMS, 0)
  const history = historyResult.success ? historyResult.history || [] : []
  const totalCount = historyResult.success ? historyResult.totalCount || 0 : 0
  const statusCounts = historyResult.success ? historyResult.statusCounts : undefined

  return (
    <EditorialLayout
      title="Booking History"
      subtitle="Showing the last 90 days of booking activity"
      backLink={{ href: '/dashboard/schedule', label: 'Schedule' }}
    >
      {history.length > 0 || totalCount > 0 ? (
        <BookingHistoryWrapper initialHistory={history} totalCount={totalCount} statusCounts={statusCounts} />
      ) : (
        <Card
          variant="outlined"
          padding="lg"
          className="text-center py-12 opacity-0 animate-fade-in-up hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="font-sora text-lg font-semibold text-gray-900 mb-2">
            No booking history yet
          </h3>
          <p className="text-gray-500 font-dm-sans max-w-sm mx-auto">
            Your booking activity will appear here once classes start getting booked.
          </p>
        </Card>
      )}
    </EditorialLayout>
  )
}
