'use client'

/**
 * FirstBookingPreview — live inline card rendered inside RecurringClassForm
 * so users see when the first auto-booking will fire BEFORE they commit.
 *
 * Two render states (VOICE.md Working-on-it tier):
 *
 *   Pre-window (common):
 *     Registration opens
 *     Sun Apr 27 · 2:15 PM
 *     We click Reserve the second it opens.
 *
 *   Window already open (edge case — user is configuring a class whose
 *   booking window has already started):
 *     Booking now
 *     Registration's already open.
 *     After saving, you'll choose whether to book this one now or skip.
 *
 * Returns null (renders nothing) when the required form inputs aren't
 * valid/complete yet — parents don't have to gate the render themselves.
 *
 * Design decisions finalized in /admin/form-preview (task 4 owner review).
 */

import { useEffect, useState } from 'react'
import { calculateNextOccurrence } from '@/lib/date-utils'
import { formatInTimeZone } from 'date-fns-tz'

type Inputs = {
  dayOfWeek: number
  classTime: string // 'HH:MM' or 'HH:MM:SS'
  bookingWindowHours: number
  timezone: string
}

export type FirstBookingInfo =
  | { kind: 'pre-window'; formatted: string }
  | { kind: 'window-open' }

/**
 * Pure helper — computes the preview state from form values without
 * rendering. Exported so the RecurringClassForm success alert can show
 * the same formatted datetime as the preview card ("closes the loop"
 * from the variant review). Returns null for incomplete/invalid inputs.
 */
export function computeFirstBookingInfo(inputs: Inputs): FirstBookingInfo | null {
  const { dayOfWeek, classTime, bookingWindowHours, timezone } = inputs
  if (!classTime || !timezone) return null
  if (!Number.isFinite(bookingWindowHours) || bookingWindowHours <= 0) return null
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return null

  // calculateNextOccurrence expects HH:MM — trim seconds if present.
  const normalizedTime = classTime.substring(0, 5)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(normalizedTime)) return null

  let nextOccurrence: Date
  try {
    nextOccurrence = calculateNextOccurrence(dayOfWeek, normalizedTime, timezone)
  } catch {
    return null
  }

  const bookingOpensAt = new Date(
    nextOccurrence.getTime() - bookingWindowHours * 60 * 60 * 1000
  )

  if (bookingOpensAt.getTime() <= Date.now()) {
    return { kind: 'window-open' }
  }

  // "Sun Apr 27 · 2:15 PM" in the gym's own timezone so the user sees the
  // time that matches the YMCA's registration page, not their local zone.
  const formatted = formatInTimeZone(bookingOpensAt, timezone, 'EEE MMM d · h:mm a')
  return { kind: 'pre-window', formatted }
}

export default function FirstBookingPreview(inputs: Inputs) {
  // Defer computation to a client-only effect so this component renders
  // nothing during SSR. `computeFirstBookingInfo` reads `Date.now()` and
  // `calculateNextOccurrence` calls `new Date()` internally — both are
  // non-deterministic across the server→client hydration boundary and
  // can produce different output milliseconds apart (e.g. if a booking
  // window opens between server render and client mount, server picks
  // the pre-window branch while client picks window-open). That mismatch
  // surfaces as React error #418 in production.
  //
  // The tradeoff is a one-frame flash where the preview card doesn't
  // exist before the effect fires. Acceptable for a form-building
  // surface; no visible content disappears, just appears.
  const [info, setInfo] = useState<FirstBookingInfo | null>(null)

  useEffect(() => {
    setInfo(computeFirstBookingInfo(inputs))
  }, [inputs.dayOfWeek, inputs.classTime, inputs.bookingWindowHours, inputs.timezone])

  if (!info) return null

  if (info.kind === 'window-open') {
    return (
      <div className="bg-gray-50 border-l-4 border-l-primary-500 rounded-lg p-4">
        <p className="font-dm-sans text-xs uppercase tracking-wider text-primary-600 font-semibold mb-2">
          Booking now
        </p>
        <p className="font-sora font-bold text-gray-900">
          Registration&apos;s already open.
        </p>
        <p className="font-dm-sans text-sm text-gray-600 mt-1">
          After saving, you&apos;ll choose whether to book this one now or skip.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border-l-4 border-l-primary-500 rounded-lg p-4">
      <p className="font-dm-sans text-xs uppercase tracking-wider text-primary-600 font-semibold mb-2">
        Class registration opens
      </p>
      <p className="font-sora font-bold text-gray-900">{info.formatted}</p>
      <p className="font-dm-sans text-sm text-gray-600 mt-1">
        We click Reserve the second it opens.
      </p>
    </div>
  )
}
