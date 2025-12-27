'use client'

import { useState } from 'react'
import { PlannedSession, db } from '@/lib/dexieClient'
import { format, addDays } from 'date-fns'

interface SessionActionsProps {
  session: PlannedSession
  onUpdate: () => void
  compact?: boolean
}

export default function SessionActions({ session, onUpdate, compact = false }: SessionActionsProps) {
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMarkComplete = async () => {
    setIsProcessing(true)
    try {
      await db.plannedSessions.update(session.id, {
        status: 'completed'
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to mark as complete:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancel this planned session?')) return
    
    setIsProcessing(true)
    try {
      await db.plannedSessions.update(session.id, {
        status: 'cancelled'
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to cancel:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReschedule = async () => {
    setIsProcessing(true)
    try {
      await db.plannedSessions.update(session.id, {
        status: 'rescheduled',
        rescheduledTo: newDate
      })
      
      // Create new planned session for the new date
      await db.plannedSessions.add({
        ...session,
        id: crypto.randomUUID(),
        plannedDate: newDate,
        status: 'pending',
        rescheduledTo: null,
        createdAt: Date.now(),
        syncStatus: 'pending'
      })
      
      setShowRescheduleModal(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to reschedule:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRestore = async () => {
    setIsProcessing(true)
    try {
      await db.plannedSessions.update(session.id, {
        status: 'pending',
        completedSessionId: null,
        rescheduledTo: null
      })
      onUpdate()
    } catch (error) {
      console.error('Failed to restore:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Show different actions based on status
  if (session.status === 'pending') {
    if (compact) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={handleMarkComplete}
            disabled={isProcessing}
            className="min-h-touch p-2 hover:bg-primary-accent/10 rounded-lg transition-colors text-primary-accent"
            title="Mark as complete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowRescheduleModal(true)}
            disabled={isProcessing}
            className="min-h-touch p-2 hover:bg-warning/10 rounded-lg transition-colors text-yellow-700 dark:text-yellow-300"
            title="Reschedule"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="min-h-touch p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
            title="Cancel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }

    return (
      <>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleMarkComplete}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-primary-accent/10 hover:bg-primary-accent/20 text-primary-accent dark:text-primary-accent-300 rounded-lg transition-colors text-sm font-medium"
          >
            ✓ Complete
          </button>
          <button
            onClick={() => setShowRescheduleModal(true)}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-yellow-700 dark:text-yellow-300 rounded-lg transition-colors text-sm font-medium"
          >
            Reschedule
          </button>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>

        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
            <div className="bg-surface dark:bg-gray-800 rounded-t-3xl md:rounded-2xl p-6 pb-8 safe-area-pb w-full md:max-w-sm md:w-full shadow-xl">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 md:hidden\" />
              <h3 className="text-lg font-bold mb-3 text-text-primary dark:text-white\">
                Reschedule Session
              </h3>
              <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
                Choose a new date for "{session.subject}"
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
                  className="flex-1 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl transition-colors font-medium"
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

  // For completed, cancelled, or rescheduled sessions - show restore option
  return (
    <button
      onClick={handleRestore}
      disabled={isProcessing}
      className="px-3 py-1.5 hover:bg-primary/10 text-primary dark:text-primary-300 rounded-lg transition-colors text-sm font-medium"
    >
      Restore to Pending
    </button>
  )
}
