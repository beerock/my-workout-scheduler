/**
 * Rewrites raw Supabase auth error messages that read awkwardly in-app.
 *
 * Currently handles:
 *  - "For security purposes, you can only request this after N seconds."
 *    Supabase's built-in rate-limiter message. Reads like a developer
 *    error rather than user-facing copy. We reframe it as a positive
 *    "you may submit again in N seconds" instruction.
 *
 * For any error we don't explicitly rewrite, the original message passes
 * through unchanged — don't silently swallow unfamiliar errors.
 */
export function rewriteAuthError(message: string): string {
  if (!message) return message

  // Supabase rate-limit error. The N (seconds) must be preserved so the
  // user sees an accurate countdown, not a generic "try again later".
  const rateLimit = message.match(
    /^For security purposes, you can only request this after (\d+) seconds?\.?$/i
  )
  if (rateLimit) {
    const seconds = rateLimit[1]
    return `For security purposes, you may submit again in ${seconds} second${seconds === '1' ? '' : 's'}.`
  }

  return message
}
