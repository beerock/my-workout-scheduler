'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteRecurringClass,
  toggleRecurringClassActive,
  getRecurringClasses,
} from '@/app/actions/recurring-classes'
import { getDayName, formatTime12Hour } from '@/lib/date-utils'
import SkipButton from './SkipButton'
import type { RecurringClass } from '@/lib/database.types'

type Props = {
  classes: RecurringClass[]
  gymUrl?: string | null
  schedulePaused?: boolean
  onUpdate?: () => void
}

export default function ScheduleList({ classes, gymUrl, schedulePaused = false, onUpdate }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

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
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        alert(`Failed to update: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTogglingId(null)
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
        <p className="text-gray-500 mb-4">No classes scheduled yet.</p>
        <a
          href="/dashboard/schedule/add"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Your First Class
        </a>
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
          <div
            key={classItem.id}
            className={`border rounded-lg p-4 ${
              schedulePaused
                ? 'bg-gray-100 opacity-60'
                : classItem.active
                ? 'bg-white'
                : 'bg-gray-50 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Day and Time - Prominent Display */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${
                      schedulePaused ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {getDayName(classItem.day_of_week)}
                    </span>
                    <span className={`text-2xl font-bold ${
                      schedulePaused ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {formatTime12Hour(classItem.class_time)}
                    </span>
                  </div>
                  {schedulePaused && (
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                      ⚠️ Paused
                    </span>
                  )}
                  {!schedulePaused && !classItem.active && (
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-600 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="mb-2">
                  <h3 className={`text-lg font-semibold ${
                    schedulePaused ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {classItem.class_type}
                  </h3>
                </div>
                
                <div className={`space-y-1 text-sm ${
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
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className={`text-xs ${
                    schedulePaused ? 'text-gray-400' : 'text-gray-600'
                  }`}>Active</span>
                </label>

                {/* Skip Button */}
                <SkipButton
                  recurringClass={classItem}
                  gymUrl={gymUrl}
                  onUpdate={onUpdate}
                />

                {/* Copy Button */}
                <a
                  href={`/dashboard/schedule/add?copyFrom=${classItem.id}`}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  title="Copy this class"
                >
                  Copy
                </a>

                {/* Edit Button */}
                <a
                  href={`/dashboard/schedule/edit/${classItem.id}`}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Edit
                </a>

                {/* Delete Button */}
                {!showDelete ? (
                  <button
                    onClick={() => setShowDeleteConfirm(classItem.id)}
                    disabled={isDeleting}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Confirm?</span>
                    <button
                      onClick={() => handleDelete(classItem.id)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

