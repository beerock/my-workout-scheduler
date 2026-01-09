'use client'

import { useState, useEffect } from 'react'
import { updateNotificationPreferences } from '@/app/actions/user-settings'

// Frequency options for UI (daily_digest removed as post-MVP)
type NotificationFrequency = 'immediate' | 'critical_only' | 'off'

// Legacy frequency type includes daily_digest for database compatibility
type LegacyFrequency = NotificationFrequency | 'daily_digest'

type NotificationPreferences = {
  notification_email: boolean
  notification_frequency: LegacyFrequency // Allow legacy values from database
  email_on_success: boolean
  email_on_waitlist: boolean
  email_on_failure: boolean
  email_on_retry: boolean
  email_on_pause_reminder: boolean
}

type Props = {
  initialPreferences: NotificationPreferences
}

export default function NotificationPreferencesForm({ initialPreferences }: Props) {
  // Form state
  const [notificationEmail, setNotificationEmail] = useState(initialPreferences.notification_email)
  // Handle legacy 'daily_digest' frequency by defaulting to 'immediate'
  const [frequency, setFrequency] = useState<NotificationFrequency>(
    initialPreferences.notification_frequency === 'daily_digest'
      ? 'immediate'
      : initialPreferences.notification_frequency as NotificationFrequency
  )
  const [emailOnSuccess, setEmailOnSuccess] = useState(initialPreferences.email_on_success)
  const [emailOnWaitlist, setEmailOnWaitlist] = useState(initialPreferences.email_on_waitlist)
  const [emailOnFailure, setEmailOnFailure] = useState(initialPreferences.email_on_failure)
  const [emailOnRetry, setEmailOnRetry] = useState(initialPreferences.email_on_retry)
  const [emailOnPauseReminder, setEmailOnPauseReminder] = useState(initialPreferences.email_on_pause_reminder ?? true)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validation: If immediate mode, at least one toggle must be enabled
    if (frequency === 'immediate' && !emailOnSuccess && !emailOnWaitlist && !emailOnFailure && !emailOnRetry) {
      setError('Please enable at least one notification type in immediate mode')
      setLoading(false)
      return
    }

    try {
      const result = await updateNotificationPreferences({
        notification_email: notificationEmail,
        notification_frequency: frequency,
        email_on_success: emailOnSuccess,
        email_on_waitlist: emailOnWaitlist,
        email_on_failure: emailOnFailure,
        email_on_retry: emailOnRetry,
        email_on_pause_reminder: emailOnPauseReminder,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to update notification preferences')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable Email Notifications Toggle */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="notification-email"
            type="checkbox"
            checked={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        <div className="ml-3">
          <label htmlFor="notification-email" className="font-medium text-gray-900">
            Enable email notifications
          </label>
          <p className="text-sm text-gray-500">
            Send me emails about my booking results
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          How often would you like to receive emails?
        </h3>

        <div className="space-y-4">
          {/* Immediate */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="frequency-immediate"
                type="radio"
                name="frequency"
                value="immediate"
                checked={frequency === 'immediate'}
                onChange={(e) => setFrequency(e.target.value as NotificationFrequency)}
                disabled={!notificationEmail}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="frequency-immediate" className="font-medium text-gray-900">
                Immediate <span className="text-sm font-normal text-gray-500">(recommended)</span>
              </label>
              <p className="text-sm text-gray-500">
                Get notified right away when bookings succeed or fail
              </p>
            </div>
          </div>

          {/* Critical Only */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="frequency-critical"
                type="radio"
                name="frequency"
                value="critical_only"
                checked={frequency === 'critical_only'}
                onChange={(e) => setFrequency(e.target.value as NotificationFrequency)}
                disabled={!notificationEmail}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="frequency-critical" className="font-medium text-gray-900">
                Critical issues only
              </label>
              <p className="text-sm text-gray-500">
                Only notify me about login failures and other urgent problems
              </p>
            </div>
          </div>

          {/* Off */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="frequency-off"
                type="radio"
                name="frequency"
                value="off"
                checked={frequency === 'off'}
                onChange={(e) => setFrequency(e.target.value as NotificationFrequency)}
                disabled={!notificationEmail}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="frequency-off" className="font-medium text-gray-900">
                Off
              </label>
              <p className="text-sm text-gray-500">
                Don't send any emails (check dashboard manually for booking status)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Toggles (only shown for immediate mode) */}
      {frequency === 'immediate' && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Email me when:
          </h3>

          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-success"
                  type="checkbox"
                  checked={emailOnSuccess}
                  onChange={(e) => setEmailOnSuccess(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="email-success" className="text-sm font-medium text-gray-900">
                  Booking confirmed
                </label>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-waitlist"
                  type="checkbox"
                  checked={emailOnWaitlist}
                  onChange={(e) => setEmailOnWaitlist(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="email-waitlist" className="text-sm font-medium text-gray-900">
                  Waitlisted
                </label>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-failure"
                  type="checkbox"
                  checked={emailOnFailure}
                  onChange={(e) => setEmailOnFailure(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="email-failure" className="text-sm font-medium text-gray-900">
                  Booking failed (errors)
                </label>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-retry"
                  type="checkbox"
                  checked={emailOnRetry}
                  onChange={(e) => setEmailOnRetry(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="email-retry" className="text-sm font-medium text-gray-900">
                  Class full (first retry notification)
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Reminder Toggle (always visible when notifications enabled) */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Other notifications
        </h3>

        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="email-pause-reminder"
                type="checkbox"
                checked={emailOnPauseReminder}
                onChange={(e) => setEmailOnPauseReminder(e.target.checked)}
                disabled={!notificationEmail}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="email-pause-reminder" className="text-sm font-medium text-gray-900">
                Pause reminder
              </label>
              <p className="text-sm text-gray-500">
                Remind me if my schedule has been paused for 7 days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          ✅ Notification preferences updated successfully!
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
