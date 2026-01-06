'use client'

import React from 'react'

export interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info'
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

const variantStyles = {
  error: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    accent: '#f43f5e',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    accent: '#00c853',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    accent: '#ff9500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    accent: '#1a6fff',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
}

export function Alert({ variant, children, onDismiss, className = '' }: AlertProps) {
  const styles = variantStyles[variant]

  return (
    <div
      className={`relative ${styles.bg} ${styles.border} border rounded-lg px-4 py-3 overflow-hidden ${className}`}
    >
      {/* Diagonal accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: styles.accent,
          clipPath: 'polygon(0% 0%, 100% 8%, 100% 92%, 0% 100%)',
        }}
      />

      <div className="flex items-start gap-2 pl-2">
        <span className={`${styles.text} flex-shrink-0 mt-0.5`}>
          {styles.icon}
        </span>
        <p className={`font-dm-sans text-sm ${styles.text} flex-1`}>
          {children}
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
