import React from 'react'

type Props = {
  label: string
  value: string | number
  icon: React.ReactNode
  animationDelay: string
}

export default function DashboardStatCard({ label, value, icon, animationDelay }: Props) {
  return (
    <div
      className="opacity-0 animate-fade-in-up"
      style={{ animationDelay }}
    >
      <div
        className="relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 h-full hover:-translate-y-1 transition-all duration-300"
        style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.06), 0 8px 16px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Subtle accent */}
        <div
          className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-2xl"
          aria-hidden="true"
        />

        <div className="relative">
          {/* Icon badge */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-3">
            {icon}
          </div>

          {/* Label */}
          <p className="font-dm-sans text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>

          {/* Value */}
          <p className="font-sora text-2xl sm:text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
