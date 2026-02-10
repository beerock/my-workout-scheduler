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
  variant?: 'default' | 'gradient' | 'menu-item'
}

export default function SkipButton({ recurringClass, gymUrl, onUpdate, schedulePaused, variant = 'default' }: Props) {
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

  // Render the button based on variant
  const renderSkipButton = () => {
    if (variant === 'gradient') {
      return (
        <button
          onClick={handleSkip}
          disabled={loading || isDisabled}
          title={isDisabled ? getDisabledReason() : ''}
          className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)' }}
        >
          {loading ? 'Skipping...' : 'Skip Next'}
        </button>
      )
    }

    if (variant === 'menu-item') {
      return (
        <button
          onClick={handleSkip}
          disabled={loading || isDisabled}
          title={isDisabled ? getDisabledReason() : ''}
          className={`w-full px-4 py-3 text-left font-dm-sans transition-colors flex items-center gap-3 ${
            isDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-50 hover:text-primary-500'
          }`}
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          {loading ? 'Skipping...' : 'Skip Next'}
        </button>
      )
    }

    // Default variant - uses Button component
    return (
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
    )
  }

  // Render the unskip state based on variant
  const renderUnskipButton = () => {
    if (variant === 'gradient') {
      return (
        <button
          onClick={handleUnskip}
          disabled={loading || isDisabled}
          title={isDisabled ? getDisabledReason() : 'Cancel skip'}
          className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)' }}
        >
          {loading ? 'Cancelling...' : (
            <>
              Skipping
              <span className="font-bold">×</span>
            </>
          )}
        </button>
      )
    }

    if (variant === 'menu-item') {
      return (
        <button
          onClick={handleUnskip}
          disabled={loading || isDisabled}
          title={isDisabled ? getDisabledReason() : 'Cancel skip'}
          className={`w-full px-4 py-3 text-left font-dm-sans transition-colors flex items-center gap-3 ${
            isDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-amber-600 hover:bg-amber-50'
          }`}
        >
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {loading ? 'Cancelling...' : 'Cancel Skip'}
        </button>
      )
    }

    // Default variant - uses Badge with cancel button
    return (
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
    )
  }

  // State 1: No skip active (default)
  if (!isSkipActive) {
    return (
      <>
        {renderSkipButton()}

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
      {renderUnskipButton()}

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
