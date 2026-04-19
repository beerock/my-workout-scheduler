'use client'

/**
 * WaitlistAdminTable — admin-only review surface for public waitlist submissions.
 *
 * Admin can:
 *  - Mark a row as "invited" (sets status=invited, invited_at=now)
 *  - Decline a row (sets status=declined; kept for audit)
 *  - Delete a row (hard delete)
 *
 * Uses optimistic-ish UX: actions call server action → re-render via
 * revalidatePath inside the action. Failures surface as an inline alert
 * above the table (not per row — keeps the UI simple for a single-admin tool).
 */

import { useState, useTransition } from 'react'
import { Alert, Button } from '@/components/ui'
import {
  markWaitlistInvited,
  markWaitlistDeclined,
  deleteWaitlistEntry,
} from '@/app/actions/admin-waitlist'
import type { WaitlistSignup } from '@/lib/database.types'

type Props = {
  signups: WaitlistSignup[]
}

const statusStyles: Record<WaitlistSignup['status'], string> = {
  pending: 'bg-warning-100 text-warning-800',
  invited: 'bg-success-100 text-success-800',
  declined: 'bg-gray-100 text-gray-600',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function WaitlistAdminTable({ signups }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const runAction = (fn: () => Promise<void>) => {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed.')
      }
    })
  }

  if (signups.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center font-dm-sans text-sm text-gray-500">
        No waitlist signups yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-sora text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Email
              </th>
              <th className="px-4 py-3 text-left font-sora text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left font-sora text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Note
              </th>
              <th className="px-4 py-3 text-left font-sora text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Submitted
              </th>
              <th className="px-4 py-3 text-right font-sora text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {signups.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-dm-sans text-sm text-gray-900 whitespace-nowrap">
                  {s.email}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-dm-sans font-medium ${statusStyles[s.status]}`}
                  >
                    {s.status}
                  </span>
                  {s.status === 'invited' && s.invited_at && (
                    <div className="mt-0.5 font-dm-sans text-xs text-gray-500">
                      {formatDate(s.invited_at)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-dm-sans text-sm text-gray-700 max-w-xs">
                  {s.note ?? <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 font-dm-sans text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(s.created_at)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex gap-2 justify-end">
                    {s.status !== 'invited' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => runAction(() => markWaitlistInvited(s.id))}
                        disabled={pending}
                      >
                        Mark invited
                      </Button>
                    )}
                    {s.status !== 'declined' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runAction(() => markWaitlistDeclined(s.id))}
                        disabled={pending}
                      >
                        Decline
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete waitlist entry for ${s.email}?`)) {
                          runAction(() => deleteWaitlistEntry(s.id))
                        }
                      }}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
