/**
 * Environment configuration utilities
 * Handles dynamic URL resolution across environments
 */

/**
 * Get the site URL for the current environment
 * Priority: Explicit override > Vercel URL > Localhost fallback
 */
export function getSiteUrl(): string {
  // 1. Explicit override (for production and local)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // 2. Vercel deployment (production and preview branches)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // 3. Fallback to localhost for local development
  return 'http://localhost:3000'
}

/**
 * Get the auth callback URL for email verification and password reset
 */
export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`
}
