'use client'

import { Card, Badge } from '@/components/ui'
import { getDayName, formatTime12Hour } from '@/lib/date-utils'
import { format, formatDistanceToNow } from 'date-fns'
import type { BookingHistoryItem } from '@/app/actions/booking-history'

type Props = {
  history: BookingHistoryItem[]
}

// Status badge mapping aligned with NOTIFICATIONS_DESIGN.md
const statusConfig: Record<BookingHistoryItem['status'], { variant: 'success' | 'warning' | 'danger' | 'default' | 'info'; label: string }> = {
  confirmed: { variant: 'success', label: 'Booked' },
  waitlisted: { variant: 'warning', label: 'Waitlisted' },
  pending: { variant: 'info', label: 'Pending' },
  failed: { variant: 'danger', label: 'Failed' },
  skipped: { variant: 'default', label: 'Skipped' },
}

export default function BookingHistory({ history }: Props) {
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
    <div className="space-y-6">
      {sortedDates.map((date, dateIndex) => {
        const items = groupedHistory[date]
        const dateObj = new Date(date)
        const isToday = format(new Date(), 'yyyy-MM-dd') === date
        const dateLabel = isToday ? 'Today' : format(dateObj, 'EEEE, MMM d')

        return (
          <div
            key={date}
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${dateIndex * 0.1}s` }}
          >
            <h3 className="font-sora font-semibold text-gray-700 mb-3 flex items-center gap-2">
              {dateLabel}
              <Badge variant="default" size="sm">{items.length}</Badge>
            </h3>

            <div className="space-y-2">
              {items.map((item, itemIndex) => {
                const config = statusConfig[item.status]

                return (
                  <Card
                    key={item.id}
                    variant="outlined"
                    padding="sm"
                    className="rounded-xl opacity-0 animate-fade-in-up hover:-translate-y-1 transition-all duration-300"
                    style={{ animationDelay: `${(dateIndex * 0.1) + (itemIndex * 0.05)}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Status indicator */}
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'confirmed' ? 'bg-success-500' :
                          item.status === 'waitlisted' ? 'bg-warning-500' :
                          item.status === 'failed' ? 'bg-danger-500' :
                          item.status === 'pending' ? 'bg-primary-500' :
                          'bg-gray-400'
                        }`} />

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-dm-sans font-medium text-gray-900">
                              {item.class_type}
                            </span>
                            <Badge variant={config.variant} size="sm" diagonal>
                              {config.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 font-dm-sans">
                            {getDayName(item.day_of_week)} {formatTime12Hour(item.class_time)} @ {item.branch}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500 font-dm-sans">
                          {format(new Date(item.created_at), 'h:mm a')}
                        </div>
                        <div className="text-xs text-gray-400 font-dm-sans">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Error message if failed */}
                    {item.status === 'failed' && item.error_message && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-sm text-danger-600 font-dm-sans">
                          {item.error_message}
                        </p>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
