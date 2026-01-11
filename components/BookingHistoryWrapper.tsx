'use client'

import { useState, useMemo } from 'react'
import BookingHistory from './BookingHistory'
import { isRetrying } from '@/lib/booking-error-utils'
import type { BookingHistoryItem, BookingStatus } from '@/app/actions/booking-history'

type Props = {
  history: BookingHistoryItem[]
}

// Filter includes 'retrying' which is a derived display status
type FilterOption = 'all' | BookingStatus | 'retrying'

/**
 * BookingHistoryWrapper - Client wrapper for filtering
 *
 * Handles client-side filtering of booking history.
 * All data is loaded upfront for instant filter switching.
 * 'Class Full' is a derived status from failed bookings where the class was full.
 */
export default function BookingHistoryWrapper({ history }: Props) {
  const [filter, setFilter] = useState<FilterOption>('all')

  // Helper to check if an item is a "class full" situation
  const isItemClassFull = (item: BookingHistoryItem) =>
    isRetrying(item.status, item.error_message)

  // Filter history based on selected status
  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history
    if (filter === 'retrying') {
      // Show items that are active retries (class full + future class time)
      return history.filter(isItemClassFull)
    }
    if (filter === 'failed') {
      // Show only actual failures (not active retries)
      return history.filter(item => item.status === 'failed' && !isItemClassFull(item))
    }
    return history.filter(item => item.status === filter)
  }, [history, filter])

  // Count items by status for filter buttons
  const counts = useMemo(() => {
    const retryingCount = history.filter(isItemClassFull).length
    const actualFailedCount = history.filter(h => h.status === 'failed' && !isItemClassFull(h)).length

    return {
      all: history.length,
      confirmed: history.filter(h => h.status === 'confirmed').length,
      waitlisted: history.filter(h => h.status === 'waitlisted').length,
      retrying: retryingCount,
      failed: actualFailedCount,
    }
  }, [history])

  return (
    <div className="w-full">
      <BookingHistory
        history={filteredHistory}
        totalCount={filteredHistory.length}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />
    </div>
  )
}
