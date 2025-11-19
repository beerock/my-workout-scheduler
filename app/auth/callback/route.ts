import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

  // Code is required for token exchange
  if (!code) {
    console.error('No code provided in auth callback')
    return NextResponse.redirect(
      new URL('/login?error=No verification code provided', request.url)
    )
  }

  try {
    const supabase = await createClient()

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)

      // Handle specific error cases
      if (exchangeError.message.includes('expired')) {
        return NextResponse.redirect(
          new URL('/login?error=Verification link expired. Please sign up again or request a new link.', request.url)
        )
      }

      if (exchangeError.message.includes('already been used')) {
        return NextResponse.redirect(
          new URL('/login?message=Email already verified. Please log in.', request.url)
        )
      }

      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      )
    }

    // Success - redirect to dashboard or specified next page
    // Add success message as query param
    const redirectUrl = new URL(next, request.url)
    redirectUrl.searchParams.set('message', 'Email verified successfully!')

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL('/login?error=An unexpected error occurred. Please try again.', request.url)
    )
  }
}
