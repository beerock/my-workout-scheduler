'use client'

import Link from 'next/link'

type NextClassCardProps = {
  className?: string
  dayTime: string
  classType: string
  branch: string
  hoursUntil: number
  bookingStatus?: 'confirmed' | 'waitlisted' | 'pending'
  // Pre-formatted booking-open timestamp (e.g. "Sun 2:15 PM") in the gym's
  // timezone. Only relevant to the pending state; null after the window has
  // opened, or when the booking already landed.
  bookingOpensAt?: string | null
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
  bookingStatus = 'pending',
  bookingOpensAt = null,
  onViewSchedule,
}: NextClassCardProps) {
  // Format hours display with unit
  // UX: Under 48 hours, people think in hours; over 48, they think in days
  const formatCountdown = (hours: number): { value: string; unit: string } => {
    if (hours < 1) {
      return { value: 'Now', unit: '' }
    } else if (hours < 48) {
      return { value: `${hours}`, unit: 'hrs' }
    } else {
      // Use Math.round to match user intuition (88 hours = 4 days, not 3)
      const days = Math.round(hours / 24)
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
        {/* Label with pulsing indicator — dot is decorative only, the
            "Next Class" label carries the semantic meaning. */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="relative" aria-hidden="true">
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

        {/* Class details — flex-wrap so long class names or branch names
            (Hendersonville YMCA is the longest branch) don't overflow
            the card at 320px viewport width. */}
        <p className="font-dm-sans text-sm sm:text-[15px] text-slate-300/90 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-lg sm:text-xl leading-none" aria-hidden="true">{getCategoryEmoji(classType)}</span>
          <span>{classType}</span>
          <span className="text-slate-500" aria-hidden="true">•</span>
          <span className="text-slate-400">{branch}</span>
        </p>
      </div>

      {/* Right: Status & Countdown Module */}
      <div className="relative w-full sm:w-auto flex items-center">
        {/* Status Display - bold, readable, full-width on mobile.
            Confirmed/waitlisted use row-on-mobile (short "in X hrs"
            subtitle fits inline). Pending subtitles are longer
            ("Opens Tue 6:00 AM", "Checking every 15 min") and would
            wrap awkwardly on narrow screens, so they always stack. */}
        <div
          className={`relative flex items-center justify-center w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl ${
            bookingStatus === 'pending'
              ? 'flex-col gap-1'
              : 'gap-2 sm:flex-col sm:gap-1'
          } ${
            bookingStatus === 'confirmed'
              ? 'bg-success-500/20 ring-1 ring-success-400/40'
              : bookingStatus === 'waitlisted'
                ? 'bg-warning-500/20 ring-1 ring-warning-400/40'
                : 'bg-slate-950/50 ring-1 ring-white/10'
          }`}
        >
          {bookingStatus === 'confirmed' ? (
            <>
              {/* Confirmed: Circled checkmark + BOOKED (consistent with SuccessRateCard) */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-sora text-base sm:text-lg font-bold text-success-400 uppercase tracking-wide">
                  Booked
                </span>
              </div>
              {/* Time - inline on mobile, below on desktop */}
              <span className="font-dm-sans text-sm sm:text-base text-success-300/90 font-medium">
                {countdown.value === 'Now' ? 'Starting now' : `in ${countdown.value} ${countdown.unit}`}
              </span>
            </>
          ) : bookingStatus === 'waitlisted' ? (
            <>
              {/* Waitlisted: Hourglass + WAITLIST */}
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl" aria-hidden="true">⏳</span>
                <span className="font-sora text-base sm:text-lg font-bold text-warning-400 uppercase tracking-wide">
                  Waitlist
                </span>
              </div>
              {/* Time - inline on mobile, below on desktop */}
              <span className="font-dm-sans text-sm sm:text-base text-warning-300/90 font-medium">
                {countdown.value === 'Now' ? 'Starting now' : `in ${countdown.value} ${countdown.unit}`}
              </span>
            </>
          ) : bookingOpensAt ? (
            <>
              {/* Pending, pre-window: "On deck" label per owner review —
                  "Watching" was slightly dishonest here since we're on a
                  timer, not actively monitoring the YMCA site. Coach-voice
                  Working-on-it tier, differentiates cleanly from the
                  post-window "Watching" state below. The timestamp anchors
                  the "when" on the actionable moment (booking opens)
                  rather than class start. */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-sora text-base sm:text-lg font-bold text-primary-300 uppercase tracking-wide">
                  On deck
                </span>
              </div>
              <span className="font-dm-sans text-sm sm:text-base text-primary-200/80 font-medium">
                Opens {bookingOpensAt}
              </span>
            </>
          ) : (
            <>
              {/* Pending, window already open: the system is actively
                  retrying. Same Working-on-it tier as the pre-window state
                  but more honest ("checking every 15 min" is what is
                  literally happening now, not a forecast). */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-sora text-base sm:text-lg font-bold text-primary-300 uppercase tracking-wide">
                  Watching
                </span>
              </div>
              <span className="font-dm-sans text-sm sm:text-base text-primary-200/80 font-medium">
                Checking every 15 min
              </span>
            </>
          )}
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
