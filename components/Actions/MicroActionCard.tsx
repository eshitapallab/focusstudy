'use client'

import { MicroAction } from '@/lib/types'
import { completeMicroAction } from '@/lib/supabaseStudyTrack'
import { useState } from 'react'

interface MicroActionCardProps {
  action: MicroAction
  onComplete?: () => void
}

export default function MicroActionCard({ action, onComplete }: MicroActionCardProps) {
  const [completing, setCompleting] = useState(false)

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

        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {completing ? 'Marking complete...' : 'Mark as complete'}
        </button>
      </div>
    </div>
  )
}
