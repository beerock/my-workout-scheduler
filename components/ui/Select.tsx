'use client'

import React, { forwardRef } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error

    // Base select styles
    const baseSelectStyles = `
      w-full px-4 py-3 font-dm-sans text-gray-900 bg-white
      border rounded-lg transition-all duration-200
      appearance-none cursor-pointer
      focus:outline-none
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    `

    // State-based border and focus styles
    const stateStyles = hasError
      ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
      : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

    return (
      <div className={`relative ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block font-dm-sans text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}

        {/* Select wrapper with focus accent bar */}
        <div className="relative focus-accent-bar">
          <select
            ref={ref}
            id={selectId}
            className={`${baseSelectStyles} ${stateStyles} pr-10`}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-2 font-dm-sans text-sm text-danger-500 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !error && (
          <p
            id={`${selectId}-hint`}
            className="mt-2 font-dm-sans text-sm text-gray-500"
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
