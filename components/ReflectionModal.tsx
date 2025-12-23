'use client'

import { useState, useEffect } from 'react'
import { db, SessionMetadata, incrementSessionCount } from '@/lib/dexieClient'

interface ReflectionModalProps {
  sessionId: string
  durationMs: number
  onComplete: () => void
  onSkip: () => void
  defaultSubject?: string | null
}

export default function ReflectionModal({
  sessionId,
  durationMs,
  onComplete,
  onSkip,
  defaultSubject = null
}: ReflectionModalProps) {
  const [subject, setSubject] = useState(defaultSubject || '')
  const [focusRating, setFocusRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [recentSubjects, setRecentSubjects] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Load recent subjects for suggestions
    const loadRecentSubjects = async () => {
      const metadata = await db.sessionMetadata
        .where('subject')
        .notEqual('')
        .reverse()
        .limit(5)
        .toArray()
      
      const subjects = metadata
        .map(m => m.subject)
        .filter((s): s is string => s != null && s !== '')
      
      // Deduplicate
      const unique = Array.from(new Set(subjects))
      setRecentSubjects(unique)
    }
    
    loadRecentSubjects()
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const metadata: SessionMetadata = {
        id: crypto.randomUUID(),
        sessionId,
        subject: subject.trim() || null,
        planned: false,
        focusRating,
        note: note.trim() || null,
        labeledAt: Date.now(),
        syncStatus: 'pending'
      }
      
      await db.sessionMetadata.add(metadata)
      
      // Update session count if labeled
      if (subject.trim() || focusRating) {
        await incrementSessionCount(true)
      }
      
      onComplete()
    } catch (error) {
      console.error('Failed to save session metadata:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const minutes = Math.floor(durationMs / 1000 / 60)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-lg md:w-full shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Nice — what was that session for?
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You studied for {minutes} {minutes === 1 ? 'minute' : 'minutes'}
          </p>
        </div>

        {/* Subject Input */}
        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            What were you studying?
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Math homework, Spanish vocab..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          
          {/* Recent subjects suggestions */}
          {recentSubjects.length > 0 && !subject && (
            <div className="flex flex-wrap gap-2 mt-2">
              {recentSubjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Focus Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            How focused were you?
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setFocusRating(rating)}
                className={`min-w-touch min-h-touch w-12 h-12 rounded-full font-semibold transition-all transform hover:scale-110 ${
                  focusRating === rating
                    ? 'bg-primary-500 text-white shadow-lg scale-110'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={`Focus rating ${rating} out of 5`}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            <span>Distracted</span>
            <span>Focused</span>
          </div>
        </div>

        {/* Optional Note */}
        <div className="mb-6">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Note (optional)
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Quick thought about this session..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={isSubmitting}
            className="flex-1 min-h-touch py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 min-h-touch py-3 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
