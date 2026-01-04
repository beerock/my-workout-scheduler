'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Alert } from '@/components/ui'
import AuthLayout from '@/components/AuthLayout'
import { validatePassword } from '@/lib/validation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

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
    // Check if user has a valid session (came from password reset email)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setValidSession(!!session)
    }
    checkSession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)

        // Sign out the user after password reset (security best practice)
        await supabase.auth.signOut()

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=Password updated successfully! Please log in with your new password.')
        }, 3000)
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking session
  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="font-dm-sans text-gray-600">Loading...</div>
      </div>
    )
  }

  // Show error if no valid session
  if (!validSession) {
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is no longer valid">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-danger-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <p className="font-dm-sans text-gray-600 text-center mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </p>

        <div className="space-y-3">
          <Link href="/forgot-password">
            <Button variant="primary" className="w-full">
              Request New Reset Link
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout title="Password updated" subtitle="You can now sign in with your new password">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <p className="font-dm-sans text-gray-600 text-center mb-6">
          Your password has been changed successfully.
        </p>

        <Link href="/login">
          <Button variant="primary" className="w-full">
            Go to Sign In
          </Button>
        </Link>

        <p className="mt-4 font-dm-sans text-sm text-gray-500 text-center">
          Redirecting in 3 seconds...
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="New password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter new password"
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
          label="Confirm New Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Confirm new password"
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

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="font-dm-sans text-sm text-gray-600 hover:text-gray-900">
          ← Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  )
}
