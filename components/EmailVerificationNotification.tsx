'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function EmailVerificationNotification() {
  const [showSuccess, setShowSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check for email verification success in URL hash
    const hash = window.location.hash

    // Debug: Log what we're seeing
    console.log('EmailVerificationNotification - Hash:', hash)
    console.log('EmailVerificationNotification - SearchParams:', searchParams.toString())

    // Parse hash parameters
    const hashParams = new URLSearchParams(hash.substring(1)) // Remove leading #
    const hashType = hashParams.get('type')
    const accessToken = hashParams.get('access_token')
    const hashMessage = hashParams.get('message')

    console.log('EmailVerificationNotification - Type:', hashType)
    console.log('EmailVerificationNotification - Message:', hashMessage)
    console.log('EmailVerificationNotification - Has access token:', !!accessToken)

    // Check for email verification success in multiple ways:
    // 1. Hash contains type=email_change (email update verification - when double confirm is disabled)
    // 2. Hash contains type=signup (initial signup verification)
    // 3. Hash contains message=Confirmation link accepted (when double confirm is enabled)
    // 4. Query param email_verified=true
    // 5. Hash contains access_token (successful auth after verification)
    const isEmailVerified =
      hashType === 'email_change' ||
      hashType === 'signup' ||
      (hashMessage && hashMessage.toLowerCase().includes('confirmation link accepted')) ||
      searchParams.get('email_verified') === 'true' ||
      (hash.includes('access_token') && hash.includes('type='))

    console.log('EmailVerificationNotification - Is verified:', isEmailVerified)

    if (isEmailVerified) {
      setShowSuccess(true)

      // Clear the hash after showing the message
      if (hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (!showSuccess) return null

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
      <div className="flex items-start space-x-3">
        <svg
          className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">Email Verified Successfully!</h3>
          <p className="text-sm text-green-800 mt-1">
            Your email address has been updated and verified. You're all set!
          </p>
        </div>
        <button
          onClick={() => setShowSuccess(false)}
          className="text-green-600 hover:text-green-800"
          aria-label="Close notification"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
