'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Alert } from '@/components/ui'
import AuthLayout from '@/components/AuthLayout'
import { validateEmail } from '@/lib/validation'

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

  // Email validation
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)

  // Eye icons for password visibility toggle
  const EyeIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const EyeOffIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

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
            onChange={(e) => {
              setEmail(e.target.value)
              // Clear error as user types if they're fixing it
              if (emailTouched && emailError) {
                setEmailError(validateEmail(e.target.value))
              }
            }}
            onBlur={() => {
              setEmailTouched(true)
              if (email) {
                setEmailError(validateEmail(email))
              }
            }}
            error={emailTouched ? emailError || undefined : undefined}
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? EyeOffIcon : EyeIcon}
                </button>
              }
            />
          </div>

          {message && (
            <Alert variant="success">{message}</Alert>
          )}

          {error && (
            <Alert variant="error">{error}</Alert>
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
            Request an invite
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
