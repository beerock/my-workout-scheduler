'use server'

export type SignupResult = {
  success: boolean
  error?: string
}

/**
 * Server action for user signup.
 * Signups are currently disabled (invite-only private beta).
 */
export async function signupWithTurnstile(
  email: string,
  password: string,
  turnstileToken: string
): Promise<SignupResult> {
  return { success: false, error: 'Sign-ups are currently closed. Please contact the team for an invite.' }
}
