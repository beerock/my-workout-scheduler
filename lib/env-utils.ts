/**
 * Environment utility functions
 *
 * Handles environment variable resolution and environment-specific configuration
 */

/**
 * Get the site URL for the current environment
 *
 * Priority order:
 * 1. NEXT_PUBLIC_SITE_URL (explicit override, production only)
 * 2. VERCEL_URL (auto-injected by Vercel for preview/production)
 * 3. http://localhost:3000 (local development fallback)
 *
 * Usage:
 * - Email verification links: `${getSiteUrl()}/auth/callback?token=${token}`
 * - Redirect after login: `redirect(getSiteUrl() + '/dashboard')`
 * - API callbacks: `${getSiteUrl()}/api/webhooks/booking`
 *
 * Environment-specific behavior:
 * - Local development: Returns http://localhost:3000
 * - Vercel preview: Returns https://{auto-generated-preview-url}.vercel.app
 * - Production: Returns https://my-workout-scheduler.vercel.app (if NEXT_PUBLIC_SITE_URL is set)
 *
 * @returns The base URL for the current environment (without trailing slash)
 *
 * @example
 * // Local development
 * getSiteUrl() // => 'http://localhost:3000'
 *
 * @example
 * // Vercel preview (auto-detected)
 * getSiteUrl() // => 'https://my-workout-scheduler-git-feature-team.vercel.app'
 *
 * @example
 * // Production (explicit override)
 * getSiteUrl() // => 'https://my-workout-scheduler.vercel.app'
 */
export function getSiteUrl(): string {
  // 1. Explicit override (set in production via NEXT_PUBLIC_SITE_URL)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '') // Remove trailing slash
  }

  // 2. Vercel auto-detected URL (preview/production deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. Local development fallback
  return 'http://localhost:3000'
}

/**
 * Get email configuration with environment-aware defaults
 *
 * Returns the configured sender email and name, with sensible defaults
 * for development environments.
 *
 * @returns Email configuration object
 *
 * @example
 * const { fromEmail, fromName } = getEmailConfig()
 * // Production: { fromEmail: 'noreply@yourdomain.com', fromName: 'My Workout Scheduler' }
 * // Development: { fromEmail: 'onboarding@resend.dev', fromName: 'My Workout Scheduler' }
 */
export function getEmailConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    fromEmail: process.env.RESEND_FROM_EMAIL || (isDevelopment ? 'onboarding@resend.dev' : 'onboarding@resend.dev'),
    fromName: process.env.RESEND_FROM_NAME || 'My Workout Scheduler',
  }
}

/**
 * Get the current environment name
 *
 * Useful for conditional logic and logging.
 *
 * @returns One of: 'development', 'preview', 'production'
 *
 * @example
 * if (getEnvironment() === 'production') {
 *   // Enable production-only features
 * }
 */
export function getEnvironment(): 'development' | 'preview' | 'production' {
  if (process.env.VERCEL_ENV === 'production') {
    return 'production'
  }

  if (process.env.VERCEL_ENV === 'preview') {
    return 'preview'
  }

  return 'development'
}

/**
 * Check if running in production
 *
 * @returns True if in production environment
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

/**
 * Check if running in development
 *
 * @returns True if in local development environment
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

/**
 * Check if running in preview deployment
 *
 * @returns True if in Vercel preview deployment
 */
export function isPreview(): boolean {
  return getEnvironment() === 'preview'
}

/**
 * Get the Resend API key with validation
 *
 * Throws an error if the API key is not configured, preventing runtime errors
 * when attempting to send emails.
 *
 * @returns The Resend API key
 * @throws Error if RESEND_API_KEY is not set
 *
 * @example
 * try {
 *   const apiKey = getResendApiKey()
 *   // Use apiKey to send email
 * } catch (error) {
 *   console.error('Email sending not configured:', error)
 * }
 */
export function getResendApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured. Please add it to your environment variables. ' +
      'See docs/ENVIRONMENT_VARIABLES_STRATEGY.md for setup instructions.'
    )
  }

  return apiKey
}

/**
 * Validate that all required environment variables are set
 *
 * Useful for startup checks or health endpoints.
 *
 * @returns Object with validation results
 *
 * @example
 * const validation = validateEnv()
 * if (!validation.isValid) {
 *   console.error('Missing required environment variables:', validation.missing)
 * }
 */
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ENCRYPTION_KEY',
    'INNGEST_EVENT_KEY',
    'INNGEST_SIGNING_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  return {
    isValid: missing.length === 0,
    missing,
    environment: getEnvironment(),
    siteUrl: getSiteUrl(),
  }
}
