'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import AuthLayout from '@/components/AuthLayout'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check for success message or error from URL params
    const urlMessage = searchParams.get('message')
    const urlError = searchParams.get('error')

    if (urlMessage) {
      setMessage(urlMessage)
    }
    if (urlError) {
      setError(urlError)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setShowResendVerification(false)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)

      // Check if error is due to unverified email
      if (error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('email confirmation')) {
        setShowResendVerification(true)
      }
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setError(error.message)
      } else {
        setResendSuccess(true)
        setMessage('Verification email sent! Check your inbox.')
        setShowResendVerification(false)
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-dm-sans text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="font-dm-sans text-xs text-primary-600 hover:text-primary-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {message && (
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg text-success-700 font-dm-sans text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 font-dm-sans text-sm">
              {error}
            </div>
          )}

          {showResendVerification && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="font-dm-sans text-sm text-primary-900 mb-3">
                Email not verified? We can resend the verification email.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleResendVerification}
                loading={resending}
                className="w-full"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center font-dm-sans text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
            Create one now
          </Link>
        </p>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="font-dm-sans text-gray-600">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
