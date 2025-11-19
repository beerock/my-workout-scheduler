'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type NotificationType = 'success' | 'error' | null

export default function EmailVerificationNotification() {
  const [notification, setNotification] = useState<NotificationType>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check for email verification success or error in URL hash
    const hash = window.location.hash

    // Debug: Log what we're seeing
    console.log('EmailVerificationNotification - Hash:', hash)
    console.log('EmailVerificationNotification - SearchParams:', searchParams.toString())

    // Parse hash parameters
    const hashParams = new URLSearchParams(hash.substring(1)) // Remove leading #
    const hashType = hashParams.get('type')
    const accessToken = hashParams.get('access_token')
    const hashMessage = hashParams.get('message')
    const hashError = hashParams.get('error')
    const hashErrorDescription = hashParams.get('error_description')

    console.log('EmailVerificationNotification - Type:', hashType)
    console.log('EmailVerificationNotification - Message:', hashMessage)
    console.log('EmailVerificationNotification - Error:', hashError)
    console.log('EmailVerificationNotification - Error Description:', hashErrorDescription)
    console.log('EmailVerificationNotification - Has access token:', !!accessToken)

    // Check for errors first
    if (hashError || hashErrorDescription) {
      setNotification('error')
      // Use error description if available, otherwise use generic message
      const errorMsg = hashErrorDescription || hashError || 'An error occurred during verification'
      setErrorMessage(decodeURIComponent(errorMsg.replace(/\+/g, ' ')))

      // Clear the hash after showing the message
      if (hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setNotification(null)
      }, 10000)

      return () => clearTimeout(timer)
    }

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
      setNotification('success')

      // Clear the hash after showing the message
      if (hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setNotification(null)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (notification === 'success') {
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
            onClick={() => setNotification(null)}
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

  if (notification === 'error') {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start space-x-3">
          <svg
            className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Verification Error</h3>
            <p className="text-sm text-red-800 mt-1">
              {errorMessage}
            </p>
            {errorMessage.toLowerCase().includes('expired') && (
              <p className="text-sm text-red-700 mt-2">
                The verification link has expired. Please request a new email change from your profile settings.
              </p>
            )}
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-red-600 hover:text-red-800"
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

  return null
}
