import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'ghost-primary' | 'outline' | 'outline-primary' | 'outline-danger' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles - Design System v2
    const baseStyles =
      'inline-flex items-center justify-center font-dm-sans font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'

    // Variant styles with gradients and shadows
    const variantStyles = {
      primary:
        'bg-gradient-primary text-white shadow-btn-primary hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500',
      secondary:
        'bg-gradient-warning text-white shadow-[0_4px_12px_rgba(255,149,0,0.25)] hover:-translate-y-0.5 active:translate-y-0 focus:ring-warning-500',
      success:
        'bg-gradient-success text-white shadow-btn-success hover:-translate-y-0.5 active:translate-y-0 focus:ring-success-500',
      danger:
        'bg-gradient-danger text-white shadow-btn-danger hover:-translate-y-0.5 active:translate-y-0 focus:ring-danger-500',
      purple:
        'bg-gradient-purple text-white shadow-btn-purple hover:-translate-y-0.5 active:translate-y-0 focus:ring-purple-500',
      ghost:
        'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0 focus:ring-gray-400',
      'ghost-primary':
        'bg-primary-50 text-primary-600 hover:bg-primary-100 hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500',
      outline:
        'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 focus:ring-gray-400',
      'outline-primary':
        'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-500/5 hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500',
      'outline-danger':
        'bg-transparent border-2 border-danger-500 text-danger-500 hover:bg-danger-500/5 hover:-translate-y-0.5 active:translate-y-0 focus:ring-danger-500',
    }

    // Size styles
    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg font-semibold',
    }

    // Combine styles
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        className={combinedClassName}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="opacity-75">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
