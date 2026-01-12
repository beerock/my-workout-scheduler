/**
 * Booking Error Utilities
 *
 * Provides error categorization for booking failures and support mailto generation.
 * Matches the email system's 3-tier categorization from lib/email/get-email-template.ts
 */

export type FailureCategory = 'critical' | 'config' | 'technical' | 'retrying'

export type FailureCategoryInfo = {
  category: FailureCategory
  label: string
  description: string
  variant: 'danger' | 'warning' | 'info' | 'primary'
  icon: 'alert-triangle' | 'settings' | 'refresh-cw'
}

/**
 * Check if a failed booking attempt is a "class full" retry.
 * These should be displayed as "Class Full" (blue/informational) instead of "Failed" (red).
 *
 * "Class full" is NOT a failure - it means the system worked correctly but the class had no openings.
 * We show this as informational regardless of whether the class is in the past or future.
 *
 * @param status - The booking attempt status
 * @param errorMessage - The error message from the attempt
 * @returns true if this is a "class full" situation (not an actual error)
 */
export function isRetrying(
  status: string,
  errorMessage: string | null
): boolean {
  if (status !== 'failed') return false
  if (!errorMessage) return false

  const msg = errorMessage.toLowerCase()

  // Check if error is about class being full (not waitlist full - that's different)
  return msg.includes('full') && !msg.includes('waitlist')
}

/**
 * Get category info for "class full" situation.
 * This is informational, not an error - the system worked correctly.
 */
export function getRetryingCategoryInfo(): FailureCategoryInfo {
  return {
    category: 'retrying',
    label: 'Class Full',
    description: 'Class was full - we tried but no spots opened up',
    variant: 'primary',
    icon: 'refresh-cw',
  }
}

/**
 * Categorize a booking failure by error message keywords.
 * Matches the email system's categorization logic.
 *
 * Categories:
 * - critical: User must take action (login, credentials, cancelled, conflicts)
 * - config: Settings/configuration issue (class not found, branch mismatch)
 * - technical: Temporary/system issue (default fallback)
 */
export function categorizeFailure(errorMessage: string | null): FailureCategoryInfo {
  if (!errorMessage) {
    return {
      category: 'technical',
      label: 'Temporary Issue',
      description: 'We encountered an unexpected error',
      variant: 'info',
      icon: 'refresh-cw',
    }
  }

  const msg = errorMessage.toLowerCase()

  // Critical - user must take action (matches email system)
  const criticalKeywords = [
    'login failed',
    'class cancelled',
    'class is cancelled',
    'not reservable',
    'time conflict',
    'already have a class',
    'password',
    'credentials',
  ]

  // Config - settings issue (matches email system)
  const configKeywords = [
    'not found',
    'class disappeared',
    'branch selection failed',
    'branch mismatch',
    'wrong class',
    'class name',
  ]

  if (criticalKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'critical',
      label: 'Action Required',
      description: 'This needs your attention',
      variant: 'danger',
      icon: 'alert-triangle',
    }
  }

  if (configKeywords.some(kw => msg.includes(kw))) {
    return {
      category: 'config',
      label: 'Class Issue',
      description: 'There may be a configuration problem',
      variant: 'warning',
      icon: 'settings',
    }
  }

  return {
    category: 'technical',
    label: 'Temporary Issue',
    description: 'This is usually temporary',
    variant: 'info',
    icon: 'refresh-cw',
  }
}

/**
 * Generate a mailto link with prefilled subject and body for support requests.
 */
export function generateSupportMailto(params: {
  className: string
  dayOfWeek: string
  classTime: string
  branch: string
  errorCategory: string
  errorMessage: string
  attemptDate: string
}): string {
  const subject = encodeURIComponent(`Booking Help: ${params.className}`)
  const body = encodeURIComponent(
    `Hi,

I need help with a booking issue:

Class: ${params.className}
Day: ${params.dayOfWeek}
Time: ${params.classTime}
Branch: ${params.branch}
Issue: ${params.errorCategory}
Date: ${params.attemptDate}

Error details:
${params.errorMessage}

Thanks!`
  )

  return `mailto:help@beerock.com?subject=${subject}&body=${body}`
}
