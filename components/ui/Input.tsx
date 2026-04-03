'use client'

import React, { forwardRef, useState, useCallback, useId } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Show native browser validation message styled with design system */
  showNativeValidation?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      className = '',
      id,
      showNativeValidation = false,
      onInvalid,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const [nativeError, setNativeError] = useState<string | null>(null)
    const [touched, setTouched] = useState(false)

    // Handle invalid event - prevent browser bubble and capture message
    const handleInvalid = useCallback((e: React.InvalidEvent<HTMLInputElement>) => {
      e.preventDefault() // Prevent browser tooltip bubble
      if (showNativeValidation) {
        setNativeError(e.target.validationMessage)
      }
      onInvalid?.(e)
    }, [showNativeValidation, onInvalid])

    // Track touched state for CSS fallback styling
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true)
      // Clear native error if now valid
      if (showNativeValidation && e.target.validity.valid) {
        setNativeError(null)
      }
      onBlur?.(e)
    }, [showNativeValidation, onBlur])

    // Determine state for styling
    const displayError = error || (showNativeValidation ? nativeError : null)
    const hasError = !!displayError
    const hasSuccess = !!success

    // Base input styles
    const baseInputStyles = `
      w-full px-4 py-3 font-dm-sans text-gray-900 bg-white
      border rounded-lg transition-all duration-200
      placeholder:text-gray-400
      focus:outline-none
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    `

    // State-based border and focus styles
    const stateStyles = hasError
      ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
      : hasSuccess
        ? 'border-success-500 focus:border-success-500 focus:ring-2 focus:ring-success-500/20'
        : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

    // Icon padding adjustments
    const iconPadding = leftIcon ? 'pl-11' : rightIcon ? 'pr-11' : ''

    return (
      <div className={`relative ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block font-dm-sans text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}

        {/* Input wrapper with focus accent bar */}
        <div className="relative focus-accent-bar">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={`${baseInputStyles} ${stateStyles} ${iconPadding} ${touched ? 'touched' : ''}`}
            aria-invalid={hasError}
            aria-describedby={
              displayError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            onInvalid={handleInvalid}
            onBlur={handleBlur}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <p
            id={`${inputId}-error`}
            className="mt-2 font-dm-sans text-sm text-danger-500 flex items-center gap-1"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {displayError}
          </p>
        )}

        {/* Success message */}
        {success && !displayError && (
          <p className="mt-2 font-dm-sans text-sm text-success-500 flex items-center gap-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </p>
        )}

        {/* Hint text */}
        {hint && !displayError && !success && (
          <p
            id={`${inputId}-hint`}
            className="mt-2 font-dm-sans text-sm text-gray-500"
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
