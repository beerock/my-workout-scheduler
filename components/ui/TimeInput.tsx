'use client'

import React, { useState, useEffect, useCallback, useId } from 'react'

export interface TimeInputProps {
  label?: string
  error?: string
  hint?: string
  value?: string // HH:MM format (24-hour)
  onChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  name?: string
}

// Convert 24-hour time to 12-hour components
function parse24HourTime(time: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  if (!time || !time.includes(':')) {
    return { hour: '', minute: '', period: 'AM' }
  }

  const [hourStr, minuteStr] = time.split(':')
  const hour24 = parseInt(hourStr, 10)

  if (isNaN(hour24)) {
    return { hour: '', minute: '', period: 'AM' }
  }

  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'
  let hour12 = hour24 % 12
  if (hour12 === 0) hour12 = 12

  return {
    hour: hour12.toString(),
    minute: minuteStr.padStart(2, '0'),
    period
  }
}

// Convert 12-hour components to 24-hour time string
function to24HourTime(hour: string, minute: string, period: 'AM' | 'PM'): string {
  if (!hour || !minute) return ''

  let hour24 = parseInt(hour, 10)

  if (period === 'AM') {
    if (hour24 === 12) hour24 = 0
  } else {
    if (hour24 !== 12) hour24 += 12
  }

  return `${hour24.toString().padStart(2, '0')}:${minute}`
}

export const TimeInput: React.FC<TimeInputProps> = ({
  label,
  error,
  hint,
  value = '',
  onChange,
  required = false,
  disabled = false,
  className = '',
  name
}) => {
  const baseId = useId()
  const hasError = !!error

  // Parse incoming value
  const parsed = parse24HourTime(value)
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period)

  // Sync internal state when external value changes
  useEffect(() => {
    const parsed = parse24HourTime(value)
    setHour(parsed.hour)
    setMinute(parsed.minute)
    setPeriod(parsed.period)
  }, [value])

  // Emit change when any component updates
  const handleChange = useCallback((newHour: string, newMinute: string, newPeriod: 'AM' | 'PM') => {
    const time24 = to24HourTime(newHour, newMinute, newPeriod)
    onChange?.(time24)
  }, [onChange])

  // Generate options
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

  // Base select styles matching your Select component
  const baseSelectStyles = `
    px-3 py-3 font-dm-sans text-gray-900 bg-white
    border rounded-lg transition-all duration-200
    appearance-none cursor-pointer
    focus:outline-none
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  `

  // State-based border and focus styles
  const stateStyles = hasError
    ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
    : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

  // Clock icon
  const ClockIcon = (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  // Dropdown arrow
  const DropdownArrow = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={`${baseId}-hour`}
          className="block font-dm-sans text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}

      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={to24HourTime(hour, minute, period)}
        />
      )}

      {/* Time picker row */}
      <div className="flex items-center gap-2">
        {/* Clock icon */}
        <div className="flex-shrink-0">
          {ClockIcon}
        </div>

        {/* Hour select */}
        <div className="relative">
          <select
            id={`${baseId}-hour`}
            value={hour}
            onChange={(e) => {
              setHour(e.target.value)
              handleChange(e.target.value, minute, period)
            }}
            disabled={disabled}
            required={required}
            aria-label="Hour"
            className={`${baseSelectStyles} ${stateStyles} w-[72px] pr-8 text-center`}
          >
            <option value="" disabled>--</option>
            {hours.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            {DropdownArrow}
          </div>
        </div>

        {/* Colon separator */}
        <span className="font-dm-sans text-xl text-gray-400 font-medium">:</span>

        {/* Minute select */}
        <div className="relative">
          <select
            id={`${baseId}-minute`}
            value={minute}
            onChange={(e) => {
              setMinute(e.target.value)
              handleChange(hour, e.target.value, period)
            }}
            disabled={disabled}
            required={required}
            aria-label="Minute"
            className={`${baseSelectStyles} ${stateStyles} w-[72px] pr-8 text-center`}
          >
            <option value="" disabled>--</option>
            {minutes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            {DropdownArrow}
          </div>
        </div>

        {/* AM/PM toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-1">
          <button
            type="button"
            onClick={() => {
              setPeriod('AM')
              handleChange(hour, minute, 'AM')
            }}
            disabled={disabled}
            className={`
              px-3 py-2.5 font-dm-sans text-sm font-medium transition-all duration-200
              ${period === 'AM'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
            aria-pressed={period === 'AM'}
            aria-label="AM"
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod('PM')
              handleChange(hour, minute, 'PM')
            }}
            disabled={disabled}
            className={`
              px-3 py-2.5 font-dm-sans text-sm font-medium transition-all duration-200 border-l border-gray-200
              ${period === 'PM'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
            aria-pressed={period === 'PM'}
            aria-label="PM"
          >
            PM
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${baseId}-error`}
          className="mt-2 font-dm-sans text-sm text-danger-500 flex items-center gap-1"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p
          id={`${baseId}-hint`}
          className="mt-2 font-dm-sans text-sm text-gray-500"
        >
          {hint}
        </p>
      )}
    </div>
  )
}

TimeInput.displayName = 'TimeInput'
