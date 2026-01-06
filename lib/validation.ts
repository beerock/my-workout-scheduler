/**
 * Shared validation utilities for email and password validation.
 * Used by both client-side forms and server-side actions for consistency.
 */

/**
 * Validates email format.
 * @param email - The email to validate
 * @returns Error message if invalid, null if valid or empty
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? null : 'Please enter a valid email address'
}

/**
 * Password validation result with individual requirement checks.
 */
export interface PasswordValidation {
  minLength: boolean
  hasLowercase: boolean
  hasUppercase: boolean
  hasDigit: boolean
  isValid: boolean
}

/**
 * Validates password against requirements:
 * - At least 8 characters
 * - At least one lowercase letter (a-z)
 * - At least one uppercase letter (A-Z)
 * - At least one digit (0-9)
 *
 * Note: Special characters are NOT required (matches Supabase config).
 *
 * @param password - The password to validate
 * @returns Object with individual requirement checks and overall validity
 */
export const validatePassword = (password: string): PasswordValidation => {
  const minLength = password.length >= 8
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)

  return {
    minLength,
    hasLowercase,
    hasUppercase,
    hasDigit,
    isValid: minLength && hasLowercase && hasUppercase && hasDigit
  }
}

/**
 * Returns a user-friendly error message for invalid passwords.
 * Use this in server-side validation for consistent error messages.
 */
export const getPasswordErrorMessage = (): string => {
  return 'Password must be at least 8 characters with uppercase, lowercase, and a number'
}
