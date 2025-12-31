'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getAuthCallbackUrl } from '@/lib/env'
import { Button, Input, Card } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAuthCallbackUrl()}?next=/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSubmitted(true)
        setCountdown(60) // 60 second cooldown for resend
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAuthCallbackUrl()}?next=/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setCountdown(60)
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer
  if (countdown > 0) {
    setTimeout(() => setCountdown(countdown - 1), 1000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md" padding="lg">
          {/* Email Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
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

          <h1 className="font-sora text-2xl font-bold text-gray-900 mb-2 text-center">
            Password Reset Email Sent
          </h1>

          <p className="font-dm-sans text-gray-600 text-center mb-6">
            If an account exists for <span className="font-medium text-gray-900">{email}</span>,
            you'll receive a password reset link shortly.
          </p>

          {/* Important Instructions */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0"
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
                <p className="font-dm-sans font-medium text-warning-900 mb-2">Important:</p>
                <ul className="font-dm-sans text-sm text-warning-800 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Check your Promotions or Updates tab (Gmail)</li>
                  <li>• The link expires in 1 hour</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 font-dm-sans text-sm">
              {error}
            </div>
          )}

          {/* Resend Button */}
          <div className="mb-6">
            <p className="font-dm-sans text-sm text-gray-600 mb-3 text-center">Didn't receive the email?</p>
            <Button
              variant="secondary"
              onClick={handleResend}
              disabled={loading || countdown > 0}
              className="w-full"
            >
              {loading
                ? 'Sending...'
                : countdown > 0
                ? `Resend in ${countdown}s`
                : 'Resend Reset Link'}
            </Button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link href="/login" className="font-dm-sans text-sm text-primary-600 hover:text-primary-700 hover:underline">
              ← Back to Login
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md" padding="lg">
        <h1 className="font-sora text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
        <p className="font-dm-sans text-gray-600 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />

          {error && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 font-dm-sans text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="font-dm-sans text-sm text-gray-600 hover:text-gray-900">
            ← Back to Login
          </Link>
        </div>
      </Card>
    </div>
  )
}
