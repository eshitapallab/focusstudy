'use client'

import { MicroAction } from '@/lib/types'
import { completeMicroAction, lockMicroAction } from '@/lib/supabaseStudyTrack'
import { useState } from 'react'

interface MicroActionCardProps {
  action: MicroAction
  onComplete?: () => void
}

export default function MicroActionCard({ action, onComplete }: MicroActionCardProps) {
  const [completing, setCompleting] = useState(false)
  const [locking, setLocking] = useState(false)
  const [locked, setLocked] = useState(Boolean(action.locked))

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await completeMicroAction(action.id)
      onComplete?.()
    } catch (error) {
      console.error('Failed to complete action:', error)
      setCompleting(false)
    }
  }

  const handleLock = async () => {
    if (locked) return
    setLocking(true)
    try {
      await lockMicroAction(action.id)
      setLocked(true)
      setLocking(false)
    } catch (error) {
      console.error('Failed to lock action:', error)
      setLocking(false)
    }
  }

  if (action.completed) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✓</div>
          <div className="flex-1">
            <div className="text-green-700 font-medium line-through">
              {action.task}
            </div>
            <p className="text-sm text-green-600 mt-1">Completed</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
      <div className="space-y-4">
        {/* Task */}
        <div>
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
            Your Next Action
          </div>
          <p className="text-lg font-medium text-gray-900">{action.task}</p>
        </div>

        {/* Duration badge */}
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm">
          <span className="text-gray-600">⏱️</span>
          <span className="font-medium text-gray-900">
            {action.durationMinutes} minutes
          </span>
        </div>

        {locked && (
          <div className="bg-white/70 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            Locked for tomorrow. You'll be asked about it next day.
          </div>
        )}

        {/* Complete button */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleLock}
            disabled={locking || locked}
            className="w-full py-3 bg-white text-blue-700 rounded-lg font-medium border border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {locked ? 'Locked' : locking ? 'Locking…' : 'Lock this'}
          </button>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {completing ? 'Marking complete...' : 'Mark as complete'}
          </button>
        </div>
      </div>
    </div>
  )
}
