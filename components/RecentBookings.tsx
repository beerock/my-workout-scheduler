'use client'

import { Card, Button } from '@/components/ui'
import BookingHistoryCard from './BookingHistoryCard'
import type { BookingHistoryItem } from '@/app/actions/booking-history'
import Link from 'next/link'

type Props = {
  history: BookingHistoryItem[]
}

/**
 * RecentBookings - Compact list of recent booking attempts
 *
 * Shows the last N booking attempts in a streamlined format
 * for the Schedule page's "Recent Bookings" section.
 * Only displays completed statuses (confirmed, waitlisted, failed).
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
      {history.map((item, index) => (
        <BookingHistoryCard
          key={item.id}
          item={item}
          compact={true}
          animationDelay={`${0.3 + index * 0.03}s`}
        />
      ))}

      {/* See all link for mobile (also shown in header on desktop) */}
      {history.length >= 5 && (
        <div className="pt-2 text-center sm:hidden">
          <Link href="/dashboard/schedule/history">
            <Button variant="ghost" size="sm">
              View All History
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
