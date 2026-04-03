'use client'

import { useState, useEffect } from 'react'
import { saveRecurringClass, type RecurringClassFormData } from '@/app/actions/recurring-classes'
import { useRouter } from 'next/navigation'
import { COMMON_TIMEZONES, formatDateInGymTimezone, getDayName, formatTime12Hour } from '@/lib/date-utils'
import type { RecurringClass } from '@/lib/database.types'
import { Button, Modal, Input, Select, Alert, TimeInput, Combobox } from '@/components/ui'
import { YMCA_BRANCHES, YMCA_MASTER_CLASSES, fuzzyMatchClasses } from '@/lib/constants/ymca'
import type { ComboboxOption } from '@/components/ui'
import { useCallback } from 'react'

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
  const [savedCustomClassName, setSavedCustomClassName] = useState<string | null>(null)
  const [formData, setFormData] = useState<RecurringClassFormData>({
    day_of_week: initialClass?.day_of_week ?? 1,
    class_time: initialClass?.class_time ? initialClass.class_time.substring(0, 5) : '',
    class_type: initialClass?.class_type || '',
    branch: initialClass?.branch || defaultBranch || '',
    booking_window_hours: initialClass?.booking_window_hours ?? 26,
    timezone: initialClass?.timezone || 'America/New_York',
  })

  const formatClassDisplay = (): string => {
    const source = savedClassDetails || formData
    const dayName = getDayName(source.day_of_week)
    const time = formatTime12Hour(source.class_time)
    return `${source.class_type} - ${dayName} ${time} @ ${source.branch}`
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
        setSavedCustomClassName(result.isCustomClassName ? formData.class_type : null)
        setFormKey(k => k + 1) // Reset form to clear touched state

        // Check if booking window is already open (server-side check)
        if (result.bookingWindowAlreadyOpen && result.id) {
          // Booking window is open - show dialog asking if user wants to book now
          setSavedClassId(result.id)
          setSavedClassDetails(result.classDetails || null)
          setShowBookNowDialog(true)
        } else {
          // Booking window not open - delay redirect so user sees success state
          setTimeout(() => {
            if (onSuccess) {
              onSuccess()
            } else {
              router.push('/dashboard/schedule')
              router.refresh()
            }
          }, 1500) // 1.5 second delay to show success button
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

  // Convert timezone list to Select options format
  const timezoneOptions = COMMON_TIMEZONES.map(tz => ({
    value: tz.value,
    label: tz.label,
  }))

  // Fuzzy filter for Combobox - memoized to avoid invalidating Combobox internals
  const filterClasses = useCallback((_query: string, _options: ComboboxOption[]): ComboboxOption[] => {
    return fuzzyMatchClasses(_query).map(m => ({ value: m.display, label: m.display }))
  }, [])

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Group 1: Class Identity (WHAT & WHERE) */}
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
          hint="Search by name or browse the list"
          allowCustom
          customLabel="Add custom class"
          required
        />

        <Select
          key={`branch-${formKey}`}
          label="Branch"
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          options={branchOptions}
          placeholder="Select a branch"
          required
        />

        {/* Group 2: Schedule (WHEN) */}
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
          label="Time"
          name="class_time"
          value={formData.class_time}
          onChange={(value) => setFormData(prev => ({ ...prev, class_time: value }))}
          required
        />

        <Select
          key={`timezone-${formKey}`}
          label="Timezone"
          name="timezone"
          value={formData.timezone}
          onChange={handleChange}
          options={timezoneOptions}
          hint="Where the gym is located"
        />

        {/* Group 3: System Settings */}
        <Input
          key={`booking_window_hours-${formKey}`}
          label="Registration Opens"
          name="booking_window_hours"
          type="number"
          min={1}
          max={168}
          value={formData.booking_window_hours}
          onChange={handleChange}
          required
          hint="Hours before class (default: 26)"
        />

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {success && (
          <Alert variant="success">
            {savedCustomClassName
              ? "Saved! We'll review your custom class name."
              : 'Class saved successfully!'}
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

      {/* Book Now Dialog */}
      <Modal
        isOpen={showBookNowDialog}
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
          Booking window is open for <strong>{formatClassDisplay()}</strong>. Would you like to book now?
        </p>

        {error && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
            {error}
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          <strong>Book Now:</strong> Books this week&apos;s class immediately.<br />
          <strong>Skip This Week:</strong> Class won&apos;t be booked this week, automatic booking resumes next week.
        </p>
      </Modal>

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
            {skipClearData && formatDateInGymTimezone(
              new Date(skipClearData.skipDate || ''),
              skipClearData.formData.timezone,
              'short'
            )}
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

