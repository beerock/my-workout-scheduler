import React from 'react'

export interface BadgeProps {
  status?: 'confirmed' | 'pending' | 'waitlisted' | 'failed' | 'skipped' | 'retrying'
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  diagonal?: boolean // Design System v2 - diagonal clip-path
  children: React.ReactNode
  className?: string
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      status,
      variant = 'default',
      size = 'md',
      icon,
      diagonal = true, // Default to diagonal for v2
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles - Design System v2
    const baseStyles = 'inline-flex items-center font-dm-sans font-medium'

    // Status-specific styles with gradients (overrides variant if status is provided)
    const statusStyles = {
      confirmed: 'bg-gradient-success text-white',
      pending: 'bg-gradient-warning text-white',
      waitlisted: 'bg-gradient-primary text-white',
      failed: 'bg-gradient-danger text-white',
      skipped: 'bg-gray-500 text-white',
      retrying: 'bg-gradient-warning text-white animate-pulse',
    }

    // Generic variant styles with gradients
    const variantStyles = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-gradient-success text-white',
      warning: 'bg-gradient-warning text-white',
      danger: 'bg-gradient-danger text-white',
      info: 'bg-gradient-primary text-white',
      purple: 'bg-gradient-purple text-white',
    }

    // Size styles - adjusted padding for diagonal shape
    const sizeStyles = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-1.5 text-sm',
    }

    // Default icons for status badges
    const statusIcons = {
      confirmed: (
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
      pending: (
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      ),
      waitlisted: (
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
        </svg>
      ),
      failed: (
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
      skipped: (
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
        </svg>
      ),
      retrying: (
        <svg
          className="w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
      ),
    }

    // Determine which styles to use
    const colorStyles = status ? statusStyles[status] : variantStyles[variant]

    // Determine which icon to use
    const displayIcon = icon || (status && statusIcons[status])

    // Shape styles - diagonal or rounded
    const shapeStyles = diagonal ? 'clip-diagonal-badge' : 'rounded-full'

    // Combine styles
    const combinedClassName = `${baseStyles} ${colorStyles} ${sizeStyles[size]} ${shapeStyles} ${className}`

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {displayIcon}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
