'use client'

import { useState, useMemo, useCallback } from 'react'
import BookingHistory from './BookingHistory'
import { isRetrying } from '@/lib/booking-error-utils'
import { getBookingHistory } from '@/app/actions/booking-history'
import type { BookingHistoryItem, BookingStatus, StatusCounts } from '@/app/actions/booking-history'

const PAGE_SIZE = 50
const DAYS = 90

type Props = {
  initialHistory: BookingHistoryItem[]
  totalCount: number
  statusCounts?: StatusCounts
}

// Filter includes 'retrying' which is a derived display status
type FilterOption = 'all' | BookingStatus | 'retrying'

/**
 * BookingHistoryWrapper - Client wrapper for filtering and pagination
 *
 * Handles client-side filtering and Load More pagination.
 * 'Class Full' is a derived status from failed bookings where the class was full.
 */
export default function BookingHistoryWrapper({ initialHistory, totalCount, statusCounts }: Props) {
  const [history, setHistory] = useState<BookingHistoryItem[]>(initialHistory)
  const [filter, setFilter] = useState<FilterOption>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Helper to check if an item is a "class full" situation
  const isItemClassFull = (item: BookingHistoryItem) =>
    isRetrying(item.status, item.error_message)

  // Filter history based on selected status
  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history
    if (filter === 'retrying') {
      return history.filter(isItemClassFull)
    }
    if (filter === 'failed') {
      return history.filter(item => item.status === 'failed' && !isItemClassFull(item))
    }
    return history.filter(item => item.status === filter)
  }, [history, filter])

  // Use server-provided counts for filter pills (shows total, not just loaded)
  // Fall back to computing from loaded history if statusCounts not provided
  const counts = useMemo(() => {
    if (statusCounts) {
      return {
        all: statusCounts.all,
        confirmed: statusCounts.confirmed,
        waitlisted: statusCounts.waitlisted,
        retrying: statusCounts.classFull,
        failed: statusCounts.failed,
      }
    }
    // Fallback: compute from loaded history
    const retryingCount = history.filter(isItemClassFull).length
    const actualFailedCount = history.filter(h => h.status === 'failed' && !isItemClassFull(h)).length
    return {
      all: history.length,
      confirmed: history.filter(h => h.status === 'confirmed').length,
      waitlisted: history.filter(h => h.status === 'waitlisted').length,
      retrying: retryingCount,
      failed: actualFailedCount,
    }
  }, [history, statusCounts])

  // Check if there are more items to load
  const hasMore = history.length < totalCount

  // Load more items
  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const result = await getBookingHistory(DAYS, PAGE_SIZE, history.length)
      if (result.success && result.history) {
        setHistory(prev => [...prev, ...result.history!])
      }
    } catch (error) {
      console.error('Failed to load more history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [history.length, hasMore, isLoading])

  return (
    <div className="w-full">
      <BookingHistory
        history={filteredHistory}
        totalCount={filteredHistory.length}
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        hasMore={hasMore}
        remainingCount={totalCount - history.length}
        isLoadingMore={isLoading}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}
