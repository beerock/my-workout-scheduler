'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  deleteRecurringClass,
  toggleRecurringClassActive,
} from '@/app/actions/recurring-classes'
import { getDayName, formatTime12Hour, formatDateInGymTimezone } from '@/lib/date-utils'
import SkipButton from './SkipButton'
import type { RecurringClass } from '@/lib/database.types'
import { Button, Modal } from '@/components/ui'

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

// Diagonal Badge Component matching Complete Badge System
function DiagonalBadge({
  variant,
  children,
}: {
  variant: 'success' | 'pending' | 'waitlisted' | 'failed' | 'skipped' | 'inactive' | 'paused'
  children: React.ReactNode
}) {
  const gradients = {
    success: 'from-[#00c853] to-[#00a844]',
    pending: 'from-[#ff9500] to-[#ff6b00]',
    waitlisted: 'from-[#1a6fff] to-[#0052e6]',
    failed: 'from-[#f43f5e] to-[#e11d48]',
    skipped: 'from-amber-500 to-amber-600',
    inactive: 'from-gray-400 to-gray-500',
    paused: 'from-amber-400 to-amber-500',
  }

  return (
    <div
      className={`px-2 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r ${gradients[variant]} text-white font-dm-sans text-xs sm:text-sm font-medium inline-block`}
      style={{
        clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
      }}
    >
      {children}
    </div>
  )
}

export default function ScheduleList({ classes, gymUrl, schedulePaused = false, onUpdate }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [classToBook, setClassToBook] = useState<ClassToBook | null>(null)
  const [showBookNowDialog, setShowBookNowDialog] = useState(false)
  const [bookingClass, setBookingClass] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Track client-side mount for portal rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if click is inside menu
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return
      }
      // Check if click is on any menu button
      const clickedButton = Array.from(buttonRefs.current.values()).some(
        btn => btn && btn.contains(event.target as Node)
      )
      if (!clickedButton) {
        setOpenMenuId(null)
        setMenuPosition(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  // Close menu on scroll
  useEffect(() => {
    function handleScroll() {
      if (openMenuId) {
        setOpenMenuId(null)
        setMenuPosition(null)
      }
    }
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [openMenuId])

  // Toggle menu and calculate position
  const handleMenuToggle = (classId: string) => {
    if (openMenuId === classId) {
      setOpenMenuId(null)
      setMenuPosition(null)
    } else {
      const button = buttonRefs.current.get(classId)
      if (button) {
        const rect = button.getBoundingClientRect()
        setMenuPosition({
          top: rect.bottom + 8,
          left: Math.max(8, rect.right - 208) // 208 = w-52 (13rem), ensure at least 8px from left edge
        })
      }
      setOpenMenuId(classId)
      setShowDeleteConfirm(null) // Reset delete confirmation when opening new menu
    }
  }

  const formatClassDisplay = (classData: ClassToBook): string => {
    const dayName = getDayName(classData.day_of_week)
    const time = formatTime12Hour(classData.class_time)
    return `${classData.class_type} - ${dayName} ${time} @ ${classData.branch}`
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setOpenMenuId(null)
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
    setOpenMenuId(null)
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

  // Get asymmetric offset class for card (first card normal, then alternate)
  const getCardOffset = (index: number): string => {
    if (index === 0) return '' // First card anchors
    return index % 2 === 1 ? 'lg:ml-12 xl:ml-16' : ''
  }

  // Get gradient color for accent overlay based on class type
  const getGradientAccentColor = (classType: string): string => {
    const type = classType.toLowerCase()
    if (type.includes('pump') || type.includes('strength') || type.includes('lift') || type.includes('weight')) {
      return 'from-secondary-500/8'
    }
    if (type.includes('cycle') || type.includes('cycling') || type.includes('spin') || type.includes('cardio') || type.includes('hiit')) {
      return 'from-danger-500/8'
    }
    if (type.includes('yoga') || type.includes('pilates') || type.includes('stretch') || type.includes('meditation')) {
      return 'from-purple-500/8'
    }
    if (type.includes('dance') || type.includes('zumba') || type.includes('step')) {
      return 'from-success-500/8'
    }
    if (type.includes('combat') || type.includes('box') || type.includes('kick') || type.includes('martial')) {
      return 'from-primary-500/8'
    }
    if (type.includes('aqua') || type.includes('swim') || type.includes('water')) {
      return 'from-cyan-500/8'
    }
    return 'from-gray-400/8'
  }

  // Get dot color for next booking indicator
  const getDotColor = (classItem: RecurringClass): string => {
    if (schedulePaused) return 'bg-amber-500'
    if (!classItem.active) return 'bg-gray-400'
    if (classItem.skip_next_occurrence) return 'bg-amber-500'
    return 'bg-[#1a6fff]'
  }

  // Get status badge variant
  const getStatusBadge = (classItem: RecurringClass): { variant: 'success' | 'pending' | 'inactive' | 'paused' | 'skipped'; label: string } | null => {
    if (schedulePaused) {
      return { variant: 'paused', label: 'Paused' }
    }
    if (!classItem.active) {
      return { variant: 'inactive', label: 'Inactive' }
    }
    if (classItem.skip_next_occurrence && classItem.skip_target_datetime) {
      return { variant: 'skipped', label: `Skipping ${formatDateInGymTimezone(new Date(classItem.skip_target_datetime), classItem.timezone, 'short')}` }
    }
    // Could show "Active" or nothing for active classes
    return null
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
      <div
        className="bg-white rounded-2xl p-8 lg:p-12 border border-gray-200/50 text-center opacity-0 animate-fade-in-up hover:-translate-y-1 transition-all duration-300"
        style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="max-w-sm mx-auto">
          {/* Clipped corner icon container */}
          <div
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center"
            style={{
              clipPath: 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 12px, 100% 100%, 0% 100%)'
            }}
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-sora text-xl font-bold text-gray-900 mb-2">
            No Classes Scheduled
          </h3>
          <p className="font-dm-sans text-gray-500 mb-6">
            Get started by adding your first recurring class to automate your gym bookings.
          </p>
          <button
            onClick={() => router.push('/dashboard/schedule/add')}
            className="px-6 py-3 bg-gradient-to-r from-[#1a6fff] to-[#0052e6] text-white font-dm-sans font-medium rounded-lg hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
            style={{
              boxShadow: '0 4px 12px rgba(26, 111, 255, 0.25)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Class
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {sortedClasses.map((classItem, index) => {
        const isDeleting = deletingId === classItem.id
        const isToggling = togglingId === classItem.id
        const showDelete = showDeleteConfirm === classItem.id
        const isMenuOpen = openMenuId === classItem.id
        const statusBadge = getStatusBadge(classItem)

        return (
          <div
            key={classItem.id}
            className={`${getCardOffset(index)} opacity-0 animate-fade-in-up`}
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div
              className={`bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/50 backdrop-blur-sm relative hover:-translate-y-1 transition-all duration-300 ${
                schedulePaused
                  ? 'opacity-60'
                  : !classItem.active
                  ? 'opacity-75 bg-gray-50'
                  : classItem.skip_next_occurrence
                  ? 'bg-amber-50/30'
                  : ''
              }`}
              style={{
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Gradient accent overlay */}
              <div
                className={`absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br ${getGradientAccentColor(classItem.class_type)} to-transparent rounded-full blur-3xl pointer-events-none`}
                aria-hidden="true"
              />

              <div className="relative">
                {/* Header: Class name + Badge */}
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                      <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-sora font-bold ${
                        schedulePaused ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {classItem.class_type}
                      </h3>
                      {statusBadge && (
                        <DiagonalBadge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </DiagonalBadge>
                      )}
                    </div>

                    {/* Day and Time */}
                    <p className={`font-dm-sans text-lg ${
                      schedulePaused ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {getDayName(classItem.day_of_week)} {formatTime12Hour(classItem.class_time)}
                    </p>

                    {/* Branch */}
                    <p className={`font-dm-sans mt-1 ${
                      schedulePaused ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {classItem.branch}
                    </p>

                    {/* Next booking indicator */}
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${getDotColor(classItem)}`} />
                      <span className={`font-dm-sans ${
                        schedulePaused ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {schedulePaused
                          ? 'Booking paused'
                          : !classItem.active
                          ? 'Class inactive'
                          : classItem.skip_next_occurrence
                          ? 'Skipping next occurrence'
                          : `Booking window: ${classItem.booking_window_hours}h before class`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Row - Skip + Edit visible on all screen sizes */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <SkipButton
                    recurringClass={classItem}
                    gymUrl={gymUrl}
                    onUpdate={onUpdate}
                    schedulePaused={schedulePaused}
                    variant="gradient"
                  />
                  <button
                    onClick={() => router.push(`/dashboard/schedule/edit/${classItem.id}`)}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-700 font-dm-sans text-sm font-medium rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all"
                  >
                    Edit
                  </button>

                  {/* 3-Dot Menu Button */}
                  <button
                    ref={(el) => {
                      if (el) buttonRefs.current.set(classItem.id, el)
                    }}
                    onClick={() => handleMenuToggle(classItem.id)}
                    className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Portal-rendered Dropdown Menu */}
      {isMounted && openMenuId && menuPosition && (() => {
        const classItem = sortedClasses.find(c => c.id === openMenuId)
        if (!classItem) return null

        const isDeleting = deletingId === classItem.id
        const isToggling = togglingId === classItem.id
        const showDelete = showDeleteConfirm === classItem.id

        return createPortal(
          <div
            ref={menuRef}
            className="fixed w-52 bg-white rounded-xl border border-gray-200 z-[9999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="py-1">
              {/* Duplicate */}
              <button
                onClick={() => {
                  setOpenMenuId(null)
                  setMenuPosition(null)
                  router.push(`/dashboard/schedule/add?copyFrom=${classItem.id}`)
                }}
                className="w-full px-4 py-3 text-left font-dm-sans text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff] transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>

              {/* Activate/Deactivate */}
              <button
                onClick={() => handleToggleActive(classItem.id, classItem.active)}
                disabled={isToggling || schedulePaused}
                className={`w-full px-4 py-3 text-left font-dm-sans transition-colors flex items-center gap-3 ${
                  schedulePaused
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#1a6fff]'
                }`}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {classItem.active ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  )}
                </svg>
                {isToggling ? 'Updating...' : classItem.active ? 'Deactivate' : 'Activate'}
              </button>

              <div className="border-t border-gray-100 my-1" />

              {/* Delete */}
              {!showDelete ? (
                <button
                  onClick={() => setShowDeleteConfirm(classItem.id)}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 text-left font-dm-sans text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Class
                </button>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-600 mb-3 font-dm-sans">Delete this class?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                      loading={isDeleting}
                    >
                      Yes, Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      })()}

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
