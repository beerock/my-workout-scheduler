'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  label?: string
  name: string
  value: string
  onChange: (value: string, isCustom: boolean) => void
  options: ComboboxOption[]
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
  allowCustom?: boolean
  customLabel?: string
  filterFn?: (query: string, options: ComboboxOption[]) => ComboboxOption[]
  className?: string
}

const defaultFilter = (query: string, options: ComboboxOption[]): ComboboxOption[] => {
  const q = query.toLowerCase()
  if (!q) return options
  return options.filter((o) => o.label.toLowerCase().includes(q))
}

export function Combobox({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Search...',
  hint,
  error,
  required,
  allowCustom = false,
  customLabel = 'Add custom class',
  filterFn = defaultFilter,
  className = '',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const comboboxId = useMemo(
    () => `combobox-${Math.random().toString(36).substr(2, 9)}`,
    []
  )
  const listboxId = `${comboboxId}-listbox`

  const hasError = !!error

  // Filter options based on query
  const filtered = useMemo(() => filterFn(query, options), [query, options, filterFn])

  // Whether to show the custom entry option
  // Only show when query doesn't exactly match an existing option (case-insensitive)
  const queryTrimmed = query.trim()
  const exactMatchExists = queryTrimmed.length > 0 && filtered.some(
    (o) => o.label.toLowerCase() === queryTrimmed.toLowerCase()
  )
  const showCustomOption = allowCustom && queryTrimmed.length > 0 && !exactMatchExists

  // Total selectable items (filtered + optional custom)
  const totalItems = filtered.length + (showCustomOption ? 1 : 0)

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.querySelector(`[data-index="${activeIndex}"]`)
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const handleOpen = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true)
      setActiveIndex(-1)
      // If a value is selected, show it as the query for editing
      if (value && !query) {
        setQuery(value)
      }
    }
  }, [isOpen, value, query])

  const selectOption = useCallback(
    (optionValue: string, isCustom: boolean) => {
      onChange(optionValue, isCustom)
      setQuery('')
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    },
    [onChange]
  )

  const clearValue = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange('', false)
      setQuery('')
      setIsOpen(false)
      inputRef.current?.focus()
    },
    [onChange]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setQuery(val)
      setActiveIndex(-1)
      if (!isOpen) setIsOpen(true)
      // Clear the selected value when user starts typing
      if (value) {
        onChange('', false)
      }
    },
    [isOpen, value, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
          e.preventDefault()
          handleOpen()
          return
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0) {
            if (activeIndex < filtered.length) {
              selectOption(filtered[activeIndex].value, false)
            } else if (showCustomOption) {
              selectOption(query.trim(), true)
            }
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setActiveIndex(-1)
          // Restore original value if user escapes without selecting
          if (value) {
            setQuery('')
          }
          break
      }
    },
    [isOpen, activeIndex, totalItems, filtered, showCustomOption, query, value, handleOpen, selectOption]
  )

  // Input styles matching Input.tsx exactly
  const baseInputStyles = `
    w-full pl-11 pr-11 py-3 font-dm-sans text-gray-900 bg-white
    border rounded-lg transition-all duration-200
    placeholder:text-gray-400
    focus:outline-none
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  `

  const stateStyles = hasError
    ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
    : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

  // Display value: show selected value when not editing, query when editing
  const displayValue = isOpen ? query : value || ''

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={comboboxId}
          className="block font-dm-sans text-sm font-medium text-gray-700 mb-2"
        >
          {label}
        </label>
      )}

      {/* Input wrapper with focus accent bar */}
      <div className="relative focus-accent-bar">
        {/* Search icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id={comboboxId}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${comboboxId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-invalid={hasError}
          aria-describedby={
            error ? `${comboboxId}-error` : hint ? `${comboboxId}-hint` : undefined
          }
          autoComplete="off"
          className={`${baseInputStyles} ${stateStyles}`}
          placeholder={value ? '' : placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          required={required && !value}
        />

        {/* Right side: clear button or chevron */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {value && !isOpen ? (
            <button
              type="button"
              onClick={clearValue}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label="Clear selection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="text-gray-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-floating animate-slide-in-up overflow-hidden">
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            className="max-h-64 overflow-y-auto"
          >
            {filtered.length === 0 && !showCustomOption && (
              <li className="px-4 py-3 font-dm-sans text-sm text-gray-400 italic">
                No classes found
              </li>
            )}

            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${comboboxId}-option-${index}`}
                role="option"
                data-index={index}
                aria-selected={activeIndex === index}
                className={`px-4 py-3 font-dm-sans text-sm cursor-pointer transition-colors ${
                  activeIndex === index
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectOption(option.value, false)
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>

          {/* Custom entry option */}
          {showCustomOption && (
            <div
              id={`${comboboxId}-option-${filtered.length}`}
              role="option"
              data-index={filtered.length}
              aria-selected={activeIndex === filtered.length}
              className={`border-t border-gray-100 px-4 py-3 cursor-pointer transition-colors ${
                activeIndex === filtered.length
                  ? 'bg-primary-50'
                  : 'hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                selectOption(query.trim(), true)
              }}
              onMouseEnter={() => setActiveIndex(filtered.length)}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-dm-sans text-sm text-gray-900">
                    {customLabel}: <span className="font-semibold">&ldquo;{query.trim()}&rdquo;</span>
                  </p>
                  <p className="font-dm-sans text-xs text-gray-400">
                    We&apos;ll notify admins to add this to the list
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Screen reader announcement */}
          <div aria-live="polite" className="sr-only">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} available
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p
          id={`${comboboxId}-error`}
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
          id={`${comboboxId}-hint`}
          className="mt-2 font-dm-sans text-sm text-gray-500"
        >
          {hint}
        </p>
      )}
    </div>
  )
}

Combobox.displayName = 'Combobox'
