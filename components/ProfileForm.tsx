'use client'

import { useState } from 'react'
import { updateEmail, updatePassword, deleteAccount } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'
import { Button, Input, Modal, Card, Alert } from '@/components/ui'
import { validateEmail, validatePassword } from '@/lib/validation'

type Props = {
  userEmail: string | undefined
}

export default function ProfileForm({ userEmail }: Props) {
  const router = useRouter()

  // Form reset keys - increment to reset Input component state after success
  const [emailFormKey, setEmailFormKey] = useState(0)
  const [passwordFormKey, setPasswordFormKey] = useState(0)

  // Email update state
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [newEmailTouched, setNewEmailTouched] = useState(false)
  const [newEmailValidationError, setNewEmailValidationError] = useState<string | null>(null)

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation
  const passwordValidation = validatePassword(newPassword)
  const strengthLevel = [
    passwordValidation.minLength,
    passwordValidation.hasLowercase,
    passwordValidation.hasUppercase,
    passwordValidation.hasDigit
  ].filter(Boolean).length

  const strengthConfig: Record<number, { label: string; color: string; width: string }> = {
    0: { label: '', color: 'bg-gray-200', width: '0%' },
    1: { label: 'Weak', color: 'bg-danger-500', width: '25%' },
    2: { label: 'Fair', color: 'bg-warning-500', width: '50%' },
    3: { label: 'Good', color: 'bg-primary-500', width: '75%' },
    4: { label: 'Strong', color: 'bg-success-500', width: '100%' }
  }

  // Confirm password validation
  const passwordsMatch = confirmNewPassword.length > 0 && newPassword === confirmNewPassword
  const showPasswordMismatch = confirmNewPassword.length > 0 && newPassword !== confirmNewPassword

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Handle email update
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    setEmailError(null)
    setEmailSuccess(false)

    // Validation
    if (!newEmail) {
      setEmailError('Please enter a new email address')
      setEmailLoading(false)
      return
    }

    if (!emailPassword) {
      setEmailError('Please enter your current password to confirm')
      setEmailLoading(false)
      return
    }

    try {
      const result = await updateEmail(newEmail, emailPassword)

      if (result.success) {
        setEmailSuccess(true)
        setNewEmail('')
        setEmailPassword('')
        setNewEmailTouched(false)
        setNewEmailValidationError(null)
        setEmailFormKey(k => k + 1) // Reset form to clear touched state

        // Success message persists until user dismisses or navigates away
      } else {
        // Handle specific error codes
        if (result.error === 'email_already_exists') {
          setEmailError('email_already_exists')
        } else {
          setEmailError(result.error || 'Failed to update email')
        }
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setEmailLoading(false)
    }
  }

  // Handle password update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields')
      setPasswordLoading(false)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (!passwordValidation.isValid) {
      setPasswordError('Password must be at least 8 characters with uppercase, lowercase, and a number')
      setPasswordLoading(false)
      return
    }

    try {
      const result = await updatePassword(currentPassword, newPassword)

      if (result.success) {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setPasswordFormKey(k => k + 1) // Reset form to clear touched state

        // Success message persists until user dismisses or navigates away
      } else {
        setPasswordError(result.error || 'Failed to update password')
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError(null)

    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion')
      setDeleteLoading(false)
      return
    }

    try {
      const result = await deleteAccount(deletePassword)

      if (result.success) {
        // Redirect to login page after successful deletion
        router.push('/login?deleted=true')
      } else {
        setDeleteError(result.error || 'Failed to delete account')
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Password visibility toggle icons
  const EyeIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )

  const EyeOffIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

  return (
    <div className="space-y-6">
      {/* Email Update Section */}
      <div className="border-b border-gray-200 pb-8">
        <h2 className="text-lg font-sora font-semibold text-gray-900 mb-4">Update Email Address</h2>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input
            label="Current Email"
            type="email"
            value={userEmail || ''}
            disabled
          />

          <Input
            key={`new-email-${emailFormKey}`}
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value)
              // Clear validation error as user types if they've already been shown an error
              if (newEmailTouched && newEmailValidationError) {
                setNewEmailValidationError(validateEmail(e.target.value))
              }
            }}
            onBlur={() => {
              setNewEmailTouched(true)
              if (newEmail) {
                setNewEmailValidationError(validateEmail(newEmail))
              }
            }}
            error={newEmailTouched ? newEmailValidationError || undefined : undefined}
            required
            placeholder="Enter new email address"
            hint={!newEmailValidationError ? "You will receive a confirmation email at the new address" : undefined}
          />

          <Input
            key={`email-password-${emailFormKey}`}
            label="Current Password"
            type={showEmailPassword ? 'text' : 'password'}
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            required
            placeholder="Enter your current password"
            hint="Confirm your identity to update your email address"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowEmailPassword(!showEmailPassword)}
                className="text-gray-500 hover:text-gray-700"
                tabIndex={-1}
                aria-label={showEmailPassword ? 'Hide password' : 'Show password'}
              >
                {showEmailPassword ? EyeOffIcon : EyeIcon}
              </button>
            }
          />

          {emailError && (
            emailError === 'email_already_exists' ? (
              <Alert variant="warning">
                That email is already tied to another account. Try a different one.
              </Alert>
            ) : (
              <Alert variant="error">{emailError}</Alert>
            )
          )}

          {emailSuccess && (
            <Alert variant="success">
              Confirmation email sent. Click the link to finish the change.
            </Alert>
          )}

          <Button type="submit" variant="primary" loading={emailLoading}>
            Update Email
          </Button>
        </form>
      </div>

      {/* Password Update Section */}
      <div className="border-b border-gray-200 pb-8">
        <h2 className="text-lg font-sora font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            key={`current-password-${passwordFormKey}`}
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Enter current password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-gray-500 hover:text-gray-700"
                tabIndex={-1}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? EyeOffIcon : EyeIcon}
              </button>
            }
          />

          <div>
            <Input
              key={`new-password-${passwordFormKey}`}
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? EyeOffIcon : EyeIcon}
                </button>
              }
            />

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="mt-3 space-y-2">
                {/* Strength bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthConfig[strengthLevel].color} transition-all duration-300 ease-out`}
                      style={{ width: strengthConfig[strengthLevel].width }}
                      role="progressbar"
                      aria-valuenow={strengthLevel}
                      aria-valuemin={0}
                      aria-valuemax={4}
                    />
                  </div>
                  <span className={`text-xs font-dm-sans font-medium min-w-[48px] ${
                    strengthLevel <= 1 ? 'text-danger-600' :
                    strengthLevel === 2 ? 'text-warning-600' :
                    strengthLevel === 3 ? 'text-primary-600' : 'text-success-600'
                  }`}>
                    {strengthConfig[strengthLevel].label}
                  </span>
                </div>

                {/* Requirements checklist */}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-dm-sans" aria-label="Password requirements">
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.minLength ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.minLength
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    8+ characters
                  </li>
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.hasLowercase ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.hasLowercase
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    Lowercase (a-z)
                  </li>
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.hasUppercase ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.hasUppercase
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    Uppercase (A-Z)
                  </li>
                  <li className={`flex items-center gap-1.5 transition-colors ${passwordValidation.hasDigit ? 'text-success-600' : 'text-gray-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {passwordValidation.hasDigit
                        ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        : <circle cx="10" cy="10" r="3" />
                      }
                    </svg>
                    Number (0-9)
                  </li>
                </ul>
              </div>
            )}
          </div>

          <Input
            key={`confirm-password-${passwordFormKey}`}
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            placeholder="Confirm new password"
            error={showPasswordMismatch ? "Passwords don't match" : undefined}
            success={passwordsMatch ? "Passwords match" : undefined}
            rightIcon={
              passwordsMatch ? (
                <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? EyeOffIcon : EyeIcon}
                </button>
              )
            }
          />

          {passwordError && (
            <Alert variant="error">{passwordError}</Alert>
          )}

          {passwordSuccess && (
            <Alert variant="success">Password updated — use the new one next time you sign in.</Alert>
          )}

          <Button type="submit" variant="primary" loading={passwordLoading}>
            Update Password
          </Button>
        </form>
      </div>

      {/* Delete Account Section */}
      <div>
        <h2 className="text-lg font-sora font-semibold text-danger-700 mb-4">Delete Account</h2>
        <p className="text-sm text-gray-600 mb-4 font-dm-sans">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete My Account
          </Button>
        ) : (
          <div className="space-y-4 p-4 border-2 border-danger-200 rounded-lg bg-danger-50">
            <div className="flex items-start space-x-2">
              <svg className="h-6 w-6 text-danger-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-sora font-semibold text-danger-900">Are you absolutely sure?</h3>
                <p className="text-sm text-danger-800 mt-1 font-dm-sans">
                  This will permanently delete your account, all your recurring classes, gym credentials, and booking history. This action cannot be undone.
                </p>
              </div>
            </div>

            <Input
              label="Enter your password to confirm"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              error={deleteError || undefined}
            />

            <div className="flex space-x-3">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={deleteLoading}
              >
                Yes, Delete My Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletePassword('')
                  setDeleteError(null)
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
