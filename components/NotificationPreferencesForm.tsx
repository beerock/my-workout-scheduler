'use client'

import { useState, useEffect } from 'react'
import { updateNotificationPreferences } from '@/app/actions/user-settings'
import { Checkbox, Alert, Button } from '@/components/ui'

type NotificationPreferences = {
  notification_email: boolean
  notification_frequency: string // Keep for backward compatibility
  email_on_success: boolean
  email_on_waitlist: boolean
  email_on_retry: boolean
  email_on_pause_reminder: boolean
}

type Props = {
  initialPreferences: NotificationPreferences
}

export default function NotificationPreferencesForm({ initialPreferences }: Props) {
  // Form state
  const [notificationEmail, setNotificationEmail] = useState(initialPreferences.notification_email)
  const [emailOnSuccess, setEmailOnSuccess] = useState(initialPreferences.email_on_success)
  const [emailOnWaitlist, setEmailOnWaitlist] = useState(initialPreferences.email_on_waitlist)
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

    try {
      const result = await updateNotificationPreferences({
        notification_email: notificationEmail,
        notification_frequency: 'immediate', // Always immediate (simplified)
        email_on_success: emailOnSuccess,
        email_on_waitlist: emailOnWaitlist,
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

  // Determine if toggles should be disabled
  const togglesDisabled = !notificationEmail

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Master Toggle */}
      <Checkbox
        checked={notificationEmail}
        onChange={(e) => setNotificationEmail(e.target.checked)}
        label="Email me about my bookings"
        description="Turn off entirely if you'd rather just check the dashboard."
      />

      {/* Critical Emails Info Callout — coach voice per docs/VOICE.md, FYI
          tier. Replaces the compliance-speak "Critical alerts ... always sent"
          line. */}
      <Alert variant="info">
        Some alerts we always send — login problems, cancelled classes — because those need your attention. Everything else you control below.
      </Alert>

      {/* Booking Results Section */}
      <div className={`space-y-4 ${togglesDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="border-b border-gray-200 pb-2">
          <h4 className="font-sora text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Booking Results
          </h4>
        </div>

        <div className="space-y-4 pl-1">
          <Checkbox
            checked={emailOnSuccess}
            onChange={(e) => setEmailOnSuccess(e.target.checked)}
            disabled={togglesDisabled}
            label="Got you in"
            description="When a class lands."
          />

          <Checkbox
            checked={emailOnWaitlist}
            onChange={(e) => setEmailOnWaitlist(e.target.checked)}
            disabled={togglesDisabled}
            label="On the waitlist"
            description="When a class is packed and you've been added to its waitlist."
          />

          <Checkbox
            checked={emailOnRetry}
            onChange={(e) => setEmailOnRetry(e.target.checked)}
            disabled={togglesDisabled}
            label="Class full, watching for a spot"
            description="Status updates while a packed class is being re-checked every 15 minutes."
          />
        </div>
      </div>

      {/* Other Notifications Section */}
      <div className={`space-y-4 ${togglesDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="border-b border-gray-200 pb-2">
          <h4 className="font-sora text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Other Notifications
          </h4>
        </div>

        <div className="space-y-4 pl-1">
          <Checkbox
            checked={emailOnPauseReminder}
            onChange={(e) => setEmailOnPauseReminder(e.target.checked)}
            disabled={togglesDisabled}
            label="Pause check-in"
            description="A quiet nudge if your schedule has been paused for a week."
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert variant="success">
          Saved — changes take effect on the next email.
        </Alert>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
