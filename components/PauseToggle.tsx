'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateSchedulePaused, getUserSettings } from '@/app/actions/user-settings'

type Props = {
  initialPaused?: boolean
  onUpdate?: () => void
}

export default function PauseToggle({ initialPaused, onUpdate }: Props) {
  const router = useRouter()
  const [paused, setPaused] = useState(initialPaused ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPaused(initialPaused ?? false)
  }, [initialPaused])

  const handleToggle = async () => {
    const newPaused = !paused
    setLoading(true)
    setError(null)

    try {
      const result = await updateSchedulePaused(newPaused)

      if (result.success) {
        setPaused(newPaused)
        if (onUpdate) {
          onUpdate()
        } else {
          router.refresh()
        }
      } else {
        setError(result.error || 'Failed to update pause status')
        // Revert on error
        setPaused(paused)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      // Revert on error
      setPaused(paused)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id="pause-all-bookings"
          name="pause-all-bookings"
          checked={paused}
          onChange={handleToggle}
          disabled={loading}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <span className="text-sm font-medium text-gray-700">
          Pause all bookings
        </span>
      </label>
      
      {paused && (
        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
          ⚠️ Paused
        </span>
      )}

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}

