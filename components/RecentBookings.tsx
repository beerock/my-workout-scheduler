'use client'

import { Card, Badge, Button } from '@/components/ui'
import { getDayName, formatTime12Hour } from '@/lib/date-utils'
import { format, formatDistanceToNow } from 'date-fns'
import type { BookingHistoryItem } from '@/app/actions/booking-history'
import Link from 'next/link'

type Props = {
  history: BookingHistoryItem[]
}

// Status badge mapping
const statusConfig: Record<BookingHistoryItem['status'], { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; label: string }> = {
  confirmed: { variant: 'success', label: 'Booked' },
  waitlisted: { variant: 'warning', label: 'Waitlisted' },
  pending: { variant: 'info', label: 'Pending' },
  failed: { variant: 'danger', label: 'Failed' },
  skipped: { variant: 'default', label: 'Skipped' },
}

/**
 * RecentBookings - Compact list of recent booking attempts
 *
 * Shows the last N booking attempts in a streamlined format
 * for the Schedule page's "Recent Bookings" section.
 */
export default function RecentBookings({ history }: Props) {
  if (history.length === 0) {
    return (
      <Card
        variant="outlined"
        padding="lg"
        className="text-center opacity-0 animate-fade-in-up hover:-translate-y-1 transition-all duration-300"
        style={{ animationDelay: '0.45s' }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h3 className="font-sora text-base font-semibold text-gray-900 mb-1">
          No booking history yet
        </h3>
        <p className="text-sm text-gray-500 font-dm-sans">
          Your booking activity will appear here once classes start getting booked.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((item, index) => {
        const config = statusConfig[item.status]

        return (
          <Card
            key={item.id}
            variant="outlined"
            padding="sm"
            className="rounded-xl opacity-0 animate-fade-in-up hover:-translate-y-1 transition-all duration-300"
            style={{ animationDelay: `${0.45 + index * 0.05}s` }}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Left: Status dot + Class info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status indicator dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  item.status === 'confirmed' ? 'bg-success-500' :
                  item.status === 'waitlisted' ? 'bg-warning-500' :
                  item.status === 'failed' ? 'bg-danger-500' :
                  item.status === 'pending' ? 'bg-primary-500 animate-pulse' :
                  'bg-gray-400'
                }`} />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-dm-sans font-medium text-gray-900 truncate">
                      {item.class_type}
                    </span>
                    <Badge variant={config.variant} size="sm" diagonal>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 font-dm-sans truncate">
                    {getDayName(item.day_of_week)} {formatTime12Hour(item.class_time)} @ {item.branch}
                  </div>
                </div>
              </div>

              {/* Right: Time info */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm text-gray-600 font-dm-sans">
                  {format(new Date(item.created_at), 'MMM d')}
                </div>
                <div className="text-xs text-gray-400 font-dm-sans">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Error message if failed - collapsed by default */}
            {item.status === 'failed' && item.error_message && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-danger-600 font-dm-sans line-clamp-2">
                  {item.error_message}
                </p>
              </div>
            )}
          </Card>
        )
      })}

      {/* See all link for mobile (also shown in header on desktop) */}
      {history.length >= 5 && (
        <div className="pt-2 text-center sm:hidden">
          <Link href="/dashboard/schedule/history">
            <Button variant="ghost" size="sm">
              View All History →
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
