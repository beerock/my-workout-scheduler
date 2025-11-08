'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setNextSkipDate } from '@/app/actions/recurring-classes'
import {
  calculateNextOccurrence,
  isDateInFuture,
  isDateInPast,
  isDateToday,
  formatDate,
  formatDateShort,
  calculateBookingWindowOpen,
  hasBookingWindowOpened,
  hasClassPassed,
} from '@/lib/date-utils'
import type { RecurringClass } from '@/lib/database.types'

type Props = {
  recurringClass: RecurringClass
  gymUrl?: string | null
  onUpdate?: () => void
}

export default function SkipButton({ recurringClass, gymUrl, onUpdate }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningData, setWarningData] = useState<{
    classDate: string
    bookingWindowOpen: Date
  } | null>(null)

  const { next_skip_date, day_of_week, class_time, booking_window_hours, timezone } = recurringClass

  // Determine current state
  const skipDate = next_skip_date
  // A skip is scheduled if the date exists and is today or in the future
  const isSkipScheduled = skipDate && (isDateInFuture(skipDate) || isDateToday(skipDate))
  const isSkipPast = skipDate && isDateInPast(skipDate) && !isDateToday(skipDate)

  const handleSkip = async () => {
    setLoading(true)
    try {
      const nextOccurrence = calculateNextOccurrence(day_of_week, timezone)
      // Debug: log the calculated date
      console.log('Calculating skip date:', {
        day_of_week,
        timezone,
        nextOccurrence,
        currentDate: new Date().toLocaleDateString(),
      })
      const result = await setNextSkipDate(recurringClass.id, nextOccurrence)

      if (result.success) {
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        alert(`Failed to set skip: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnskip = async () => {
    // Check which scenario we're in
    if (!skipDate) return

    const bookingWindowOpen = calculateBookingWindowOpen(
      skipDate,
      class_time,
      booking_window_hours,
      timezone
    )
    const now = new Date()
    const bookingWindowHasOpened = hasBookingWindowOpened(
      skipDate,
      class_time,
      booking_window_hours,
      timezone
    )
    const classHasPassed = hasClassPassed(skipDate, class_time, timezone)

    // Scenario A: Before booking window opens
    if (!bookingWindowHasOpened && !classHasPassed) {
      await clearSkip()
      return
    }

    // Scenario B: During booking window (CRITICAL)
    if (bookingWindowHasOpened && !classHasPassed) {
      setWarningData({
        classDate: skipDate,
        bookingWindowOpen,
      })
      setShowWarningModal(true)
      return
    }

    // Scenario C: After class passed
    if (classHasPassed) {
      await clearSkip()
      return
    }
  }

  const clearSkip = async () => {
    setLoading(true)
    try {
      const result = await setNextSkipDate(recurringClass.id, null)

      if (result.success) {
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        alert(`Failed to clear skip: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClearSkipAnyway = async () => {
    setShowWarningModal(false)
    await clearSkip()
  }

  const handleBookOnGymSite = () => {
    if (gymUrl) {
      window.open(gymUrl, '_blank')
    }
    setShowWarningModal(false)
  }

  // State 1: Available (No skip scheduled)
  if (!skipDate || isSkipPast) {
    return (
      <>
        <button
          onClick={handleSkip}
          disabled={loading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting...' : 'Skip Next'}
        </button>
      </>
    )
  }

  // State 2: Skip Scheduled
  if (isSkipScheduled) {
    return (
      <>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded flex items-center gap-2">
            <span>📅 Skipping {formatDateShort(skipDate)}</span>
            <button
              onClick={handleUnskip}
              disabled={loading}
              className="text-blue-800 hover:text-blue-900 font-bold"
              title="Cancel skip"
            >
              ×
            </button>
          </span>
        </div>

        {/* Warning Modal */}
        {showWarningModal && warningData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Window Already Opened
              </h3>
              <p className="text-gray-700 mb-4">
                Registration for <strong>{formatDate(warningData.classDate)}</strong> opened at{' '}
                <strong>
                  {warningData.bookingWindowOpen.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </strong>
                .
              </p>
              <p className="text-gray-700 mb-6">
                You can book manually at the gym website, or this will auto-book next week.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                {gymUrl && (
                  <button
                    onClick={handleBookOnGymSite}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Book on Gym Site
                  </button>
                )}
                <button
                  onClick={handleClearSkipAnyway}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Clearing...' : 'Clear Skip Anyway'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Should not reach here, but fallback
  return null
}

