'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateSchedulePaused } from '@/app/actions/user-settings'
import { formatTime12Hour } from '@/lib/date-utils'
import { Button, Modal } from '@/components/ui'

type ClassWithOpenWindow = {
  id: string
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
}

type Props = {
  isPaused: boolean
  onUpdate?: () => void
  variant?: 'banner' | 'inline'
}

/**
 * PauseBanner - Editorial-style pause/resume control
 *
 * Two variants:
 * - banner: Full-width banner shown in Next Class card position (when paused)
 * - inline: Header button - "Pause All" (not paused) or "Resume All" (paused)
 *
 * When paused, the banner variant shows a prominent amber card with Resume button.
 * The inline variant shows just a compact button in the header.
 */
export default function PauseBanner({ isPaused: initialPaused, onUpdate, variant = 'banner' }: Props) {
  const router = useRouter()
  const [paused, setPaused] = useState(initialPaused)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classesWithOpenWindows, setClassesWithOpenWindows] = useState<ClassWithOpenWindow[]>([])
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0)
  const [showBookNowDialog, setShowBookNowDialog] = useState(false)
  const [bookingClass, setBookingClass] = useState(false)

  useEffect(() => {
    setPaused(initialPaused)
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
        setPaused(paused) // Revert
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setPaused(paused) // Revert
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

  // Book Now Dialog - shared across variants
  const BookNowDialog = (
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
  )

  // ========================================
  // INLINE VARIANT - Header button
  // ========================================
  if (variant === 'inline') {
    // Paused state: Show green Resume button
    if (paused) {
      return (
        <>
          <button
            onClick={handleToggle}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 2px 8px rgba(0, 200, 83, 0.3)' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            {loading ? 'Resuming...' : 'Resume All'}
          </button>
          {BookNowDialog}
        </>
      )
    }

    // Not paused: Show prominent "Pause All Classes" button with amber styling
    return (
      <>
        <button
          onClick={handleToggle}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-dm-sans text-sm font-medium rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          {loading ? 'Pausing...' : 'Pause All'}
        </button>
        {BookNowDialog}
      </>
    )
  }

  // ========================================
  // BANNER VARIANT - Full-width card (replaces Next Class position)
  // ========================================

  // Only show banner when paused - this replaces where Next Class card would be
  if (!paused) {
    return <>{BookNowDialog}</>
  }

  // Paused state: Show prominent amber banner on ALL screen sizes
  return (
    <>
      <div
        className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 opacity-0 animate-fade-in-up"
        style={{
          boxShadow: '0 4px 24px rgba(245, 158, 11, 0.15), 0 8px 32px rgba(251, 146, 60, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-300/15 to-transparent rounded-full blur-2xl"
          aria-hidden="true"
        />

        {/* Subtle animated pulse ring */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-amber-300/30 animate-pulse pointer-events-none"
          style={{ animationDuration: '3s' }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Icon with warm glow */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"
                style={{ boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </div>
              {/* Status dot */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-amber-50 animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-gray-900">
                Bookings Paused
              </h2>
              <span className="px-2 py-0.5 bg-amber-200/70 text-amber-800 font-dm-sans text-xs font-semibold rounded-full">
                On Hold
              </span>
            </div>
            <p className="font-dm-sans text-sm sm:text-base text-gray-600">
              Your automatic class bookings are paused. Resume when you&apos;re ready to start booking again.
            </p>
          </div>

          {/* Resume button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleToggle}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00c853] to-[#00a844] text-white font-dm-sans text-base font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{ boxShadow: '0 4px 16px rgba(0, 200, 83, 0.35)' }}
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {loading ? 'Resuming...' : 'Resume All'}
            </button>
          </div>
        </div>

        {error && (
          <p className="relative mt-4 text-sm text-danger-600 font-dm-sans">{error}</p>
        )}
      </div>
      {BookNowDialog}
    </>
  )
}
