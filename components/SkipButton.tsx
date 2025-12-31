'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setSkipNextOccurrence } from '@/app/actions/recurring-classes'
import {
  calculateNextOccurrence,
  formatDateInGymTimezone,
  getDayName,
  formatTime12Hour,
} from '@/lib/date-utils'
import type { RecurringClass } from '@/lib/database.types'
import { Button, Modal, Badge } from '@/components/ui'

type ClassToBook = {
  id: string
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
}

type Props = {
  recurringClass: RecurringClass
  gymUrl?: string | null
  onUpdate?: () => void
  schedulePaused?: boolean
}

export default function SkipButton({ recurringClass, gymUrl, onUpdate, schedulePaused }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [classToBook, setClassToBook] = useState<ClassToBook | null>(null)
  const [showBookNowDialog, setShowBookNowDialog] = useState(false)
  const [bookingClass, setBookingClass] = useState(false)

  const { skip_next_occurrence, skip_target_datetime, day_of_week, class_time, timezone, active } = recurringClass

  const formatClassDisplay = (classData: ClassToBook): string => {
    const dayName = getDayName(classData.day_of_week)
    const time = formatTime12Hour(classData.class_time)
    return `${classData.class_type} - ${dayName} ${time} @ ${classData.branch}`
  }

  // Determine if skip is active
  // Show skip status if skip_target_datetime exists AND hasn't passed yet
  const isSkipActive = skip_target_datetime && new Date() < new Date(skip_target_datetime)

  // Determine if button should be disabled
  const isDisabled = schedulePaused || !active

  // Get reason for disabled state (for tooltip)
  const getDisabledReason = () => {
    if (schedulePaused) return "Cannot skip while schedule is paused"
    if (!active) return "Cannot skip inactive class"
    return ""
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      // Calculate next occurrence datetime (full Date object with timezone)
      const nextOccurrenceDate = calculateNextOccurrence(day_of_week, class_time, timezone)

      console.log('Setting skip for next occurrence:', {
        day_of_week,
        class_time,
        timezone,
        nextOccurrenceDate: nextOccurrenceDate.toISOString(),
      })

      const result = await setSkipNextOccurrence(recurringClass.id, nextOccurrenceDate.toISOString())

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
    setLoading(true)
    try {
      const result = await setSkipNextOccurrence(recurringClass.id, null)

      if (result.success) {
        // Check if booking window is already open (unskip scenario)
        if (result.bookingWindowAlreadyOpen && result.classDetails) {
          setClassToBook({ id: recurringClass.id, ...result.classDetails })
          setShowBookNowDialog(true)
          setLoading(false)
        } else {
          // No dialog needed, just refresh
          if (onUpdate) {
            onUpdate()
          } else {
            router.refresh()
          }
          setLoading(false)
        }
      } else {
        alert(`Failed to clear skip: ${result.error}`)
        setLoading(false)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const handleBookNow = async () => {
    if (!classToBook) return

    setBookingClass(true)
    try {
      const response = await fetch('/api/trigger-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classToBook.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger booking')
      }

      // Success - close dialog and refresh
      setShowBookNowDialog(false)
      setClassToBook(null)
      setBookingClass(false)
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to book class')
      setBookingClass(false)
    }
  }

  const handleSkipBooking = () => {
    setShowBookNowDialog(false)
    setClassToBook(null)
    if (onUpdate) {
      onUpdate()
    } else {
      router.refresh()
    }
  }

  // State 1: No skip active (default)
  if (!isSkipActive) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={loading || isDisabled}
          loading={loading}
          title={isDisabled ? getDisabledReason() : ''}
        >
          Skip Next
        </Button>

        {/* Book Now Dialog - Single class */}
        <Modal
          isOpen={showBookNowDialog && !!classToBook}
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
            Booking window is open for <strong>{classToBook && formatClassDisplay(classToBook)}</strong>. Would you like to book now?
          </p>
          <p className="mt-4 text-sm text-gray-500">
            <strong>Book Now:</strong> Books this week&apos;s class immediately.<br />
            <strong>Skip This Week:</strong> Class won&apos;t be booked this week, automatic booking resumes next week.
          </p>
        </Modal>
      </>
    )
  }

  // State 2: Skip active (show until class time passes)
  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="info" size="sm" className="flex items-center gap-2">
          <span>Skipping {formatDateInGymTimezone(new Date(skip_target_datetime!), timezone, 'short')}</span>
          <button
            onClick={handleUnskip}
            disabled={loading || isDisabled}
            className="text-white hover:text-gray-100 font-bold disabled:opacity-50 disabled:cursor-not-allowed ml-1"
            title={isDisabled ? getDisabledReason() : "Cancel skip"}
          >
            ×
          </button>
        </Badge>
      </div>

      {/* Book Now Dialog - Single class */}
      <Modal
        isOpen={showBookNowDialog && !!classToBook}
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
          Booking window is open for <strong>{classToBook && formatClassDisplay(classToBook)}</strong>. Would you like to book now?
        </p>
        <p className="mt-4 text-sm text-gray-500">
          <strong>Book Now:</strong> Books this week&apos;s class immediately.<br />
          <strong>Skip This Week:</strong> Class won&apos;t be booked this week, automatic booking resumes next week.
        </p>
      </Modal>
    </>
  )
}

