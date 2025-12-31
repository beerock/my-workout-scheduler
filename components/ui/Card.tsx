import React from 'react'

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      children,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'bg-white'

    // Variant styles
    const variantStyles = {
      default: 'shadow-card rounded-lg',
      elevated: 'shadow-card-hover rounded-lg',
      outlined: 'border border-gray-200 rounded-lg',
      gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 shadow-card rounded-xl',
    }

    // Padding styles
    const paddingStyles = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    // Hover styles
    const hoverStyles = hover
      ? 'transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02] cursor-pointer'
      : ''

    // Combine styles
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`

    // Use semantic HTML
    const Component = onClick ? 'button' : 'div'
    const componentProps = onClick
      ? {
          type: 'button' as const,
          onClick,
          role: 'button',
        }
      : {}

    return (
      <Component
        ref={ref as any}
        className={combinedClassName}
        {...componentProps}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'
