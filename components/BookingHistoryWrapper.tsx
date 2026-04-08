'use client'

import { useState, useCallback } from 'react'
import BookingHistory from './BookingHistory'
import { getBookingHistory } from '@/app/actions/booking-history'
import type { BookingHistoryItem, StatusCounts, FilterOption } from '@/app/actions/booking-history'

const PAGE_SIZE = 50
const DAYS = 90

type Props = {
  initialHistory: BookingHistoryItem[]
  totalCount: number
  statusCounts?: StatusCounts
}

/**
 * BookingHistoryWrapper - Client wrapper for per-filter fetching and pagination
 *
 * Each filter fetches its own data from the server. This ensures:
 * - Accurate counts: "Booked (32)" shows all 32 booked items
 * - Proper pagination: Load More only appears if filter has >50 items
 * - Simple mental model: each filter is its own independent view
 */
export default function BookingHistoryWrapper({ initialHistory, totalCount, statusCounts }: Props) {
  const [filter, setFilter] = useState<FilterOption>('all')
  const [history, setHistory] = useState<BookingHistoryItem[]>(initialHistory)
  const [filterTotal, setFilterTotal] = useState(totalCount)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Counts for filter pills (always from server, doesn't change)
  const counts = statusCounts ? {
    all: statusCounts.all,
    confirmed: statusCounts.confirmed,
    waitlisted: statusCounts.waitlisted,
    retrying: statusCounts.classFull,
    no_registration: statusCounts.noRegistration,
    failed: statusCounts.failed,
  } : {
    all: totalCount,
    confirmed: 0,
    waitlisted: 0,
    retrying: 0,
    no_registration: 0,
    failed: 0,
  }

  // Handle filter change - fetch fresh data for the new filter
  const handleFilterChange = useCallback(async (newFilter: FilterOption) => {
    // If switching back to 'all' and we have initial data, we could optimize
    // For now, always fetch fresh to ensure accuracy
    setFilter(newFilter)
    setIsLoading(true)

    try {
      const result = await getBookingHistory(DAYS, PAGE_SIZE, 0, newFilter)
      if (result.success && result.history) {
        setHistory(result.history)
        setFilterTotal(result.totalCount ?? 0)
      }
    } catch (error) {
      console.error('Failed to fetch filtered history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load more items for the current filter
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || history.length >= filterTotal) return

    setIsLoadingMore(true)
    try {
      const result = await getBookingHistory(DAYS, PAGE_SIZE, history.length, filter)
      if (result.success && result.history) {
        setHistory(prev => [...prev, ...result.history!])
      }
    } catch (error) {
      console.error('Failed to load more history:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [history.length, filterTotal, filter, isLoadingMore])

  // Check if there are more items to load for the current filter
  const hasMore = history.length < filterTotal
  const remainingCount = filterTotal - history.length

  return (
    <div className="w-full">
      {isLoading ? (
        // Loading skeleton while fetching new filter
        <div className="space-y-6 animate-pulse">
          {/* Filter pills skeleton */}
          <div className="flex flex-wrap gap-2 pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
          {/* Cards skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <BookingHistory
          history={history}
          totalCount={filterTotal}
          filter={filter}
          onFilterChange={handleFilterChange}
          counts={counts}
          hasMore={hasMore}
          remainingCount={remainingCount}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
        />
      )}
    </div>
  )
}
