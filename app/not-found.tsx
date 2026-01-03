'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Button, Footer } from '@/components/ui'

export default function NotFound() {
  const router = useRouter()

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
          background: 'radial-gradient(ellipse at 80% 60%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 90% 20%, rgba(0, 200, 83, 0.04) 0%, transparent 40%)',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] sm:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="min-h-screen flex flex-col relative z-10">
        {/* Main content - centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
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

          {/* 404 Card */}
          <Card
            className="w-full max-w-md opacity-0 animate-fade-in-up"
            padding="lg"
            style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
          >
            {/* Compass Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Outer ring */}
                <svg
                  className="w-20 h-20 sm:w-24 sm:h-24"
                  viewBox="0 0 96 96"
                  fill="none"
                >
                  {/* Compass ring with gradient stroke */}
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="url(#compassGradient)"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                  {/* Cardinal direction markers */}
                  <circle cx="48" cy="10" r="3" fill="#1a6fff" />
                  <circle cx="86" cy="48" r="2.5" fill="#8B5CF6" opacity="0.6" />
                  <circle cx="48" cy="86" r="2.5" fill="#8B5CF6" opacity="0.6" />
                  <circle cx="10" cy="48" r="2.5" fill="#8B5CF6" opacity="0.6" />
                  {/* Center dot */}
                  <circle cx="48" cy="48" r="4" fill="#1a6fff" />
                  {/* Needle - with slow wobble animation */}
                  <g className="origin-center animate-[compass-wobble_4s_ease-in-out_infinite]" style={{ transformOrigin: '48px 48px' }}>
                    <path
                      d="M48 16 L52 48 L48 52 L44 48 Z"
                      fill="url(#needleGradient)"
                    />
                    <path
                      d="M48 80 L52 48 L48 44 L44 48 Z"
                      fill="#9CA3AF"
                    />
                  </g>
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1a6fff" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient id="needleGradient" x1="48" y1="16" x2="48" y2="52">
                      <stop offset="0%" stopColor="#1a6fff" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Large 404 with gradient text */}
            <div className="text-center mb-2">
              <span
                className="font-sora text-6xl sm:text-8xl font-extrabold bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #1a6fff 0%, #8B5CF6 100%)',
                }}
              >
                404
              </span>
            </div>

            {/* Diagonal accent bar */}
            <div
              className="h-1 mb-6 rounded-full mx-auto max-w-[120px]"
              style={{
                background: 'linear-gradient(to right, #1a6fff, #8B5CF6)',
                clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
              }}
            />

            {/* Heading & Message */}
            <div className="text-center mb-8">
              <h1 className="font-sora text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Page Not Found
              </h1>
              <p className="font-dm-sans text-sm sm:text-base text-gray-600 leading-relaxed">
                Looks like this page wandered off the schedule.
                <br className="hidden sm:block" />
                Let&apos;s get you back on track.
              </p>
              <p className="font-dm-sans text-xs text-gray-400 mt-4">
                Need help?{' '}
                <a href="mailto:help@beerock.com" className="text-primary-500 hover:text-primary-600 underline">
                  help@beerock.com
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="flex-1">
                <Button variant="primary" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go Home
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => router.back()}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <Footer className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }} />
      </div>

      {/* Custom animation for compass needle wobble */}
      <style jsx global>{`
        @keyframes compass-wobble {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  )
}
