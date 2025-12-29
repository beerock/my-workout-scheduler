'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateSchedulePaused, getUserSettings } from '@/app/actions/user-settings'
import { formatTime12Hour } from '@/lib/date-utils'

type ClassWithOpenWindow = {
  id: string
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
}

type Props = {
  initialPaused?: boolean
  onUpdate?: () => void
}

export default function PauseToggle({ initialPaused, onUpdate }: Props) {
  const router = useRouter()
  const [paused, setPaused] = useState(initialPaused ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classesWithOpenWindows, setClassesWithOpenWindows] = useState<ClassWithOpenWindow[]>([])
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0)
  const [showBookNowDialog, setShowBookNowDialog] = useState(false)
  const [bookingClass, setBookingClass] = useState(false)

  useEffect(() => {
    setPaused(initialPaused ?? false)
  }, [initialPaused])

  const formatClassDisplay = (classData: ClassWithOpenWindow): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[classData.day_of_week]
    const time = formatTime12Hour(classData.class_time)
    return `${classData.class_type} - ${dayName} ${time} @ ${classData.branch}`
  }

  const handleToggle = async () => {
    const newPaused = !paused
    setLoading(true)
    setError(null)

    try {
      const result = await updateSchedulePaused(newPaused)

      if (result.success) {
        setPaused(newPaused)

        // Check for classes with open booking windows (unpause scenario)
        if (result.classesWithOpenWindows && result.classesWithOpenWindows.length > 0) {
          setClassesWithOpenWindows(result.classesWithOpenWindows)
          setCurrentDialogIndex(0)
          setShowBookNowDialog(true)
        } else {
          // No dialogs needed, just refresh
          if (onUpdate) {
            onUpdate()
          } else {
            router.refresh()
          }
        }
      } else {
        setError(result.error || 'Failed to update pause status')
        // Revert on error
        setPaused(paused)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      // Revert on error
      setPaused(paused)
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = async () => {
    if (!classesWithOpenWindows[currentDialogIndex]) return

    setBookingClass(true)
    try {
      const response = await fetch('/api/trigger-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classesWithOpenWindows[currentDialogIndex].id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger booking')
      }

      // Move to next dialog or close
      if (currentDialogIndex < classesWithOpenWindows.length - 1) {
        setCurrentDialogIndex(currentDialogIndex + 1)
        setBookingClass(false)
      } else {
        // All done
        setShowBookNowDialog(false)
        setClassesWithOpenWindows([])
        setBookingClass(false)
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book class')
      setBookingClass(false)
    }
  }

  const handleSkipBooking = () => {
    // Move to next dialog or close
    if (currentDialogIndex < classesWithOpenWindows.length - 1) {
      setCurrentDialogIndex(currentDialogIndex + 1)
    } else {
      // All done
      setShowBookNowDialog(false)
      setClassesWithOpenWindows([])
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id="pause-all-bookings"
          name="pause-all-bookings"
          checked={paused}
          onChange={handleToggle}
          disabled={loading}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <span className="text-sm font-medium text-gray-700">
          Pause all bookings
        </span>
      </label>
      
      {paused && (
        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
          ⚠️ Paused
        </span>
      )}

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}

      {/* Book Now Dialog - Sequential for multiple classes */}
      {showBookNowDialog && classesWithOpenWindows[currentDialogIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ⏰ Booking Window Already Open!
            </h3>
            <p className="text-gray-700 mb-4">
              Booking window is open for <strong>{formatClassDisplay(classesWithOpenWindows[currentDialogIndex])}</strong>. Would you like to book now?
            </p>
            {classesWithOpenWindows.length > 1 && (
              <p className="text-sm text-gray-500 mb-4">
                Class {currentDialogIndex + 1} of {classesWithOpenWindows.length}
              </p>
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
              <strong>Skip This Week:</strong> Class won't be booked this week, automatic booking resumes next week.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

