'use client'

import { useState, useEffect } from 'react'
import { saveGymCredentials, getGymCredentials, type GymCredentialsFormData } from '@/app/actions/gym-credentials'
import { useRouter } from 'next/navigation'

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="gym_url" className="block text-sm font-medium text-gray-700 mb-1">
          Gym URL <span className="text-red-500">*</span>
        </label>
        <input
          id="gym_url"
          name="gym_url"
          type="url"
          value={formData.gym_url}
          onChange={handleChange}
          required
          placeholder="https://ops1.operations.daxko.com/Online/4032/GXP/ClassSchedule.mvc"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          The URL where you log in to book classes
        </p>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="Email or phone number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Your YMCA login username (email or phone number)
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password {!initialCredentials && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required={!initialCredentials}
            placeholder={initialCredentials ? "Leave blank to keep current password" : "Enter your gym password"}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {initialCredentials && (
          <p className="mt-1 text-xs text-gray-500">
            Leave blank to keep current password, or enter a new password to update (confirm password required)
          </p>
        )}
      </div>

      {(formData.password || !initialCredentials) && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={!!formData.password}
              placeholder="Confirm your gym password"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {initialCredentials 
              ? "Re-enter your password to confirm the change"
              : "Re-enter your password to confirm"}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="default_branch" className="block text-sm font-medium text-gray-700 mb-1">
          Default Branch
        </label>
        <input
          id="default_branch"
          name="default_branch"
          type="text"
          value={formData.default_branch}
          onChange={handleChange}
          placeholder="e.g., Asheville - Downtown"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Your preferred gym branch (optional)
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          ✅ Credentials saved successfully!
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : initialCredentials ? 'Update Credentials' : 'Save Credentials'}
        </button>

        {initialCredentials && (
          <div className="text-sm text-gray-500">
            Last updated: {new Date(initialCredentials.updated_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </form>
  )
}

