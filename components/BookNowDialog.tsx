'use client'

import { getDayName, formatTime12Hour } from '@/lib/date-utils'
import { Button, Modal } from '@/components/ui'
import type { ClassToBook } from '@/hooks/useBookNowDialog'

type Props = {
  classToBook: ClassToBook | null
  isOpen: boolean
  booking: boolean
  onBookNow: () => void
  onSkip: () => void
  /** Extra content between the class display and the help text */
  children?: React.ReactNode
  /** e.g. "Class 1 of 3" for multi-class dialogs */
  subtitle?: string
}

export function formatClassDisplay(classData: ClassToBook): string {
  const dayName = getDayName(classData.day_of_week)
  const time = formatTime12Hour(classData.class_time)
  return `${classData.class_type} - ${dayName} ${time} @ ${classData.branch}`
}

export default function BookNowDialog({
  classToBook,
  isOpen,
  booking,
  onBookNow,
  onSkip,
  children,
  subtitle,
}: Props) {
  return (
    <Modal
      isOpen={isOpen && !!classToBook}
      onClose={onSkip}
      title="Booking Window Already Open!"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onSkip} disabled={booking}>
            No, Skip This Week
          </Button>
          <Button variant="success" onClick={onBookNow} loading={booking}>
            Yes, Book Now
          </Button>
        </>
      }
    >
      <p className="text-gray-700">
        Booking window is open for{' '}
        <strong>{classToBook && formatClassDisplay(classToBook)}</strong>.
        Would you like to book now?
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      )}
      {children}
      <p className="mt-4 text-sm text-gray-500">
        <strong>Book Now:</strong> Books this week&apos;s class immediately.
        <br />
        <strong>Skip This Week:</strong> Class won&apos;t be booked this week,
        automatic booking resumes next week.
      </p>
    </Modal>
  )
}
