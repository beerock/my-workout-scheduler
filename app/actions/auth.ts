'use server'

import { createClient } from '@/lib/supabase/server'
import { validateEmail, validatePassword, getPasswordErrorMessage } from '@/lib/validation'

export type SignupResult = {
  success: boolean
  error?: string
}

/**
 * Verify Turnstile token with Cloudflare API.
 * SECURITY: This must be done server-side to prevent bypassing.
 */
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('[Auth] TURNSTILE_SECRET_KEY not configured - skipping verification')
    // In development without key configured, allow signup
    // In production, you should always have this configured
    return process.env.NODE_ENV === 'development'
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    )

    const data = await response.json()

    if (!data.success) {
      console.error('[Auth] Turnstile verification failed:', data['error-codes'])
    }

    return data.success === true
  } catch (error) {
    console.error('[Auth] Turnstile verification request failed:', error)
    return false
  }
}

/**
 * Server action for user signup with Turnstile verification.
 * SECURITY: Validates Turnstile token server-side before creating user.
 */
export async function signupWithTurnstile(
  email: string,
  password: string,
  turnstileToken: string
): Promise<SignupResult> {
  // Signups are currently disabled (invite-only)
  return { success: false, error: 'Sign-ups are currently closed. Please contact the team for an invite.' }

  // 1. Verify Turnstile token FIRST (before any other processing)
  if (!turnstileToken) {
    return { success: false, error: 'Bot verification required' }
  }

  const isValidToken = await verifyTurnstileToken(turnstileToken)
  if (!isValidToken) {
    return { success: false, error: 'Bot verification failed. Please try again.' }
  }

  // 2. Validate email format
  const emailError = validateEmail(email)
  if (emailError) {
    return { success: false, error: emailError }
  }

  // 3. Validate password strength
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return { success: false, error: getPasswordErrorMessage() }
  }

  // 4. Create user with Supabase
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      // Don't expose internal error details
      console.error('[Auth] Signup error:', error.message)

      // Return user-friendly error messages
      if (error.message.includes('already registered')) {
        return { success: false, error: 'An account with this email may already exist. Try signing in instead.' }
      }

      return { success: false, error: 'Unable to create account. Please try again.' }
    }

    return { success: true }
  } catch (error) {
    console.error('[Auth] Unexpected signup error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
