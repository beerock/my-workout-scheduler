'use client'

import Link from 'next/link'

type NextClassCardProps = {
  className?: string
  dayTime: string
  classType: string
  branch: string
  hoursUntil: number
  onViewSchedule?: () => void
}

/**
 * NextClassCard - Featured dark gradient card for next scheduled class
 *
 * Design: Refined editorial with unified countdown display
 * - Dark gradient background with diagonal clip
 * - Unified countdown module combining emoji + time
 * - Glass morphism with subtle depth layers
 * - Mobile-first responsive
 */
export default function NextClassCard({
  className = '',
  dayTime,
  classType,
  branch,
  hoursUntil,
  onViewSchedule,
}: NextClassCardProps) {
  // Format hours display with unit
  const formatCountdown = (hours: number): { value: string; unit: string } => {
    if (hours < 1) {
      return { value: 'Now', unit: '' }
    } else if (hours < 24) {
      return { value: `${hours}`, unit: 'hrs' }
    } else {
      const days = Math.floor(hours / 24)
      return { value: `${days}`, unit: days === 1 ? 'day' : 'days' }
    }
  }

  // Get category emoji based on class type
  const getCategoryEmoji = (type: string): string => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('pump') || lowerType.includes('strength') || lowerType.includes('lift') || lowerType.includes('weight')) {
      return '💪'
    }
    if (lowerType.includes('cycle') || lowerType.includes('cycling') || lowerType.includes('spin')) {
      return '🚴'
    }
    if (lowerType.includes('yoga') || lowerType.includes('pilates') || lowerType.includes('stretch')) {
      return '🧘'
    }
    if (lowerType.includes('dance') || lowerType.includes('zumba') || lowerType.includes('step')) {
      return '💃'
    }
    if (lowerType.includes('combat') || lowerType.includes('box') || lowerType.includes('kick') || lowerType.includes('martial')) {
      return '🥊'
    }
    if (lowerType.includes('aqua') || lowerType.includes('swim') || lowerType.includes('water')) {
      return '🏊'
    }
    if (lowerType.includes('hiit') || lowerType.includes('cardio') || lowerType.includes('run')) {
      return '🏃'
    }
    return '🏃' // Default
  }

  const countdown = formatCountdown(hoursUntil)

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800
        p-5 sm:p-6 lg:p-7
        flex flex-col sm:flex-row sm:items-center sm:justify-between
        gap-5 sm:gap-6
        opacity-0 animate-fade-in-up
        hover:-translate-y-0.5 transition-all duration-300
        ${className}
      `}
      style={{
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        clipPath: 'polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%)',
      }}
    >
      {/* Accent gradient overlays */}
      <div
        className="absolute top-0 right-0 w-40 sm:w-56 h-40 sm:h-56 bg-gradient-to-br from-primary-500/15 to-transparent rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-28 sm:w-36 h-28 sm:h-36 bg-gradient-to-tr from-success-500/10 to-transparent rounded-full blur-2xl"
        aria-hidden="true"
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
        aria-hidden="true"
      />

      {/* Left Content */}
      <div className="relative flex-1 min-w-0">
        {/* Label with pulsing indicator */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-success-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-success-400 animate-ping opacity-75" />
          </div>
          <span className="font-dm-sans text-[11px] sm:text-xs text-slate-400 uppercase tracking-[0.15em] font-medium">
            Next Class
          </span>
        </div>

        {/* Day and time - hero text */}
        <h3 className="font-sora text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-white tracking-tight leading-tight">
          {dayTime}
        </h3>

        {/* Class details */}
        <p className="font-dm-sans text-sm sm:text-[15px] text-slate-300/90 mt-1.5 flex items-center gap-2">
          <span className="text-lg sm:text-xl leading-none">{getCategoryEmoji(classType)}</span>
          <span>{classType}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{branch}</span>
        </p>
      </div>

      {/* Right: Unified Countdown Module */}
      <div className="relative flex items-center gap-3">
        {/* Countdown Display - unified glass container */}
        <div
          className="relative flex items-center gap-0 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {/* Countdown number section */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col items-center justify-center">
            <span
              className="font-sora text-3xl sm:text-4xl font-bold text-white leading-none tracking-tight"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              {countdown.value}
            </span>
            {countdown.unit && (
              <span className="font-dm-sans text-[10px] sm:text-[11px] text-white/60 uppercase tracking-wider mt-0.5">
                {countdown.unit}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-10 sm:h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

          {/* Label section */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 flex flex-col items-start justify-center">
            <span className="font-dm-sans text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wider leading-tight">
              until
            </span>
            <span className="font-dm-sans text-xs sm:text-[13px] text-white/80 font-medium leading-tight">
              booking
            </span>
          </div>
        </div>

        {/* View schedule link (desktop only) */}
        {onViewSchedule && (
          <Link
            href="/dashboard/schedule"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 font-dm-sans text-sm"
          >
            <span>View</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
