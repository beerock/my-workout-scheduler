'use client'

import Link from 'next/link'
import { Card } from '@/components/ui'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative bg-gray-50 overflow-x-hidden">
      {/* Editorial background gradients */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 10%, rgba(26, 111, 255, 0.08) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 80% 60%, rgba(0, 200, 83, 0.06) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 40%)',
        }}
      />

      {/* Noise texture overlay - reduced on mobile */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] sm:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        {/* Logo/Brand */}
        <Link
          href="/"
          className="mb-6 sm:mb-8 opacity-0 animate-fade-in-up"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-sora text-lg sm:text-xl font-bold text-gray-900">
              My Workout Scheduler
            </span>
          </div>
        </Link>

        {/* Auth Card */}
        <Card
          className="w-full max-w-md opacity-0 animate-fade-in-up"
          padding="lg"
          style={{ animationDelay: '0.1s' }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-sora text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="font-dm-sans text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Diagonal accent bar */}
          <div
            className="h-0.5 sm:h-1 mb-6 rounded-full"
            style={{
              background: 'linear-gradient(to right, #1a6fff, #00c853, #8B5CF6)',
              clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)',
            }}
          />

          {children}
        </Card>

        {/* Footer */}
        <p
          className="mt-6 sm:mt-8 font-dm-sans text-xs text-gray-500 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          Automated gym class booking
        </p>
      </div>
    </div>
  )
}
