import React from 'react'
import { Card } from './Card'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  onClick?: () => void
  className?: string
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      label,
      value,
      icon,
      trend,
      variant = 'default',
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    // Variant background styles
    const variantStyles = {
      default: 'bg-white',
      primary: 'bg-primary-50 border-l-4 border-primary-500',
      success: 'bg-success-50 border-l-4 border-success-500',
      warning: 'bg-warning-50 border-l-4 border-warning-500',
      danger: 'bg-danger-50 border-l-4 border-danger-500',
    }

    // Trend arrow colors
    const trendColors = {
      up: 'text-success-600',
      down: 'text-danger-600',
      neutral: 'text-gray-500',
    }

    // Trend arrows
    const trendArrows = {
      up: (
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
            clipRule="evenodd"
          />
        </svg>
      ),
      down: (
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
            clipRule="evenodd"
          />
        </svg>
      ),
      neutral: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14"
          />
        </svg>
      ),
    }

    return (
      <Card
        ref={ref}
        variant="default"
        padding="md"
        hover={!!onClick}
        onClick={onClick}
        className={`${variantStyles[variant]} ${className}`}
        {...props}
      >
        {/* Icon + Label */}
        <div className="flex items-center gap-2 mb-3">
          {icon && (
            <div className="text-gray-500 flex-shrink-0" aria-hidden="true">
              {icon}
            </div>
          )}
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>

        {/* Value */}
        <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>

        {/* Trend (optional) */}
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm ${
              trendColors[trend.direction]
            }`}
          >
            {trendArrows[trend.direction]}
            <span className="font-medium">
              {Math.abs(trend.value)}%
            </span>
            <span className="text-gray-500">from last week</span>
          </div>
        )}
      </Card>
    )
  }
)

StatCard.displayName = 'StatCard'
