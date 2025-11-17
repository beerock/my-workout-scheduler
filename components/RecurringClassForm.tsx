'use client'

import { useState, useEffect } from 'react'
import { saveRecurringClass, type RecurringClassFormData } from '@/app/actions/recurring-classes'
import { useRouter } from 'next/navigation'
import { COMMON_TIMEZONES } from '@/lib/date-utils'
import type { RecurringClass } from '@/lib/database.types'

type Props = {
  initialClass?: RecurringClass | null
  isCopy?: boolean // Indicates if this is a copy operation
  onSuccess?: () => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function RecurringClassForm({ initialClass, isCopy = false, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showBookNowDialog, setShowBookNowDialog] = useState(false)
  const [savedClassId, setSavedClassId] = useState<string | null>(null)
  const [bookingClass, setBookingClass] = useState(false)
  const [formData, setFormData] = useState<RecurringClassFormData>({
    day_of_week: initialClass?.day_of_week ?? 1,
    class_time: initialClass?.class_time ? initialClass.class_time.substring(0, 5) : '',
    class_type: initialClass?.class_type || '',
    branch: initialClass?.branch || '',
    booking_window_hours: initialClass?.booking_window_hours ?? 26,
    timezone: initialClass?.timezone || 'America/New_York',
  })

  // Update form when initialClass changes
  useEffect(() => {
    if (initialClass) {
      setFormData({
        day_of_week: initialClass.day_of_week,
        class_time: initialClass.class_time.substring(0, 5), // Extract HH:MM from TIME format
        class_type: initialClass.class_type,
        branch: initialClass.branch,
        booking_window_hours: initialClass.booking_window_hours,
        timezone: initialClass.timezone,
      })
    }
  }, [initialClass])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Basic validation
    if (
      formData.day_of_week === undefined ||
      !formData.class_time ||
      !formData.class_type ||
      !formData.branch
    ) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Validate time format (should be HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(formData.class_time)) {
      setError('Please enter a valid time in HH:MM format (24-hour)')
      setLoading(false)
      return
    }

    try {
      // Convert time to HH:MM:SS format for database
      const timeWithSeconds = `${formData.class_time}:00`

      const result = await saveRecurringClass(
        {
          ...formData,
          class_time: timeWithSeconds,
        },
        (initialClass && !isCopy) ? initialClass.id : undefined
      )

      if (result.success) {
        setSuccess(true)

        // Check if booking window is already open (server-side check)
        if (result.bookingWindowAlreadyOpen && result.id) {
          // Booking window is open - show dialog asking if user wants to book now
          setSavedClassId(result.id)
          setShowBookNowDialog(true)
        } else {
          // Booking window not open - just redirect/refresh
          if (onSuccess) {
            onSuccess()
          } else {
            router.push('/dashboard/schedule')
            router.refresh()
          }

          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(false), 3000)
        }
      } else {
        setError(result.error || 'Failed to save class')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = async () => {
    if (!savedClassId) return

    setBookingClass(true)
    setError(null)

    try {
      const response = await fetch('/api/trigger-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId: savedClassId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger booking')
      }

      // Success! Close dialog and redirect
      setShowBookNowDialog(false)
      setSuccess(true)

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/schedule')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger booking')
    } finally {
      setBookingClass(false)
    }
  }

  const handleSkipBooking = () => {
    setShowBookNowDialog(false)

    if (onSuccess) {
      onSuccess()
    } else {
      router.push('/dashboard/schedule')
      router.refresh()
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'day_of_week' || name === 'booking_window_hours'
        ? parseInt(value, 10) 
        : value,
    }))
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 mb-1">
          Day of Week <span className="text-red-500">*</span>
        </label>
        <select
          id="day_of_week"
          name="day_of_week"
          value={formData.day_of_week}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DAYS_OF_WEEK.map(day => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="class_time" className="block text-sm font-medium text-gray-700 mb-1">
          Class Time <span className="text-red-500">*</span>
        </label>
        <input
          id="class_time"
          name="class_time"
          type="time"
          value={formData.class_time}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          The time when the class starts
        </p>
      </div>

      <div>
        <label htmlFor="class_type" className="block text-sm font-medium text-gray-700 mb-1">
          Class Type <span className="text-red-500">*</span>
        </label>
        <input
          id="class_type"
          name="class_type"
          type="text"
          value={formData.class_type}
          onChange={handleChange}
          required
          placeholder="e.g., BODYPUMP"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          The name or type of the class
        </p>
      </div>

      <div>
        <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
          Branch <span className="text-red-500">*</span>
        </label>
        <input
          id="branch"
          name="branch"
          type="text"
          value={formData.branch}
          onChange={handleChange}
          required
          placeholder="e.g., Downtown YMCA"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          The gym branch where this class is held
        </p>
      </div>

      <div>
        <label htmlFor="booking_window_hours" className="block text-sm font-medium text-gray-700 mb-1">
          Booking Window Hours
        </label>
        <input
          id="booking_window_hours"
          name="booking_window_hours"
          type="number"
          min="1"
          max="168"
          value={formData.booking_window_hours}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Hours before class when registration opens (default: 26)
        </p>
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          value={formData.timezone}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {COMMON_TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Gym/Class location timezone (e.g., Eastern Time for Asheville YMCA). This is the timezone where the class takes place, not your viewing timezone.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          ✅ Class saved successfully!
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (initialClass && !isCopy) ? 'Update Class' : 'Add Class'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/schedule')}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        {initialClass && !isCopy && (
          <div className="text-sm text-gray-500">
            Created: {new Date(initialClass.created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </form>

    {/* Book Now Dialog */}
    {showBookNowDialog && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ⏰ Booking Window Already Open!
          </h3>
          <p className="text-gray-700 mb-6">
            The booking window for this class is already open. Would you like to book this week's class now, or skip it and start automatic booking next week?
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBookNow}
              disabled={bookingClass}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {bookingClass ? 'Booking...' : '✅ Yes, Book Now'}
            </button>
            <button
              onClick={handleSkipBooking}
              disabled={bookingClass}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              No, Skip This Week
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            <strong>Book Now:</strong> Books this week's class immediately.<br />
            <strong>Skip This Week:</strong> Saves the class and automatic booking starts next week.
          </p>
        </div>
      </div>
    )}
    </>
  )
}

