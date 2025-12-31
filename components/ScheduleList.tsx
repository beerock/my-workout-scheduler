'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteRecurringClass,
  toggleRecurringClassActive,
} from '@/app/actions/recurring-classes'
import { getDayName, formatTime12Hour } from '@/lib/date-utils'
import SkipButton from './SkipButton'
import type { RecurringClass } from '@/lib/database.types'
import { Button, Modal, Badge, Card } from '@/components/ui'

type Props = {
  classes: RecurringClass[]
  gymUrl?: string | null
  schedulePaused?: boolean
  onUpdate?: () => void
}

type ClassToBook = {
  id: string
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
}

export default function ScheduleList({ classes, gymUrl, schedulePaused = false, onUpdate }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [classToBook, setClassToBook] = useState<ClassToBook | null>(null)
  const [showBookNowDialog, setShowBookNowDialog] = useState(false)
  const [bookingClass, setBookingClass] = useState(false)

  const formatClassDisplay = (classData: ClassToBook): string => {
    const dayName = getDayName(classData.day_of_week)
    const time = formatTime12Hour(classData.class_time)
    return `${classData.class_type} - ${dayName} ${time} @ ${classData.branch}`
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteRecurringClass(id)
      if (result.success) {
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        alert(`Failed to delete: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeletingId(null)
      setShowDeleteConfirm(null)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingId(id)
    try {
      const result = await toggleRecurringClassActive(id, !currentActive)
      if (result.success) {
        // Check if booking window is already open (activate scenario)
        if (result.bookingWindowAlreadyOpen && result.classDetails) {
          setClassToBook({ id, ...result.classDetails })
          setShowBookNowDialog(true)
          setTogglingId(null)
        } else {
          // No dialog needed, just refresh
          if (onUpdate) {
            onUpdate()
          } else {
            router.refresh()
          }
          setTogglingId(null)
        }
      } else {
        alert(`Failed to update: ${result.error}`)
        setTogglingId(null)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTogglingId(null)
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

  // Sort classes by day of week, then time
  const sortedClasses = [...classes].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week
    }
    return a.class_time.localeCompare(b.class_time)
  })

  if (sortedClasses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4 font-dm-sans">No classes scheduled yet.</p>
        <Button
          variant="primary"
          onClick={() => router.push('/dashboard/schedule/add')}
        >
          Add Your First Class
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedClasses.map(classItem => {
        const isDeleting = deletingId === classItem.id
        const isToggling = togglingId === classItem.id
        const showDelete = showDeleteConfirm === classItem.id

        return (
          <Card
            key={classItem.id}
            variant="outlined"
            padding="md"
            className={
              schedulePaused
                ? 'opacity-60'
                : !classItem.active
                ? 'opacity-75 bg-gray-50'
                : ''
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Day and Time - Prominent Display */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-sora font-bold ${
                      schedulePaused ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {getDayName(classItem.day_of_week)}
                    </span>
                    <span className={`text-2xl font-sora font-bold ${
                      schedulePaused ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {formatTime12Hour(classItem.class_time)}
                    </span>
                  </div>
                  {schedulePaused && (
                    <Badge variant="warning" size="sm">Paused</Badge>
                  )}
                  {!schedulePaused && !classItem.active && (
                    <Badge variant="default" size="sm" diagonal={false}>Inactive</Badge>
                  )}
                </div>

                <div className="mb-2">
                  <h3 className={`text-lg font-sora font-semibold ${
                    schedulePaused ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {classItem.class_type}
                  </h3>
                </div>

                <div className={`space-y-1 text-sm font-dm-sans ${
                  schedulePaused ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Branch:</span>
                    <span>{classItem.branch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Booking Window:</span>
                    <span>{classItem.booking_window_hours} hours before</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* Active Toggle */}
                <label className={`flex items-center gap-1 cursor-pointer ${
                  schedulePaused ? 'opacity-50' : ''
                }`}>
                  <input
                    type="checkbox"
                    id={`active-toggle-${classItem.id}`}
                    name={`active-${classItem.id}`}
                    checked={schedulePaused ? false : classItem.active}
                    onChange={() => handleToggleActive(classItem.id, classItem.active)}
                    disabled={isToggling || schedulePaused}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                  />
                  <span className={`text-xs font-dm-sans ${
                    schedulePaused ? 'text-gray-400' : 'text-gray-600'
                  }`}>Active</span>
                </label>

                {/* Skip Button */}
                <SkipButton
                  recurringClass={classItem}
                  gymUrl={gymUrl}
                  onUpdate={onUpdate}
                  schedulePaused={schedulePaused}
                />

                {/* Copy Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/schedule/add?copyFrom=${classItem.id}`)}
                >
                  Copy
                </Button>

                {/* Edit Button */}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => router.push(`/dashboard/schedule/edit/${classItem.id}`)}
                >
                  Edit
                </Button>

                {/* Delete Button */}
                {!showDelete ? (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(classItem.id)}
                    disabled={isDeleting}
                  >
                    Delete
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-dm-sans">Confirm?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                      loading={isDeleting}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(null)}
                      disabled={isDeleting}
                    >
                      No
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}

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
    </div>
  )
}

