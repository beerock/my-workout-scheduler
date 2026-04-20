import type { Metadata } from 'next'
import { listWaitlistSignups } from '@/app/actions/admin-waitlist'
import { WaitlistAdminTable } from '@/components/WaitlistAdminTable'

export const metadata: Metadata = {
  title: 'Waitlist — Admin',
}

export default async function AdminWaitlistPage() {
  // Layout already gates on admin. Still calls the assertAdmin-guarded
  // server action so non-admin access fails explicitly.
  const signups = await listWaitlistSignups()

  const pendingCount = signups.filter((s) => s.status === 'pending').length
  const invitedCount = signups.filter((s) => s.status === 'invited').length
  const declinedCount = signups.filter((s) => s.status === 'declined').length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-sora text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Waitlist
        </h1>
        <p className="font-dm-sans text-sm text-gray-600">
          {signups.length} {signups.length === 1 ? 'signup' : 'signups'} ·{' '}
          <span className="text-warning-700 font-medium">{pendingCount} pending</span> ·{' '}
          <span className="text-success-700">{invitedCount} invited</span> ·{' '}
          <span className="text-gray-500">{declinedCount} declined</span>
        </p>
      </div>

      <WaitlistAdminTable signups={signups} />
    </div>
  )
}
