'use client'

import React, { forwardRef } from 'react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error

    return (
      <div className={`relative ${className}`}>
        <div className="flex items-start gap-3">
          {/* Custom checkbox */}
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className={`
                peer w-5 h-5 rounded border-2 cursor-pointer
                appearance-none transition-all duration-200
                ${hasError
                  ? 'border-danger-500'
                  : 'border-gray-300 hover:border-primary-400'}
                checked:bg-gradient-primary checked:border-primary-500
                focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-1
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-invalid={hasError}
              aria-describedby={error ? `${checkboxId}-error` : undefined}
              {...props}
            />
            {/* Checkmark icon */}
            <svg
              className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex-1">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className="block font-dm-sans text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {label}
                </label>
              )}
              {description && (
                <p className="font-dm-sans text-sm text-gray-500 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="mt-2 font-dm-sans text-sm text-danger-500 flex items-center gap-1 ml-8"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
