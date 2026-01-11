'use client'

import { useState, useEffect } from 'react'
import { saveGymCredentials, type GymCredentialsFormData } from '@/app/actions/gym-credentials'
import { useRouter } from 'next/navigation'
import { Button, Input, Alert } from '@/components/ui'

type Credentials = {
  id: string
  gym_url: string
  username: string
  default_branch: string | null
  created_at: string
  updated_at: string
}

type Props = {
  initialCredentials: Credentials | null
}

export default function GymCredentialsForm({ initialCredentials }: Props) {
  const router = useRouter()

  // Form reset key - increment to reset Input component state after success
  const [formKey, setFormKey] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<GymCredentialsFormData>({
    gym_url: initialCredentials?.gym_url || '',
    username: initialCredentials?.username || '',
    password: '', // Never pre-fill password
    default_branch: initialCredentials?.default_branch || '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')

  // Confirm password validation
  const passwordsMatch = confirmPassword.length > 0 && formData.password === confirmPassword
  const showPasswordMismatch = confirmPassword.length > 0 && formData.password !== confirmPassword

  // Update form when initialCredentials change
  useEffect(() => {
    if (initialCredentials) {
      setFormData({
        gym_url: initialCredentials.gym_url,
        username: initialCredentials.username,
        password: '', // Never pre-fill password
        default_branch: initialCredentials.default_branch || '',
      })
    }
  }, [initialCredentials])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Basic validation
    if (!formData.gym_url || !formData.username) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Password is required for new credentials, optional for updates
    if (!initialCredentials && !formData.password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    // If password is provided (new or update), confirm password is required
    if (formData.password && formData.password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const result = await saveGymCredentials(formData)

      if (result.success) {
        setSuccess(true)
        setFormData(prev => ({ ...prev, password: '' })) // Clear password field
        setConfirmPassword('') // Clear confirm password field
        setFormKey(k => k + 1) // Reset form to clear touched state
        router.refresh() // Refresh to get updated credentials

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to save credentials')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Password visibility toggle icon
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        key={`gym_url-${formKey}`}
        label="Gym URL"
        name="gym_url"
        type="url"
        value={formData.gym_url}
        onChange={handleChange}
        required
        placeholder="https://operations.daxko.com/online/4032/GXP/ClassSchedule.mvc"
        hint="The URL where you log in to book classes"
      />
      <Input
        key={`username-${formKey}`}
        label="Gym Login"
        name="username"
        type="text"
        value={formData.username}
        onChange={handleChange}
        required
        placeholder="Enter your gym login"
        hint="Use the same login you use to access your gym's website (email, phone, member ID, etc.)"
      />

      <Input
        key={`password-${formKey}`}
        label={initialCredentials ? "Password" : "Password *"}
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange}
        required={!initialCredentials}
        placeholder={initialCredentials ? "Leave blank to keep current password" : "Enter your gym password"}
        hint={initialCredentials ? "Leave blank to keep current password, or enter a new password to update" : undefined}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-500 hover:text-gray-700"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? EyeOffIcon : EyeIcon}
          </button>
        }
      />

      {(formData.password || !initialCredentials) && (
        <Input
          key={`confirmPassword-${formKey}`}
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required={!!formData.password}
          placeholder="Confirm your gym password"
          hint={passwordsMatch ? "Passwords match" : (initialCredentials ? "Re-enter your password to confirm the change" : "Re-enter your password to confirm")}
          error={showPasswordMismatch ? "Passwords don't match" : undefined}
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
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? EyeOffIcon : EyeIcon}
              </button>
            )
          }
        />
      )}

      <Input
        key={`default_branch-${formKey}`}
        label="Default Branch"
        name="default_branch"
        type="text"
        value={formData.default_branch}
        onChange={handleChange}
        placeholder="e.g., Asheville - Downtown"
        hint="Your preferred gym branch (optional)"
      />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {success && (
        <Alert variant="success">Credentials saved successfully!</Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {initialCredentials ? 'Update Credentials' : 'Save Credentials'}
        </Button>

        {initialCredentials && (
          <p className="text-sm text-gray-500 font-dm-sans">
            Last updated: {new Date(initialCredentials.updated_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </form>
  )
}

