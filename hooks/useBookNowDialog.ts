'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type ClassToBook = {
  id: string
  class_type: string
  day_of_week: number
  class_time: string
  branch: string
}

type Options = {
  onComplete?: () => void
}

export function useBookNowDialog(options: Options = {}) {
  const router = useRouter()
  const [classToBook, setClassToBook] = useState<ClassToBook | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [booking, setBooking] = useState(false)

  const openDialog = (cls: ClassToBook) => {
    setClassToBook(cls)
    setShowDialog(true)
  }

  const handleBookNow = async () => {
    if (!classToBook) return

    setBooking(true)
    try {
      const response = await fetch('/api/trigger-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classToBook.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger booking')
      }

      setShowDialog(false)
      setClassToBook(null)
      setBooking(false)

      if (options.onComplete) {
        options.onComplete()
      } else {
        router.refresh()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to book class')
      setBooking(false)
    }
  }

  const handleSkipBooking = () => {
    setShowDialog(false)
    setClassToBook(null)

    if (options.onComplete) {
      options.onComplete()
    } else {
      router.refresh()
    }
  }

  return {
    classToBook,
    showDialog,
    booking,
    openDialog,
    handleBookNow,
    handleSkipBooking,
  }
}
