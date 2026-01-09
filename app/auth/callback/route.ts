import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/notifications/send-welcome-email'

/**
 * Auth Callback Route
 * Handles email verification and password reset token exchanges
 *
 * Flow:
 * 1. User clicks link in email (verification or password reset)
 * 2. Link contains auth code as URL parameter
 * 3. Exchange code for session
 * 4. Redirect to appropriate page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle error from Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  try {
    const supabase = await createClient()

    // Handle PKCE flow (code parameter)
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)

        // Handle specific error cases
        if (exchangeError.message.includes('expired')) {
          return NextResponse.redirect(
            new URL('/login?error=Link expired. Please request a new verification email.', request.url)
          )
        }

        if (exchangeError.message.includes('already been used')) {
          return NextResponse.redirect(
            new URL('/login?message=Link already used. Please log in or request a new verification email.', request.url)
          )
        }

        // Handle PKCE errors (code verifier missing or mismatched)
        // This happens when clicking verification link in a different browser than where you signed up
        if (exchangeError.message.includes('code') || exchangeError.message.includes('verifier')) {
          return NextResponse.redirect(
            new URL('/login?error=Please open the verification link in the same browser where you signed up. If you\'ve closed that browser, please sign up again.', request.url)
          )
        }

        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        )
      }

      // Success - redirect to next page
      const redirectUrl = new URL(next, request.url)
      if (type !== 'recovery') {
        // Pass verification type to notification component for appropriate messaging
        redirectUrl.searchParams.set('email_verified', 'true')
        redirectUrl.searchParams.set('verification_type', type || 'signup')

        // Send welcome email for new signups (not password recovery)
        if (type === 'signup' || type === 'email' || !type) {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.id) {
              await sendWelcomeEmail(user.id)
              console.log(`[Auth Callback] Welcome email sent to user ${user.id}`)
            }
          } catch (emailError) {
            console.error('[Auth Callback] Failed to send welcome email:', emailError)
            // Non-critical - continue with redirect
          }
        }
      }
      return NextResponse.redirect(redirectUrl)
    }

    // Handle legacy token hash flow (for password reset and email change)
    if (tokenHash && type) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      })

      if (verifyError) {
        console.error('Error verifying token:', verifyError)
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(verifyError.message)}`, request.url)
        )
      }

      // Success - redirect to next page
      const redirectUrl = new URL(next, request.url)

      // For email change, show verification notification
      if (type === 'email_change') {
        redirectUrl.searchParams.set('email_verified', 'true')
        redirectUrl.searchParams.set('verification_type', 'email_change')
      }

      return NextResponse.redirect(redirectUrl)
    }

    // No valid parameters provided
    console.error('No valid auth parameters (code or token_hash) in callback')
    return NextResponse.redirect(
      new URL('/login?error=Invalid verification link', request.url)
    )
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL('/login?error=An unexpected error occurred. Please try again.', request.url)
    )
  }
}
