'use client'

type Props = {
  activeCount: number
  variant?: 'hero' | 'standard'
  animationDelay?: string
}

/**
 * PausedActiveStatCard - Shows Active Classes stat with paused visual state
 *
 * When schedule is paused, this card displays with amber styling to indicate
 * the paused state. NO Resume button - Resume action is only in PauseBanner.
 *
 * Two variants:
 * - hero: Spans 2 cols, larger display (for schedule page if needed)
 * - standard: Single col, compact (for dashboard stats grid)
 */
export default function PausedActiveStatCard({
  activeCount,
  variant = 'standard',
  animationDelay = '0.15s',
}: Props) {

  // Hero variant (spans 2 cols) - visual only, no button
  if (variant === 'hero') {
    return (
      <div
        className="col-span-2 opacity-0 animate-fade-in-up"
        style={{ animationDelay }}
      >
        <div
          className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 sm:p-8 border border-amber-200/50"
          style={{
            boxShadow: '0 4px 24px rgba(245, 158, 11, 0.12)',
          }}
        >
          {/* Subtle accent gradient */}
          <div
            className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-br from-amber-400/15 to-transparent rounded-full blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex-1">
              {/* Icon badge with pause indicator */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 relative">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                {/* Pause indicator dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-amber-50" />
              </div>

              {/* Label with status */}
              <div className="flex items-center gap-2 mb-1">
                <p className="font-dm-sans text-sm text-amber-700 uppercase tracking-wider">
                  Active Classes
                </p>
                <span className="px-2 py-0.5 bg-amber-200/60 text-amber-800 font-dm-sans text-xs font-medium rounded-full">
                  Paused
                </span>
              </div>

              {/* Hero value - muted when paused */}
              <p className="font-sora text-5xl sm:text-6xl font-bold text-gray-600 tracking-tight opacity-50">
                {activeCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard variant (single col) - visual only, no button
  return (
    <div
      className="opacity-0 animate-fade-in-up"
      style={{ animationDelay }}
    >
      <div
        className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 sm:p-6 h-full border border-amber-200/50"
        style={{
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.10)',
        }}
      >
        {/* Subtle accent */}
        <div
          className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/15 to-transparent rounded-full blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          {/* Icon badge with pause indicator */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3 relative">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            {/* Pause indicator dot */}
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-amber-50" />
          </div>

          {/* Label with paused badge */}
          <div className="flex items-center gap-1.5 mb-1">
            <p className="font-dm-sans text-xs sm:text-sm text-amber-700 uppercase tracking-wider">
              Active Classes
            </p>
            <span className="px-1.5 py-0.5 bg-amber-200/60 text-amber-800 font-dm-sans text-[10px] font-medium rounded-full">
              Paused
            </span>
          </div>

          {/* Value - muted when paused */}
          <p className="font-sora text-2xl sm:text-3xl font-bold text-gray-600 opacity-50">
            {activeCount}
          </p>
        </div>
      </div>
    </div>
  )
}
