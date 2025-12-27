'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MicroAction } from '@/lib/types'
import { completeMicroAction, deleteMicroAction, updateMicroAction, updateMicroActionDate } from '@/lib/supabaseStudyTrack'

interface MicroActionActionsProps {
  action: MicroAction
  onUpdate: () => void
}

export default function MicroActionActions({ action, onUpdate }: MicroActionActionsProps) {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMarkComplete = async () => {
    setIsProcessing(true)
    try {
      await completeMicroAction(action.id)
      onUpdate()
    } catch (error) {
      console.error('Failed to mark micro-action complete:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel this Focus action?')) return

    setIsProcessing(true)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      // If this is a future-scheduled action (e.g. locked for tomorrow), remove it.
      if (action.date > todayStr) {
        await deleteMicroAction(action.id)
      } else {
        // If it’s on/near today, “cancel” means: don’t keep it locked on the calendar.
        await updateMicroAction(action.id, { locked: false })
      }

      onUpdate()
    } catch (error) {
      console.error('Failed to cancel micro-action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReschedule = async () => {
    setIsProcessing(true)
    try {
      await updateMicroActionDate(action.id, newDate)
      // Ensure it stays visible as a scheduled focus item.
      await updateMicroAction(action.id, { locked: true })
      setShowRescheduleModal(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to reschedule micro-action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleMarkComplete}
          disabled={isProcessing || action.completed}
          className="px-3 py-1.5 bg-primary-accent/10 hover:bg-primary-accent/20 text-primary-accent dark:text-primary-accent-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ Complete
        </button>
        <button
          onClick={() => setShowRescheduleModal(true)}
          disabled={isProcessing}
          className="px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-yellow-700 dark:text-yellow-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reschedule
        </button>
        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
          <div className="bg-surface dark:bg-gray-800 rounded-t-3xl md:rounded-2xl p-6 pb-8 safe-area-pb max-w-sm w-full shadow-xl">
            {/* Mobile drag handle */}
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 md:hidden" />
            <h3 className="text-lg font-bold mb-3 text-text-primary dark:text-white">
              Reschedule Focus Action
            </h3>
            <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
              Choose a new date for this Focus action
            </p>

            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-text-primary dark:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                disabled={isProcessing}
                className="flex-1 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
