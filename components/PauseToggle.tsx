'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateSchedulePaused } from '@/app/actions/user-settings'
import { formatTime12Hour } from '@/lib/date-utils'
import { Button, Modal, Badge } from '@/components/ui'

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
          className="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
        />
        <span className="text-sm font-medium text-gray-700 font-dm-sans">
          Pause all bookings
        </span>
      </label>

      {paused && (
        <Badge variant="warning" size="sm">Paused</Badge>
      )}

      {error && (
        <span className="text-xs text-danger-600 font-dm-sans">{error}</span>
      )}

      {/* Book Now Dialog - Sequential for multiple classes */}
      <Modal
        isOpen={showBookNowDialog && !!classesWithOpenWindows[currentDialogIndex]}
        onClose={handleSkipBooking}
        title="Booking Window Already Open!"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={handleSkipBooking}
              disabled={bookingClass}
            >
              No, Skip This Week
            </Button>
            <Button
              variant="success"
              onClick={handleBookNow}
              loading={bookingClass}
            >
              Yes, Book Now
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Booking window is open for <strong>{classesWithOpenWindows[currentDialogIndex] && formatClassDisplay(classesWithOpenWindows[currentDialogIndex])}</strong>. Would you like to book now?
        </p>
        {classesWithOpenWindows.length > 1 && (
          <p className="text-sm text-gray-500 mt-2">
            Class {currentDialogIndex + 1} of {classesWithOpenWindows.length}
          </p>
        )}
        <p className="mt-4 text-sm text-gray-500">
          <strong>Book Now:</strong> Books this week&apos;s class immediately.<br />
          <strong>Skip This Week:</strong> Class won&apos;t be booked this week, automatic booking resumes next week.
        </p>
      </Modal>
    </div>
  )
}

