'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface DropdownMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export interface DropdownMenuProps {
  items: (DropdownMenuItem | 'divider')[]
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ items, children, align = 'right', className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    // Close on escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
      }

      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }, [isOpen])

    const handleItemClick = (onClick: () => void) => {
      onClick()
      setIsOpen(false)
    }

    return (
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        {/* Trigger */}
        <div onClick={() => setIsOpen(!isOpen)}>
          {children}
        </div>

        {/* Menu - Design System v2 */}
        {isOpen && (
          <div
            className={`absolute top-full mt-2 min-w-[200px] bg-white rounded-xl border border-gray-200 overflow-hidden z-50 animate-fade-in-up ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            style={{
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="py-1">
              {items.map((item, index) => {
                if (item === 'divider') {
                  return (
                    <div
                      key={`divider-${index}`}
                      className="border-t border-gray-100 my-1"
                    />
                  )
                }

                const menuItem = item as DropdownMenuItem
                const isDestructive = menuItem.variant === 'danger'

                return (
                  <button
                    key={index}
                    onClick={() => handleItemClick(menuItem.onClick)}
                    disabled={menuItem.disabled}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3 transition-colors font-dm-sans
                      ${
                        isDestructive
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-500'
                      }
                      ${menuItem.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {menuItem.icon && (
                      <span className={`flex-shrink-0 w-4 h-4 ${isDestructive ? 'text-rose-500' : 'text-gray-400'}`}>
                        {menuItem.icon}
                      </span>
                    )}
                    <span className="font-medium">{menuItem.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
)

DropdownMenu.displayName = 'DropdownMenu'
