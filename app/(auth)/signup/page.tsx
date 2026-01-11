'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Alert } from '@/components/ui'
import AuthLayout from '@/components/AuthLayout'
import { validateEmail, validatePassword } from '@/lib/validation'
import { signupWithTurnstile } from '@/app/actions/auth'

// Extend Window interface for turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const router = useRouter()

  // Email validation
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation
  const passwordValidation = validatePassword(password)
  const strengthLevel = [
    passwordValidation.minLength,
    passwordValidation.hasLowercase,
    passwordValidation.hasUppercase,
    passwordValidation.hasDigit
  ].filter(Boolean).length

  const strengthConfig: Record<number, { label: string; color: string; width: string }> = {
    0: { label: '', color: 'bg-gray-200', width: '0%' },
    1: { label: 'Weak', color: 'bg-danger-500', width: '25%' },
    2: { label: 'Fair', color: 'bg-warning-500', width: '50%' },
    3: { label: 'Good', color: 'bg-primary-500', width: '75%' },
    4: { label: 'Strong', color: 'bg-success-500', width: '100%' }
  }

  // Confirm password match
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const showPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword

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
    // Check if script already exists (prevents double loading in dev mode)
    let script = document.querySelector('script[src*="turnstile"]') as HTMLScriptElement
    let shouldCleanup = false

    const renderWidget = () => {
      // Only render if widget doesn't already exist and ref is available
      if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
        // Check if widget is already rendered in the div
        if (turnstileRef.current.children.length === 0) {
          widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA', // Test key
            appearance: 'interaction-only',
            callback: (token: string) => {
              setTurnstileToken(token)
              // Clear any previous errors when verification succeeds
              setError(null)
            },
            'error-callback': () => {
              // Only set error if user already tried to submit
              // Don't show error on initial page load
              setTurnstileToken(null)
            },
          })
        }
      }
    }

    if (!script) {
      // Script doesn't exist, create it
      script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = renderWidget
      document.body.appendChild(script)
      shouldCleanup = true
    } else if (window.turnstile) {
      // Script already loaded, render immediately
      renderWidget()
    } else {
      // Script exists but not loaded yet, wait for it
      script.addEventListener('load', renderWidget)
    }

    return () => {
      // Only cleanup if we created the script
      if (shouldCleanup && widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate turnstile token (client-side check for UX, server validates properly)
    if (!turnstileToken) {
      setError('Please complete the bot protection verification')
      setLoading(false)
      return
    }

    // Call server action for signup with Turnstile verification
    // SECURITY: Server validates Turnstile token to prevent bypass
    const result = await signupWithTurnstile(email, password, turnstileToken)

    if (!result.success) {
      setError(result.error || 'Unable to create account')
      setLoading(false)
    } else {
      // Redirect to verify email page with email in URL
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Start automating your gym class bookings">
      <form onSubmit={handleSignup} className="space-y-4">
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
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
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

            {/* Password Strength Meter */}
            {password && (
              <div className="mt-3 space-y-2">
                {/* Strength bar */}
                <div className="flex items-center gap-3" role="progressbar" aria-valuenow={strengthLevel * 25} aria-valuemin={0} aria-valuemax={100}>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthConfig[strengthLevel].color} transition-all duration-300 ease-out`}
                      style={{ width: strengthConfig[strengthLevel].width }}
                    />
                  </div>
                  <span className={`text-xs font-dm-sans font-medium min-w-[48px] ${
                    strengthLevel <= 1 ? 'text-danger-600' :
                    strengthLevel === 2 ? 'text-warning-600' :
                    strengthLevel === 3 ? 'text-primary-600' : 'text-success-600'
                  }`}>
                    {strengthConfig[strengthLevel].label}
                  </span>
                </div>

                {/* Requirements checklist */}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-dm-sans" aria-label="Password requirements">
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.minLength ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.minLength
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    8+ characters
                  </li>
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.hasLowercase ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.hasLowercase
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    Lowercase (a-z)
                  </li>
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.hasUppercase ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.hasUppercase
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    Uppercase (A-Z)
                  </li>
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.hasDigit ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.hasDigit
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    Number (0-9)
                  </li>
                </ul>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
            hint={passwordsMatch ? "Passwords match" : undefined}
            error={showPasswordMismatch ? "Passwords don't match" : undefined}
            rightIcon={
              passwordsMatch ? (
                <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? EyeOffIcon : EyeIcon}
                </button>
              )
            }
          />

          {/* Cloudflare Turnstile bot protection */}
          <div ref={turnstileRef}></div>

          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center font-dm-sans text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">
            Sign in
          </Link>
        </p>
    </AuthLayout>
  )
}
