'use client'

import React, { useEffect, useState } from 'react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  message: string
  variant?: ToastVariant
  duration?: number
  onClose?: () => void
  isVisible?: boolean
}

const variantConfig = {
  success: {
    gradient: 'linear-gradient(to bottom, #00c853, #00a844)',
    bgColor: 'bg-success-50',
    textColor: 'text-success-800',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  error: {
    gradient: 'linear-gradient(to bottom, #f43f5e, #e11d48)',
    bgColor: 'bg-danger-50',
    textColor: 'text-danger-800',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    gradient: 'linear-gradient(to bottom, #ff9500, #ff6b00)',
    bgColor: 'bg-warning-50',
    textColor: 'text-warning-800',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  info: {
    gradient: 'linear-gradient(to bottom, #1a6fff, #0052e6)',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-800',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  duration = 5000,
  onClose,
  isVisible = true,
}) => {
  const [visible, setVisible] = useState(isVisible)

  useEffect(() => {
    setVisible(isVisible)
  }, [isVisible])

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!visible) return null

  const config = variantConfig[variant]

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg ${config.bgColor}
        shadow-floating animate-slide-in-right
        flex items-center gap-3 pr-4 py-3 pl-5
        min-w-[300px] max-w-md
      `}
    >
      {/* Diagonal accent bar on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: config.gradient,
          clipPath: 'polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%)',
        }}
      />

      {/* Icon */}
      <span className={config.textColor}>{config.icon}</span>

      {/* Message */}
      <p className={`font-dm-sans text-sm font-medium flex-1 ${config.textColor}`}>
        {message}
      </p>

      {/* Close button */}
      <button
        onClick={() => {
          setVisible(false)
          onClose?.()
        }}
        className={`${config.textColor} opacity-60 hover:opacity-100 transition-opacity p-1`}
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

Toast.displayName = 'Toast'
