'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setSkipNextOccurrence } from '@/app/actions/recurring-classes'
import {
  calculateNextOccurrence,
  formatDateInGymTimezone,
} from '@/lib/date-utils'
import type { RecurringClass } from '@/lib/database.types'

type Props = {
  recurringClass: RecurringClass
  gymUrl?: string | null
  onUpdate?: () => void
  schedulePaused?: boolean
}

export default function SkipButton({ recurringClass, gymUrl, onUpdate, schedulePaused }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { skip_next_occurrence, skip_target_datetime, day_of_week, class_time, timezone, active } = recurringClass

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

  // State 1: No skip active (default)
  if (!isSkipActive) {
    return (
      <button
        onClick={handleSkip}
        disabled={loading || isDisabled}
        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isDisabled ? getDisabledReason() : ''}
      >
        {loading ? 'Setting...' : 'Skip Next'}
      </button>
    )
  }

  // State 2: Skip active (show until class time passes)
  return (
    <div className="flex items-center gap-2">
      <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded flex items-center gap-2">
        <span>📅 Skipping {formatDateInGymTimezone(new Date(skip_target_datetime!), timezone, 'short')}</span>
        <button
          onClick={handleUnskip}
          disabled={loading || isDisabled}
          className="text-blue-800 hover:text-blue-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          title={isDisabled ? getDisabledReason() : "Cancel skip"}
        >
          ×
        </button>
      </span>
    </div>
  )
}

