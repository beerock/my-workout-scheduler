import React from 'react'

export interface StatusIndicatorProps {
  status: 'confirmed' | 'pending' | 'waitlisted' | 'failed' | 'skipped' | 'retrying'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
  className?: string
}

export const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  (
    {
      status,
      showLabel = true,
      size = 'md',
      tooltip,
      className = '',
      ...props
    },
    ref
  ) => {
    // Status colors for dots
    const dotColors = {
      confirmed: 'bg-status-confirmed',
      pending: 'bg-status-pending',
      waitlisted: 'bg-status-waitlisted',
      failed: 'bg-status-failed',
      skipped: 'bg-status-skipped',
      retrying: 'bg-status-retrying',
    }

    // Status labels
    const labels = {
      confirmed: 'Booked',
      pending: 'Pending',
      waitlisted: 'Waitlisted',
      failed: 'Failed',
      skipped: 'Skipped',
      retrying: 'Retrying',
    }

    // Dot sizes
    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    }

    // Text sizes
    const textSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    }

    // Add pulse animation for retrying status
    const isPulsing = status === 'retrying'

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 ${className}`}
        title={tooltip}
        {...props}
      >
        {/* Colored dot */}
        <span
          className={`${dotSizes[size]} ${dotColors[status]} rounded-full ${
            isPulsing ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />

        {/* Label text */}
        {showLabel && (
          <span className={`${textSizes[size]} font-medium text-gray-700`}>
            {labels[status]}
          </span>
        )}

        {/* Screen reader text if label is hidden */}
        {!showLabel && <span className="sr-only">{labels[status]}</span>}
      </span>
    )
  }
)

StatusIndicator.displayName = 'StatusIndicator'
