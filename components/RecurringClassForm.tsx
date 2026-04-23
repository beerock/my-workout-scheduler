'use client'

import { useState, useEffect, useCallback } from 'react'
import { saveRecurringClass, type RecurringClassFormData } from '@/app/actions/recurring-classes'
import { useRouter } from 'next/navigation'
import { formatDateInGymTimezone } from '@/lib/date-utils'
import type { RecurringClass } from '@/lib/database.types'
import { Button, Modal, Input, Select, Alert, TimeInput, Combobox } from '@/components/ui'
import BookNowDialog from '@/components/BookNowDialog'
import FirstBookingPreview, { computeFirstBookingInfo } from '@/components/FirstBookingPreview'
import type { ClassToBook } from '@/hooks/useBookNowDialog'
import { YMCA_BRANCHES, YMCA_MASTER_CLASSES, fuzzyMatchClasses } from '@/lib/constants/ymca'
import type { ComboboxOption } from '@/components/ui'

// All active YMCA WNC classes run in Eastern time. The form hides the
// timezone field and locks this value so users don't have to think about
// timezones — the Time field's "Eastern" suffix communicates the zone.
const GYM_TIMEZONE = 'America/New_York'

// Module-level constants (derived from static data, never change)
const classOptions: ComboboxOption[] = YMCA_MASTER_CLASSES.map(c => ({
  value: c.display,
  label: c.display,
}))

const branchOptions = YMCA_BRANCHES.map(branch => ({
  value: branch,
  label: branch,
}))

type Props = {
  initialClass?: RecurringClass | null
  isCopy?: boolean // Indicates if this is a copy operation
  defaultBranch?: string | null
  onSuccess?: () => void
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

export default function RecurringClassForm({ initialClass, isCopy = false, defaultBranch, onSuccess }: Props) {
  const router = useRouter()
  // Form reset key - increment to reset Input/Select component state after success
  const [formKey, setFormKey] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showBookNowDialog, setShowBookNowDialog] = useState(false)
  const [savedClassId, setSavedClassId] = useState<string | null>(null)
  const [bookingClass, setBookingClass] = useState(false)
  const [showSkipClearDialog, setShowSkipClearDialog] = useState(false)
  const [skipClearData, setSkipClearData] = useState<{
    skipDate: string | null
    formData: RecurringClassFormData
    classId: string
  } | null>(null)
  const [showDeactivatedDialog, setShowDeactivatedDialog] = useState(false)
  const [deactivatedDialogData, setDeactivatedDialogData] = useState<{
    formData: RecurringClassFormData
    classId: string
  } | null>(null)
  const [savedClassDetails, setSavedClassDetails] = useState<{
    class_type: string
    day_of_week: number
    class_time: string
    branch: string
  } | null>(null)
  const [isCustomClass, setIsCustomClass] = useState(false)
  const [savedIsCustomClass, setSavedIsCustomClass] = useState(false)
  const [formData, setFormData] = useState<RecurringClassFormData>({
    day_of_week: initialClass?.day_of_week ?? 1,
    class_time: initialClass?.class_time ? initialClass.class_time.substring(0, 5) : '',
    class_type: initialClass?.class_type || '',
    branch: initialClass?.branch || defaultBranch || '',
    booking_window_hours: initialClass?.booking_window_hours ?? 26,
    timezone: initialClass?.timezone || GYM_TIMEZONE,
  })

  const getClassToBookForDialog = (): ClassToBook | null => {
    if (!savedClassId) return null
    const source = savedClassDetails || formData
    return {
      id: savedClassId,
      class_type: source.class_type,
      day_of_week: source.day_of_week,
      class_time: source.class_time,
      branch: source.branch,
    }
  }

  // Update form when initialClass changes
  useEffect(() => {
    if (initialClass) {
      setFormData({
        day_of_week: initialClass.day_of_week,
        class_time: initialClass.class_time.substring(0, 5), // Extract HH:MM from TIME format
        class_type: initialClass.class_type,
        branch: initialClass.branch,
        booking_window_hours: initialClass.booking_window_hours,
        timezone: initialClass.timezone || GYM_TIMEZONE,
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

      // Detect custom class: either explicitly marked custom via Combobox,
      // or typed value doesn't match any class in the master list
      const isCustom = isCustomClass || !YMCA_MASTER_CLASSES.some(
        (c) => c.display.toLowerCase() === formData.class_type.toLowerCase()
      )

      const result = await saveRecurringClass(
        {
          ...formData,
          class_time: timeWithSeconds,
          isCustomClassName: isCustom,
        },
        (initialClass && !isCopy) ? initialClass.id : undefined
      )

      // Check for skip clear warning FIRST (before other checks)
      if (result.skipClearWarning) {
        setSkipClearData({
          skipDate: result.skipDate || null,
          formData: {
            ...formData,
            class_time: timeWithSeconds,
          },
          classId: (initialClass && !isCopy) ? initialClass.id : ''
        })
        setShowSkipClearDialog(true)
        setLoading(false)
        return
      }

      // Check for deactivated class warning (before booking window check)
      if (result.deactivatedWarning) {
        setDeactivatedDialogData({
          formData: {
            ...formData,
            class_time: timeWithSeconds,
          },
          classId: (initialClass && !isCopy) ? initialClass.id : ''
        })
        setShowDeactivatedDialog(true)
        setLoading(false)
        return
      }

      if (result.success) {
        setSuccess(true)
        setSavedIsCustomClass(!!result.isCustomClassName)
        setFormKey(k => k + 1) // Reset form to clear touched state

        // Check if booking window is already open (server-side check)
        if (result.bookingWindowAlreadyOpen && result.id) {
          // Booking window is open - show dialog asking if user wants to book now
          setSavedClassId(result.id)
          setSavedClassDetails(result.classDetails || null)
          setShowBookNowDialog(true)
        } else {
          // Booking window not open - delay redirect so user sees success state.
          // Bumped from 1500ms → 3000ms because the success alert now carries
          // a specific datetime ("First booking fires Sun Apr 27 · 2:15 PM")
          // that users want a moment to register before the redirect fires.
          setTimeout(() => {
            if (onSuccess) {
              onSuccess()
            } else {
              router.push('/dashboard/schedule')
              router.refresh()
            }
          }, 3000)
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
      setSavedClassDetails(null)
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
    setSavedClassDetails(null)

    if (onSuccess) {
      onSuccess()
    } else {
      router.push('/dashboard/schedule')
      router.refresh()
    }
  }

  const handleConfirmSkipClear = async () => {
    if (!skipClearData) return

    setLoading(true)
    setError(null)

    try {
      // Call saveRecurringClass again with confirmation flag
      const result = await saveRecurringClass(
        skipClearData.formData,
        skipClearData.classId,
        true // confirmSkipClear
      )

      // Check for deactivated warning (class was inactive AND had skip)
      if (result.deactivatedWarning) {
        // Close skip dialog, show deactivated dialog
        setShowSkipClearDialog(false)
        setSkipClearData(null)
        setDeactivatedDialogData({
          formData: skipClearData.formData,
          classId: skipClearData.classId
        })
        setShowDeactivatedDialog(true)
        setLoading(false)
        return
      }

      if (!result.success) {
        setError(result.error || 'Failed to save class')
        setLoading(false)
        return
      }

      // NOW check for booking window (may happen after clearing skip)
      if (result.bookingWindowAlreadyOpen && result.id) {
        // Close skip dialog, show booking window dialog
        setShowSkipClearDialog(false)
        setSkipClearData(null)
        setSavedClassId(result.id)
        setSavedClassDetails(result.classDetails || null)
        setShowBookNowDialog(true)
        setLoading(false)
        return
      }

      // Success, close modal and navigate
      setShowSkipClearDialog(false)
      setSkipClearData(null)
      setSuccess(true)

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/schedule')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSkipClear = () => {
    setShowSkipClearDialog(false)
    setSkipClearData(null)
    setLoading(false)
  }

  const handleActivateChoice = async (choice: 'activate' | 'keep_deactivated') => {
    if (!deactivatedDialogData) return

    setLoading(true)
    setError(null)

    try {
      // Call saveRecurringClass again with the user's choice
      // Always pass confirmSkipClear: true because if we're at this dialog,
      // any skip clear has already been confirmed (or there was no skip)
      const result = await saveRecurringClass(
        deactivatedDialogData.formData,
        deactivatedDialogData.classId,
        true, // confirmSkipClear - skip was already confirmed if needed
        choice // activateChoice
      )

      if (!result.success) {
        setError(result.error || 'Failed to save class')
        setLoading(false)
        return
      }

      // Check for booking window (may happen after activating)
      if (result.bookingWindowAlreadyOpen && result.id) {
        // Close deactivated dialog, show booking window dialog
        setShowDeactivatedDialog(false)
        setDeactivatedDialogData(null)
        setSavedClassId(result.id)
        setSavedClassDetails(result.classDetails || null)
        setShowBookNowDialog(true)
        setLoading(false)
        return
      }

      // Success, close modal and navigate
      setShowDeactivatedDialog(false)
      setDeactivatedDialogData(null)
      setSuccess(true)

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/schedule')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDeactivatedDialog = () => {
    setShowDeactivatedDialog(false)
    setDeactivatedDialogData(null)
    setLoading(false)
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

  // Fuzzy filter for Combobox - memoized to avoid invalidating Combobox internals
  const filterClasses = useCallback((_query: string, _options: ComboboxOption[]): ComboboxOption[] => {
    return fuzzyMatchClasses(_query).map(m => ({ value: m.display, label: m.display }))
  }, [])

  // Compute the first-booking preview info from current form values.
  // Used both for the inline preview card AND for the success alert so
  // the confirmation message matches what the user saw before saving.
  const firstBookingInfo = computeFirstBookingInfo({
    dayOfWeek: formData.day_of_week,
    classTime: formData.class_time,
    bookingWindowHours: formData.booking_window_hours,
    timezone: formData.timezone,
  })

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 — What class (identity fields) */}
        <div className="space-y-4">
          <h3 className="font-sora text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2">
            What class
          </h3>

          <Combobox
            key={`class_type-${formKey}`}
            label="Class Name"
            name="class_type"
            value={formData.class_type}
            onChange={(value, custom) => {
              setFormData(prev => ({ ...prev, class_type: value }))
              setIsCustomClass(custom)
            }}
            options={classOptions}
            filterFn={filterClasses}
            placeholder="Search classes..."
            allowCustom
            customLabel="Add custom class"
            required
          />

          {/* Branch uses the Combobox in fixed-list mode (searchable={false})
              so long branch names ("Hendersonville Family YMCA") truncate
              gracefully at 320px instead of overflowing. Native <select> text
              doesn't ellipsize reliably; the Combobox's custom dropdown does. */}
          <Combobox
            key={`branch-${formKey}`}
            label="Branch"
            name="branch"
            value={formData.branch}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, branch: value }))
            }
            options={branchOptions}
            placeholder="Select a branch"
            searchable={false}
            required
          />
        </div>

        {/* Section 2 — When (schedule + booking window, all time-related).
            Timezone Select is intentionally NOT rendered — all YMCA WNC
            classes run in Eastern time and the Time field's "(Eastern)"
            suffix communicates this. The timezone value stays in formData
            at GYM_TIMEZONE. */}
        <div className="space-y-4">
          <h3 className="font-sora text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2">
            When
          </h3>

          <Select
            key={`day_of_week-${formKey}`}
            label="Day"
            name="day_of_week"
            value={formData.day_of_week.toString()}
            onChange={handleChange}
            options={DAYS_OF_WEEK}
          />

          <TimeInput
            key={`class_time-${formKey}`}
            label="Time (Eastern)"
            name="class_time"
            value={formData.class_time}
            onChange={(value) => setFormData(prev => ({ ...prev, class_time: value }))}
            required
          />

          {/* Custom-rendered field because the "hours before class" unit
              reads much better inline next to the value than buried in a
              hint below. Matches the visual system of the shared Input
              component (focus ring, border states, label + hint typography)
              but tightens the input width and surfaces the unit. */}
          <div>
            <label
              htmlFor="booking_window_hours"
              className="block font-dm-sans text-sm font-medium text-gray-700 mb-2"
            >
              Registration Opens
            </label>
            <div className="flex items-center gap-3">
              <input
                key={`booking_window_hours-${formKey}`}
                id="booking_window_hours"
                name="booking_window_hours"
                type="number"
                min={1}
                max={168}
                value={formData.booking_window_hours}
                onChange={handleChange}
                required
                className="w-24 px-4 py-3 font-dm-sans text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                aria-describedby="booking_window_hours-hint"
              />
              <span className="font-dm-sans text-sm text-gray-700">
                hours before class
              </span>
            </div>
            <p
              id="booking_window_hours-hint"
              className="mt-2 font-dm-sans text-sm text-gray-500"
            >
              Most are 26 — double-check the class page on the YMCA site if yours is different.
            </p>
          </div>
        </div>

        {/* Inline first-booking preview. Renders null until required
            fields are valid (class_type + branch + day + time + window).
            Extra gate here skips the preview while class_type/branch are
            empty since they're required for saving but not for the math. */}
        {formData.class_type && formData.branch && (
          <FirstBookingPreview
            dayOfWeek={formData.day_of_week}
            classTime={formData.class_time}
            bookingWindowHours={formData.booking_window_hours}
            timezone={formData.timezone}
          />
        )}

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {success && (
          <Alert variant="success">
            {savedIsCustomClass
              ? "Saved — we'll verify your custom class name against the YMCA schedule and let you know if anything needs tweaking."
              : firstBookingInfo?.kind === 'pre-window'
                ? `Saved. First booking fires ${firstBookingInfo.formatted}.`
                : 'Saved. The next registration window starts booking automatically.'}
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {(initialClass && !isCopy) ? 'Update Class' : 'Add Class'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/dashboard/schedule')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          {initialClass && !isCopy && (
            <p className="text-sm text-gray-500 font-dm-sans">
              Created: {new Date(initialClass.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </form>

      <BookNowDialog
        classToBook={getClassToBookForDialog()}
        isOpen={showBookNowDialog}
        booking={bookingClass}
        onBookNow={handleBookNow}
        onSkip={handleSkipBooking}
      >
        {error && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
            {error}
          </div>
        )}
      </BookNowDialog>

      {/* Skip Clear Confirmation Dialog */}
      <Modal
        isOpen={showSkipClearDialog && !!skipClearData}
        onClose={handleCancelSkipClear}
        title="Clear Skip Confirmation"
        size="md"
        variant="danger"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={handleCancelSkipClear}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmSkipClear}
              loading={loading}
            >
              Continue
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Changing the class schedule will clear your skip for{' '}
          <strong>
            {skipClearData?.skipDate
              ? formatDateInGymTimezone(
                  new Date(skipClearData.skipDate),
                  skipClearData.formData.timezone,
                  'short'
                )
              : 'this week'}
          </strong>. Do you want to continue?
        </p>

        {error && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
            {error}
          </div>
        )}
      </Modal>

      {/* Deactivated Class Confirmation Dialog */}
      <Modal
        isOpen={showDeactivatedDialog && !!deactivatedDialogData}
        onClose={handleCancelDeactivatedDialog}
        title="This Class is Deactivated"
        size="md"
        variant="default"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => handleActivateChoice('keep_deactivated')}
              disabled={loading}
            >
              Keep Deactivated
            </Button>
            <Button
              variant="success"
              onClick={() => handleActivateChoice('activate')}
              loading={loading}
            >
              Activate
            </Button>
          </>
        }
      >
        <p className="text-gray-700 mb-4">
          You&apos;re editing a class that&apos;s currently deactivated. Would you like to activate it?
        </p>
        <ul className="text-sm text-gray-600 space-y-2">
          <li><strong>Activate:</strong> Auto-booking will resume</li>
          <li><strong>Keep Deactivated:</strong> Your changes save, but no bookings will be scheduled</li>
        </ul>

        {error && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
            {error}
          </div>
        )}
      </Modal>
    </>
  )
}

