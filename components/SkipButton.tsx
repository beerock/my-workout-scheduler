'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setSkipNextOccurrence } from '@/app/actions/recurring-classes'
import {
  calculateNextOccurrence,
  formatDateInGymTimezone,
} from '@/lib/date-utils'
import { isSkipCurrentlyActive } from '@/lib/skip-utils'
import type { RecurringClass } from '@/lib/database.types'
import { Button, Badge } from '@/components/ui'
import { useBookNowDialog } from '@/hooks/useBookNowDialog'
import BookNowDialog from './BookNowDialog'

type Props = {
  recurringClass: RecurringClass
  onUpdate?: () => void
  schedulePaused?: boolean
  variant?: 'default' | 'gradient' | 'menu-item'
}

export default function SkipButton({ recurringClass, onUpdate, schedulePaused, variant = 'default' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const bookNow = useBookNowDialog({
    onComplete: onUpdate || (() => router.refresh()),
  })

  const { skip_target_datetime, day_of_week, class_time, timezone, active } = recurringClass

  // Single source of truth across SkipButton, ScheduleList banner, and
  // getStatusBadge — see lib/skip-utils.ts for why both flag + datetime.
  const isSkipActive = isSkipCurrentlyActive(recurringClass)

  // Determine if button should be disabled
  const isDisabled = schedulePaused || !active

  const getDisabledReason = () => {
    if (schedulePaused) return "Cannot skip while schedule is paused"
    if (!active) return "Cannot skip inactive class"
    return ""
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      const nextOccurrenceDate = calculateNextOccurrence(day_of_week, class_time, timezone)

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
        if (result.bookingWindowAlreadyOpen && result.classDetails) {
          bookNow.openDialog({ id: recurringClass.id, ...result.classDetails })
          setLoading(false)
        } else {
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

  return (
    <>
      {isSkipActive ? renderUnskipButton() : renderSkipButton()}

      <BookNowDialog
        classToBook={bookNow.classToBook}
        isOpen={bookNow.showDialog}
        booking={bookNow.booking}
        onBookNow={bookNow.handleBookNow}
        onSkip={bookNow.handleSkipBooking}
      />
    </>
  )
}
