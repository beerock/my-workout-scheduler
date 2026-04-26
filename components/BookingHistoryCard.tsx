'use client'

import { useState } from 'react'
import { Card, Badge } from '@/components/ui'
import { getDayName, formatTime12Hour } from '@/lib/date-utils'
import { format, formatDistanceToNow } from 'date-fns'
import { categorizeFailure, generateSupportMailto, isRetrying, getRetryingCategoryInfo } from '@/lib/booking-error-utils'
import type { BookingHistoryItem, BookingStatus } from '@/app/actions/booking-history'

// Display status includes 'retrying' which is derived from failed + class full + future class time
type DisplayStatus = BookingStatus | 'retrying'

type Props = {
  item: BookingHistoryItem
  compact?: boolean // true for RecentBookings, false for full history
  animationDelay?: string
}

// Status badge configuration (includes derived 'retrying' status for class full)
// Note: 'info' variant uses primary blue color in the Badge component
const statusConfig: Record<DisplayStatus, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
  confirmed: { variant: 'success', label: 'Booked' },
  waitlisted: { variant: 'warning', label: 'Waitlisted' },
  retrying: { variant: 'info', label: 'Class Full' },
  no_registration: { variant: 'info', label: 'No Auto-Reg' },
  failed: { variant: 'danger', label: 'Failed' },
}

// Icon components for error categories
function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function ChevronIcon({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <svg
      className={`${className} transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

// Map icon names to components
const iconComponents = {
  'alert-triangle': AlertTriangleIcon,
  'settings': SettingsIcon,
  'refresh-cw': RefreshIcon,
}

// Map variants to text colors
const variantColors = {
  danger: 'text-danger-600',
  warning: 'text-warning-600',
  info: 'text-primary-600',
  primary: 'text-primary-600',
}

/**
 * BookingHistoryCard - Shared card component for booking history items
 *
 * Displays booking attempt with status, class info, and time.
 * For failed bookings, shows expandable error details with category and "Contact Us" link.
 */
export default function BookingHistoryCard({ item, compact = false, animationDelay = '0s' }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Check if this failed booking is a "class full" situation (informational, not an error)
  const isClassFull = isRetrying(item.status, item.error_message)

  // Determine display status (may differ from database status)
  const displayStatus: DisplayStatus = isClassFull ? 'retrying' : item.status
  const config = statusConfig[displayStatus]

  // Get error category for failed bookings (not retrying ones)
  const errorInfo = item.status === 'failed' && !isClassFull
    ? categorizeFailure(item.error_message)
    : isClassFull
      ? getRetryingCategoryInfo()
      : null
  const IconComponent = errorInfo ? iconComponents[errorInfo.icon] : null

  // Generate mailto link for actual failed bookings (not retrying)
  const mailtoLink = item.status === 'failed' && !isClassFull && item.error_message
    ? generateSupportMailto({
        className: item.class_type,
        dayOfWeek: getDayName(item.day_of_week),
        classTime: formatTime12Hour(item.class_time),
        branch: item.branch,
        errorCategory: errorInfo?.label || 'Unknown',
        errorMessage: item.error_message,
        attemptDate: format(new Date(item.created_at), 'MMM d, yyyy h:mm a'),
      })
    : null

  // Status dot color
  const statusDotColor =
    displayStatus === 'confirmed' ? 'bg-success-500' :
    displayStatus === 'waitlisted' ? 'bg-warning-500' :
    displayStatus === 'retrying' ? 'bg-primary-500' :
    displayStatus === 'no_registration' ? 'bg-primary-500' :
    'bg-danger-500'

  // Only apply animation if delay is provided (initial load, not filtering)
  const animationClasses = animationDelay
    ? 'opacity-0 animate-fade-in-up'
    : ''

  return (
    <Card
      variant="outlined"
      padding="sm"
      className={`w-full rounded-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${animationClasses}`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      {/* Main content row */}
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Status indicator dot */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${statusDotColor}`} />

        {/* Class info - takes remaining space */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-dm-sans font-medium text-gray-900 truncate">
              {item.class_type}
            </span>
            <Badge variant={config.variant} size="sm" diagonal className="flex-shrink-0">
              {config.label}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 font-dm-sans truncate">
            {getDayName(item.day_of_week)} {formatTime12Hour(item.class_time)} @ {item.branch}
          </div>
        </div>

        {/* Time info - fixed width */}
        <div className="text-right flex-shrink-0">
          {item.attemptCount > 1 && !compact ? (
            // Full history: show time range (first → last) and attempt count
            <>
              <div className="text-sm text-gray-500 font-dm-sans">
                {format(new Date(item.firstAttemptAt), 'h:mm a')}
                {' – '}
                {format(new Date(item.created_at), 'h:mm a')}
              </div>
              <div className="text-xs text-gray-400 font-dm-sans">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </div>
              <div className="text-xs text-gray-400 font-dm-sans mt-0.5">
                {item.attemptCount} attempts
              </div>
            </>
          ) : (
            // Single attempt or compact view: show date/time as usual
            <>
              <div className="text-sm text-gray-500 font-dm-sans">
                {compact
                  ? format(new Date(item.created_at), 'MMM d')
                  : format(new Date(item.created_at), 'h:mm a')
                }
              </div>
              <div className="text-xs text-gray-400 font-dm-sans">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </div>
              {item.attemptCount > 1 && (
                <div className="text-xs text-gray-400 font-dm-sans mt-0.5">
                  {item.attemptCount} attempts
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Retrying info section - informational, non-expandable */}
      {isClassFull && errorInfo && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {IconComponent && (
              <IconComponent className={`w-4 h-4 ${variantColors[errorInfo.variant]}`} />
            )}
            <span className={`text-sm ${variantColors[errorInfo.variant]}`}>
              {errorInfo.description}
            </span>
          </div>
        </div>
      )}

      {/* No registration info section - informational, non-expandable */}
      {displayStatus === 'no_registration' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm text-primary-600">
            This class doesn&apos;t offer online registration. Check with your YMCA branch for details.
          </span>
        </div>
      )}

      {/* Error section for actual failed bookings (not retrying) */}
      {item.status === 'failed' && !isClassFull && errorInfo && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {/* Error category header with expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-left group"
            aria-expanded={expanded}
            aria-controls={`error-details-${item.id}`}
          >
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className={`w-4 h-4 ${variantColors[errorInfo.variant]}`} />
              )}
              <span className={`text-sm font-medium ${variantColors[errorInfo.variant]}`}>
                {errorInfo.label}
              </span>
            </div>
            <ChevronIcon expanded={expanded} className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>

          {/* Expandable error details */}
          <div
            id={`error-details-${item.id}`}
            className={`grid transition-all duration-200 ease-out ${
              expanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              {/* Error details — grouped by category when multiple categories present */}
              {item.errorGroups && item.errorGroups.length > 1 ? (
                <div className="space-y-2">
                  {item.errorGroups.map(group => {
                    const GroupIcon = iconComponents[group.icon]
                    return (
                      <div key={group.category} className="p-3 bg-gray-50 rounded-lg">
                        <div className={`flex items-center gap-1.5 mb-1.5 ${variantColors[group.variant]}`}>
                          {GroupIcon && <GroupIcon className="w-3.5 h-3.5 flex-shrink-0" />}
                          <span className="text-xs font-medium">{group.label}</span>
                          {group.count > 1 && (
                            <span className="text-xs text-gray-400 ml-auto">· {group.count} attempts</span>
                          )}
                        </div>
                        {group.messages.map((msg, i) => (
                          <p key={i} className="text-xs text-gray-600 font-dm-sans whitespace-pre-line break-words">
                            {msg}
                          </p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-dm-sans whitespace-pre-line break-words">
                    {item.error_message}
                  </p>
                </div>
              )}

              {/* Contact support link */}
              {mailtoLink && (
                <a
                  href={mailtoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <MailIcon className="w-3.5 h-3.5" />
                  Contact Us
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
