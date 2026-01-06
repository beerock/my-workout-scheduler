'use client'

import { useEffect, useState } from 'react'

type Props = {
  successRate: number
  totalAttempts?: number
  animationDelay?: string
}

/**
 * SuccessRateCard - Hero stat card with prominent arc gauge visualization
 *
 * Features a large semi-circular gauge that dominates the card,
 * making the success rate visualization the main visual element
 * rather than an afterthought.
 */
export default function SuccessRateCard({ successRate, totalAttempts, animationDelay = '0.1s' }: Props) {
  const [mounted, setMounted] = useState(false)
  const [animatedValue, setAnimatedValue] = useState(0)

  // Animate the gauge on mount
  useEffect(() => {
    setMounted(true)
    // Slight delay to allow mount animation, then animate the value
    const timer = setTimeout(() => {
      setAnimatedValue(successRate)
    }, 300)
    return () => clearTimeout(timer)
  }, [successRate])

  // SVG Arc calculation
  // Semi-circle from 180° to 0° (bottom half of circle, opening upward)
  const radius = 80
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = Math.PI * normalizedRadius // Half circle

  // Calculate stroke offset for the progress (0% = full offset, 100% = no offset)
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference

  // Arc path for semi-circle (opens upward)
  const arcPath = `
    M ${20} ${radius + 10}
    A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${20 + normalizedRadius * 2} ${radius + 10}
  `

  return (
    <div
      className="col-span-1 sm:col-span-2 opacity-0 animate-fade-in-up"
      style={{ animationDelay }}
    >
      <div
        className="relative overflow-hidden bg-white rounded-2xl p-4 sm:p-6 lg:p-8 hover:-translate-y-1 transition-all duration-300"
        style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.06), 0 8px 16px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Subtle accent gradient - positioned behind gauge */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-t from-success-500/15 via-success-500/5 to-transparent rounded-full blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          {/* Header row: Icon + Label */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-success-100 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-dm-sans text-sm text-gray-500 uppercase tracking-wider">
              Success Rate
            </p>
          </div>

          {/* Main content: Gauge + Stats side by side */}
          <div className="flex items-end justify-between gap-2 sm:gap-4">
            {/* Left side: Large percentage value - hero element on mobile */}
            <div className="flex-1 min-w-0">
              <p className="font-sora text-5xl sm:text-4xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-none">
                {Math.round(animatedValue)}
                <span className="text-3xl sm:text-2xl lg:text-5xl text-gray-400">%</span>
              </p>
              <p className="font-dm-sans text-sm sm:text-sm text-gray-500 mt-2">
                of {totalAttempts ? `${totalAttempts} ` : ''}bookings confirmed
              </p>
            </div>

            {/* Right side: Semi-circular gauge - hidden on mobile, prominent on desktop */}
            <div className="hidden sm:block flex-shrink-0 relative w-36 lg:w-[240px] h-24 lg:h-[130px]">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 180 110"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Definitions for gradient and glow */}
                <defs>
                  <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00c853" />
                    <stop offset="50%" stopColor="#00e676" />
                    <stop offset="100%" stopColor="#00a844" />
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background track */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />

                {/* Progress arc with animation */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke="url(#successGradient)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={mounted ? strokeDashoffset : circumference}
                  filter="url(#glow)"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    transitionDelay: '0.3s',
                  }}
                />

                {/* Center label - inside SVG for perfect alignment */}
                <text
                  x="94"
                  y="100"
                  textAnchor="middle"
                  className="font-dm-sans text-xs uppercase tracking-wide"
                  fill="#9ca3af"
                  style={{ fontSize: '10px', letterSpacing: '0.08em' }}
                >
                  bookings
                </text>
              </svg>
            </div>
          </div>

          {/* Bottom row: Legend - hidden on mobile (no ring context), visible on sm+ */}
          <div className="hidden sm:flex items-center gap-3 sm:gap-6 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="font-dm-sans text-xs sm:text-sm text-gray-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 rounded-full bg-warning-500" />
              <span className="font-dm-sans text-xs sm:text-sm text-gray-600">Waitlisted</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="font-dm-sans text-xs sm:text-sm text-gray-600">Failed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
