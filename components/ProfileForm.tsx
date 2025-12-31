'use client'

import { useState } from 'react'
import { updateEmail, updatePassword, deleteAccount } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'
import { Button, Input, Modal, Card } from '@/components/ui'

type Props = {
  userEmail: string | undefined
}

export default function ProfileForm({ userEmail }: Props) {
  const router = useRouter()

  // Email update state
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

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

        // Success message persists until user dismisses or navigates away
      } else {
        setEmailError(result.error || 'Failed to update email')
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

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
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
    <div className="space-y-8">
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
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="Enter new email address"
            hint="You will receive a confirmation email at the new address"
          />

          <Input
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
              >
                {showEmailPassword ? EyeOffIcon : EyeIcon}
              </button>
            }
          />

          {emailError && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm font-dm-sans">
              {emailError}
            </div>
          )}

          {emailSuccess && (
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm font-dm-sans">
              Confirmation email sent! Please check your inbox and confirm the new email address.
            </div>
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
              >
                {showCurrentPassword ? EyeOffIcon : EyeIcon}
              </button>
            }
          />

          <Input
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
            hint="Must be at least 6 characters long"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showNewPassword ? EyeOffIcon : EyeIcon}
              </button>
            }
          />

          <Input
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            placeholder="Confirm new password"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? EyeOffIcon : EyeIcon}
              </button>
            }
          />

          {passwordError && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm font-dm-sans">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm font-dm-sans">
              Password updated successfully!
            </div>
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
