'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function VerifyEmailContent() {
  const [email, setEmail] = useState<string>('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
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
        // Clear success message after 3 seconds
        setTimeout(() => setResendSuccess(false), 3000)
      }
    } catch (error) {
      setResendError('An unexpected error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        {/* Email Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Check Your Email</h1>

        <p className="text-gray-600 text-center mb-6">
          We sent a verification link to:
        </p>

        {email && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-6 text-center">
            <p className="font-medium text-gray-900 break-all">{email}</p>
          </div>
        )}

        <p className="text-gray-700 mb-6">
          Click the link in the email to activate your account and start scheduling your workouts.
        </p>

        {/* Important Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-amber-900 mb-2">Important:</p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Check your Promotions or Updates tab (Gmail)</li>
                <li>• Add noreply@beerock.com to your contacts</li>
                <li>• The link expires in 24 hours</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resend Section */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3 text-center">Didn't receive the email?</p>

          {resendSuccess && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm text-center">
              ✓ Email sent! Check your inbox.
            </div>
          )}

          {resendError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {resendError}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending || countdown > 0 || !email}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resending
              ? 'Sending...'
              : countdown > 0
              ? `Resend in ${countdown}s`
              : resendSuccess
              ? '✓ Email Sent!'
              : 'Resend Verification Email'}
          </button>
        </div>

        {/* Wrong Email */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Wrong email?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up again
            </Link>
          </p>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
