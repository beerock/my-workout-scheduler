import React from 'react'

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  className?: string
  lines?: number // For text variant, number of lines to show
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  lines = 1,
}) => {
  const baseStyles = 'shimmer-diagonal rounded'

  // Variant-specific styles
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  }

  // Default dimensions based on variant
  const defaultDimensions = {
    text: { width: '100%', height: '16px' },
    circular: { width: '48px', height: '48px' },
    rectangular: { width: '100%', height: '120px' },
    card: { width: '100%', height: '200px' },
  }

  const finalWidth = width || defaultDimensions[variant].width
  const finalHeight = height || defaultDimensions[variant].height

  // For text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseStyles} ${variantStyles[variant]}`}
            style={{
              width: index === lines - 1 ? '75%' : finalWidth,
              height: finalHeight,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{
        width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
        height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
      }}
    />
  )
}

// Preset skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-6 shadow-card ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" className="mb-2" />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
    <Skeleton variant="text" lines={3} className="mb-4" />
    <div className="flex gap-3">
      <Skeleton variant="rectangular" width={100} height={36} />
      <Skeleton variant="rectangular" width={80} height={36} />
    </div>
  </div>
)

export const SkeletonClassCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-card ${className}`}
    style={{
      clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%)'
    }}
  >
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="rectangular" width={70} height={24} className="rounded-sm" />
    </div>
    <Skeleton variant="text" width="50%" className="mb-2" />
    <Skeleton variant="text" width="35%" height={14} className="mb-6" />
    <div className="flex gap-3">
      <Skeleton variant="rectangular" width={100} height={40} />
      <Skeleton variant="rectangular" width={80} height={40} />
    </div>
  </div>
)

Skeleton.displayName = 'Skeleton'
SkeletonCard.displayName = 'SkeletonCard'
SkeletonClassCard.displayName = 'SkeletonClassCard'
