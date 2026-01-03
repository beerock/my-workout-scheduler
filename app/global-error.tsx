'use client'

import { useEffect } from 'react'
import { sora, dmSans } from '@/lib/fonts'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error
    console.error('Critical application error:', error)
  }, [error])

  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-dm-sans antialiased">
        <div className="min-h-screen relative bg-gray-50 overflow-x-hidden">
          {/* Editorial background gradients - danger/critical tinted */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 20% 10%, rgba(244, 63, 94, 0.08) 0%, transparent 50%)',
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 80% 60%, rgba(244, 63, 94, 0.04) 0%, transparent 50%)',
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 90%, rgba(139, 92, 246, 0.03) 0%, transparent 40%)',
            }}
          />

          {/* Noise texture overlay */}
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="min-h-screen flex flex-col relative z-10">
            {/* Main content - centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
              {/* Logo/Brand - inline to avoid import issues */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #1a6fff, #1557cc)' }}>
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-sora text-lg sm:text-xl font-bold text-gray-900">
                    My Workout Scheduler
                  </span>
                </div>
              </div>

              {/* Critical Error Card - inline styles for reliability */}
              <div
                className="w-full max-w-md bg-white rounded-lg p-8"
                style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)' }}
              >
                {/* Shield with X Icon */}
                <div className="flex justify-center mb-6">
                  <svg
                    className="w-16 h-16 sm:w-20 sm:h-20"
                    viewBox="0 0 80 80"
                    fill="none"
                  >
                    {/* Shield outline */}
                    <path
                      d="M40 8 L68 18 V38 C68 54 40 70 40 70 C40 70 12 54 12 38 V18 L40 8Z"
                      fill="none"
                      stroke="url(#shieldGradient)"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />
                    {/* X mark */}
                    <line
                      x1="30"
                      y1="30"
                      x2="50"
                      y2="50"
                      stroke="#f43f5e"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <line
                      x1="50"
                      y1="30"
                      x2="30"
                      y2="50"
                      stroke="#f43f5e"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="shieldGradient" x1="12" y1="70" x2="68" y2="8">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Danger accent bar - inline */}
                <div
                  className="h-1 mb-6 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #f43f5e, #fb7185, #f43f5e)',
                    clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)',
                  }}
                />

                {/* Heading & Message */}
                <div className="text-center mb-6">
                  <h1 className="font-sora text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Critical Error
                  </h1>
                  <p className="font-dm-sans text-sm sm:text-base text-gray-600 leading-relaxed">
                    The application encountered a critical error.
                    <br />
                    Please reload to try again.
                  </p>
                </div>

                {/* Error reference and support */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  {error.digest && (
                    <p className="font-mono text-xs text-gray-400 mb-2">
                      Reference: {error.digest}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    If this keeps happening, email{' '}
                    <a
                      href={`mailto:help@beerock.com${error.digest ? `?subject=Critical Error: ${error.digest}` : ''}`}
                      className="text-primary-500 hover:text-primary-600 underline"
                    >
                      help@beerock.com
                    </a>
                    {error.digest && <span> with the reference above.</span>}
                  </p>
                </div>

                {/* Single action button - inline styles */}
                <button
                  onClick={() => reset()}
                  className="w-full py-3 px-6 font-dm-sans font-medium text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  style={{
                    background: 'linear-gradient(to bottom, #f43f5e, #e11d48)',
                    boxShadow: '0 4px 12px rgba(244, 63, 94, 0.25)',
                  }}
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reload Application
                  </span>
                </button>
              </div>
            </div>

            {/* Minimal footer - inline */}
            <footer className="py-6 px-4 text-center">
              <p className="font-dm-sans text-sm text-gray-500">
                &copy; {new Date().getFullYear()} My Workout Scheduler
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
