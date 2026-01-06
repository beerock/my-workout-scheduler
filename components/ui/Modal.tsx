'use client'

import React, { useEffect, useRef } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  variant?: 'default' | 'danger' // For delete confirmations
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      size = 'md',
      closeOnOverlayClick = true,
      showCloseButton = true,
      variant = 'default',
      children,
      footer,
      className = '',
      ...props
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null)

    // Size styles
    const sizeStyles = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
    }

    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }

      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
        // Lock body scroll
        document.body.style.overflow = 'hidden'
      }

      return () => {
        document.removeEventListener('keydown', handleEscape)
        // Restore body scroll
        document.body.style.overflow = 'unset'
      }
    }, [isOpen, onClose])

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose()
      }
    }

    if (!isOpen) return null

    // Accent bar gradient based on variant
    const accentGradient = variant === 'danger'
      ? 'linear-gradient(to right, #f43f5e, #e11d48)'
      : 'linear-gradient(to right, #1a6fff, #00c853)'

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          ref={modalRef}
          className={`bg-white rounded-xl shadow-floating ${sizeStyles[size]} w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-200 animate-fade-in-up ${className}`}
          style={{
            clipPath: 'polygon(0% 0%, calc(100% - 16px) 0%, 100% 16px, 100% 100%, 0% 100%)'
          }}
          {...props}
        >
          {/* Header with diagonal accent bar */}
          {(title || showCloseButton) && (
            <div className="relative">
              {/* Diagonal accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{
                  background: accentGradient,
                  clipPath: 'polygon(0% 0%, 100% 0%, 99% 100%, 1% 100%)'
                }}
              />
              <div className="flex items-center justify-between px-6 py-4">
                {title && (
                  <h2
                    id="modal-title"
                    className="font-sora text-xl font-bold text-gray-900"
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1 font-dm-sans">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'
