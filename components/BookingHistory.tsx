'use client'

import { Badge } from '@/components/ui'
import BookingHistoryCard from './BookingHistoryCard'
import { format } from 'date-fns'
import type { BookingHistoryItem, BookingStatus } from '@/app/actions/booking-history'

// Filter includes 'retrying' which is a derived display status (not a database status)
type FilterOption = 'all' | BookingStatus | 'retrying'

type FilterCounts = {
  all: number
  confirmed: number
  waitlisted: number
  retrying: number
  failed: number
}

type Props = {
  history: BookingHistoryItem[]
  totalCount: number
  filter?: FilterOption
  onFilterChange?: (filter: FilterOption) => void
  counts?: FilterCounts
  // Load More pagination
  hasMore?: boolean
  remainingCount?: number
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

// Filter button configuration
const filterButtons: { id: FilterOption; label: string; variant: 'default' | 'success' | 'warning' | 'primary' | 'danger' }[] = [
  { id: 'all', label: 'All', variant: 'default' },
  { id: 'confirmed', label: 'Booked', variant: 'success' },
  { id: 'waitlisted', label: 'Waitlisted', variant: 'warning' },
  { id: 'retrying', label: 'Class Full', variant: 'primary' },
  { id: 'failed', label: 'Failed', variant: 'danger' },
]

/**
 * BookingHistory - Full history list with date grouping and filtering
 *
 * Displays booking history grouped by date with expandable error details.
 * Supports client-side filtering by status (All, Booked, Waitlisted, Failed).
 */
export default function BookingHistory({
  history,
  totalCount,
  filter = 'all',
  onFilterChange,
  counts,
  hasMore,
  remainingCount = 0,
  isLoadingMore,
  onLoadMore,
}: Props) {
  // Group history by date
  const groupedHistory = history.reduce((groups, item) => {
    const date = format(new Date(item.created_at), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {} as Record<string, BookingHistoryItem[]>)

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a))

  return (
    <div className="w-full space-y-6">
      {/* Filter buttons */}
      {onFilterChange && counts && (
        <div className="flex flex-wrap gap-2 pb-2">
          {filterButtons.map(btn => {
            const count = counts[btn.id]
            const isActive = filter === btn.id

            // Color classes for each variant (active vs inactive)
            const colorClasses = {
              success: isActive
                ? 'bg-success-100 text-success-700 ring-1 ring-success-300'
                : 'bg-success-50 text-success-600 hover:bg-success-100 border border-success-200',
              warning: isActive
                ? 'bg-warning-100 text-warning-700 ring-1 ring-warning-300'
                : 'bg-warning-50 text-warning-600 hover:bg-warning-100 border border-warning-200',
              primary: isActive
                ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200',
              danger: isActive
                ? 'bg-danger-100 text-danger-700 ring-1 ring-danger-300'
                : 'bg-danger-50 text-danger-600 hover:bg-danger-100 border border-danger-200',
              default: isActive
                ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-300'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200',
            }

            const countClasses = {
              success: isActive ? 'bg-success-200 text-success-800' : 'bg-success-100 text-success-700',
              warning: isActive ? 'bg-warning-200 text-warning-800' : 'bg-warning-100 text-warning-700',
              primary: isActive ? 'bg-primary-200 text-primary-800' : 'bg-primary-100 text-primary-700',
              danger: isActive ? 'bg-danger-200 text-danger-800' : 'bg-danger-100 text-danger-700',
              default: isActive ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600',
            }

            return (
              <button
                key={btn.id}
                onClick={() => onFilterChange(btn.id)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${colorClasses[btn.variant]}
                `}
              >
                {btn.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${countClasses[btn.variant]}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state for filtered results */}
      {history.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <p className="text-gray-500 font-dm-sans">
            No {filter === 'confirmed' ? 'booked' : filter === 'retrying' ? 'retrying' : filter} bookings found.
          </p>
        </div>
      )}

      {/* Date-grouped booking cards */}
      {sortedDates.map((date) => {
        const items = groupedHistory[date]
        const dateObj = new Date(date)
        const isToday = format(new Date(), 'yyyy-MM-dd') === date
        const dateLabel = isToday ? 'Today' : format(dateObj, 'EEEE, MMM d')

        return (
          <section key={date} className="w-full">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-sora font-semibold text-gray-800">
                {dateLabel}
              </h3>
              <Badge variant="default" size="sm" diagonal={false}>
                {items.length} {items.length === 1 ? 'attempt' : 'attempts'}
              </Badge>
            </div>

            {/* Booking cards */}
            <div className="space-y-3">
              {items.map((item) => (
                <BookingHistoryCard
                  key={item.id}
                  item={item}
                  compact={false}
                />
              ))}
            </div>
          </section>
        )
      })}

      {/* Load More button - visible but secondary */}
      {hasMore && onLoadMore && filter === 'all' && (
        <div className="pt-8 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl
              font-dm-sans text-sm font-medium
              text-gray-600 hover:text-gray-800
              bg-gray-100 hover:bg-gray-200
              border border-gray-200 hover:border-gray-300
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 ease-out
              hover:shadow-sm"
          >
            {isLoadingMore ? (
              <>
                <svg className="w-4 h-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>Load More</span>
                <span className="text-gray-600">· {remainingCount} remaining</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Summary footer - refined but readable */}
      {history.length > 0 && (
        <div className="pt-10 flex flex-col items-center gap-4">
          {/* Decorative separator - more visible */}
          <div className="w-16 h-px bg-gray-300" />

          {/* Summary text - better contrast */}
          <p className="text-sm text-gray-500 font-dm-sans tracking-wide">
            {hasMore && filter === 'all' ? (
              <>
                <span className="tabular-nums font-medium text-gray-600">{totalCount}</span>
                <span className="mx-2 text-gray-400">of</span>
                <span className="tabular-nums font-medium text-gray-600">{totalCount + remainingCount}</span>
                <span className="ml-1.5">attempts</span>
              </>
            ) : (
              <>
                <span className="tabular-nums font-medium text-gray-600">{totalCount}</span>
                <span className="ml-1.5">{totalCount === 1 ? 'attempt' : 'attempts'}</span>
                {filter !== 'all' && (
                  <span className="text-gray-400 ml-2">· filtered</span>
                )}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
