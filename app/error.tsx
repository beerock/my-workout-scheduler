'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Footer } from '@/components/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen relative bg-gray-50 overflow-x-hidden">
      {/* Editorial background gradients - danger tinted */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 10%, rgba(244, 63, 94, 0.06) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 80% 60%, rgba(26, 111, 255, 0.05) 0%, transparent 50%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-50 sm:opacity-100"
        style={{
          background: 'radial-gradient(ellipse at 90% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 40%)',
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

          {/* Error Card */}
          <Card
            className="w-full max-w-md opacity-0 animate-fade-in-up"
            padding="lg"
            style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
          >
            {/* Warning Triangle Icon with pulse */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Pulse ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-danger-100 animate-ping opacity-20" />
                </div>
                {/* Warning triangle */}
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 relative z-10"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  {/* Triangle outline */}
                  <path
                    d="M40 12 L72 64 H8 Z"
                    fill="none"
                    stroke="url(#warningGradient)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {/* Exclamation line */}
                  <line
                    x1="40"
                    y1="30"
                    x2="40"
                    y2="46"
                    stroke="#f43f5e"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Exclamation dot */}
                  <circle cx="40" cy="54" r="2.5" fill="#f43f5e" />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="warningGradient" x1="8" y1="64" x2="72" y2="12">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Danger accent bar */}
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
                Something Went Wrong
              </h1>
              <p className="font-dm-sans text-sm sm:text-base text-gray-600 leading-relaxed">
                We hit an unexpected bump. Don&apos;t worry,
                <br className="hidden sm:block" />
                you can try again or head back home.
              </p>
            </div>

            {/* Error details (if available) */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              {error.message && (
                <p className="font-mono text-xs text-gray-500 truncate mb-1">
                  {error.message}
                </p>
              )}
              {error.digest && (
                <p className="font-mono text-xs text-gray-400">
                  Reference: {error.digest}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                If this keeps happening, email us at{' '}
                <a href={`mailto:help@beerock.com${error.digest ? `?subject=Error Reference: ${error.digest}` : ''}`} className="text-primary-500 hover:text-primary-600 underline">
                  help@beerock.com
                </a>
                {error.digest && <span> with the reference above.</span>}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => reset()}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="ghost" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <Footer className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }} />
      </div>
    </div>
  )
}
