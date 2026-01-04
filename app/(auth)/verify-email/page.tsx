'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import AuthLayout from '@/components/AuthLayout'

function VerifyEmailContent() {
  const [email, setEmail] = useState<string>('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [showTips, setShowTips] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Get email from URL params (passed from signup page)
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    if (!email || countdown > 0) return

    setResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setResendError(error.message)
      } else {
        setResendSuccess(true)
        setCountdown(60) // 60 second cooldown
        // Success message persists until user navigates away
      }
    } catch (error) {
      setResendError('An unexpected error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout title="Check your inbox" subtitle="Almost there">
      {/* Email Icon with subtle animation */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center shadow-sm">
          <svg
            className="w-8 h-8 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Primary message */}
      <p className="font-dm-sans text-gray-600 text-center mb-3">
        If this is a new account, we&apos;ve sent a verification link&nbsp;to:
      </p>

      {email && (
        <Card variant="outlined" padding="sm" className="mb-4 text-center">
          <p className="font-dm-sans font-medium text-gray-900 break-all">{email}</p>
        </Card>
      )}

      {/* Expiration notice */}
      <div className="flex items-center justify-center gap-2 mb-6 text-sm">
        <svg
          className="w-4 h-4 text-warning-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-dm-sans text-warning-700">
          Link expires in 1 hour
        </span>
      </div>

      {/* Resend Section - moved up for better flow */}
      <div className="mb-6">
        {resendSuccess && (
          <div className="mb-3 p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 font-dm-sans text-sm text-center">
            Email sent! Check your inbox.
          </div>
        )}

        {resendError && (
          <div className="mb-3 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 font-dm-sans text-sm">
            {resendError}
          </div>
        )}

        <Button
          variant="secondary"
          onClick={handleResend}
          disabled={resending || countdown > 0 || !email}
          className="w-full"
        >
          {resending
            ? 'Sending...'
            : countdown > 0
            ? `Resend in ${countdown}s`
            : resendSuccess
            ? 'Email Sent!'
            : 'Resend Verification Email'}
        </Button>
      </div>

      {/* Collapsible tips section */}
      <div className="border-t border-gray-200 pt-5">
        <button
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between text-left font-dm-sans text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span>Didn&apos;t receive an email?</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`overflow-hidden transition-all duration-200 ${showTips ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <ul className="font-dm-sans text-sm text-gray-600 space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>Check your spam or junk folder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>Gmail users: check the Promotions tab</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>Add noreply@beerock.com to your contacts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>Wait 2-3 minutes and check again</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Already have an account - subtle section */}
      <div className="border-t border-gray-200 pt-5 mt-5">
        <p className="font-dm-sans text-sm text-gray-600 mb-3">
          <span className="font-medium text-gray-800">Already have an account?</span>
          {' '}If you&apos;ve signed up before, you won&apos;t receive a new verification email.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/login">
            <Button variant="primary" size="sm">
              Sign in instead
            </Button>
          </Link>
          <Link href="/forgot-password">
            <Button variant="ghost" size="sm">
              Forgot password?
            </Button>
          </Link>
        </div>
      </div>

      {/* Wrong email link */}
      <p className="font-dm-sans text-sm text-gray-500 text-center mt-5 pt-4 border-t border-gray-100">
        Wrong email?{' '}
        <Link href="/signup" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
          Sign up again
        </Link>
      </p>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="font-dm-sans text-gray-600">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
