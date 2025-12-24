'use client'

import { useState } from 'react'
import { db, PlannedSession, getOrCreateDeviceId } from '@/lib/dexieClient'
import { format } from 'date-fns'

interface PlannerModalProps {
  onClose: () => void
  onCreated: () => void
}

export default function PlannerModal({ onClose, onCreated }: PlannerModalProps) {
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [goal, setGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const deviceId = await getOrCreateDeviceId()
      
      const planned: PlannedSession = {
        id: crypto.randomUUID(),
        deviceId,
        userId: null,
        subject: subject.trim(),
        plannedDate: date,
        goal: goal.trim() || null,
        status: 'pending',
        completedSessionId: null,
        rescheduledTo: null,
        createdAt: Date.now(),
        syncStatus: 'pending'
      }
      
      await db.plannedSessions.add(planned)
      setIsSubmitting(false)
      onCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create planned session:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl p-6 w-full md:max-w-lg shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
              📅 Plan a Session
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Schedule your next study block</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              📚 What will you study?
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Math homework, Spanish vocab..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
              required
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              📆 When?
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          {/* Goal (optional) */}
          <div>
            <label htmlFor="goal" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              🎯 Goal (optional)
            </label>
            <input
              id="goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Complete chapter 5, Practice 50 words..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-touch py-3 px-4 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim()}
              className="flex-1 min-h-touch py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25"
            >
              {isSubmitting ? 'Creating...' : 'Create Plan ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
