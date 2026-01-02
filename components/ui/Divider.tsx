import React from 'react'

type DividerProps = {
  variant?: 'default' | 'editorial' | 'gradient'
  className?: string
}

/**
 * Editorial Divider component
 *
 * Variants:
 * - default: Simple gray line
 * - editorial: Gradient center-accent divider (from prototype)
 * - gradient: Full gradient line
 */
export const Divider: React.FC<DividerProps> = ({
  variant = 'default',
  className = '',
}) => {
  if (variant === 'editorial') {
    return (
      <div className={`relative h-px my-8 sm:my-12 lg:my-16 flex justify-center ${className}`}>
        {/* Faded background line */}
        <div
          className="w-full sm:w-[80%] lg:w-[60%] h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(26, 111, 255, 0.15), transparent)',
          }}
        />
        {/* Solid center accent */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 sm:w-24 lg:w-32 h-0.5"
          style={{
            background: 'linear-gradient(to right, #1a6fff, #00c853)',
            clipPath: 'polygon(1% 0%, 100% 0%, 99% 100%, 0% 100%)',
            opacity: 0.4,
            boxShadow: '0 0 20px rgba(26, 111, 255, 0.3)',
          }}
        />
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={`my-6 sm:my-8 ${className}`}>
        <div
          className="h-px w-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(26, 111, 255, 0.3), rgba(0, 200, 83, 0.3), transparent)',
          }}
        />
      </div>
    )
  }

  // Default variant
  return (
    <hr className={`border-t border-gray-200 my-6 sm:my-8 ${className}`} />
  )
}

Divider.displayName = 'Divider'
