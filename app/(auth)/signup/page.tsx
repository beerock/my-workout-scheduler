'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuthCallbackUrl } from '@/lib/env'
import { Button, Input } from '@/components/ui'
import AuthLayout from '@/components/AuthLayout'

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
  const supabase = createClient()

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

    // Validate turnstile token
    if (!turnstileToken) {
      setError('Please complete the bot protection verification')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    })

    if (error) {
      setError(error.message)
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
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
            hint="Minimum 8 characters"
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
          />

          {/* Cloudflare Turnstile bot protection */}
          <div className="flex justify-center py-2">
            <div ref={turnstileRef}></div>
          </div>

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
