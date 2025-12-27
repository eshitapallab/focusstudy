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
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
    
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
      
      // Call onComplete immediately for faster UX
      onComplete()
    } catch (error) {
      console.error('Failed to save session metadata:', error)
      setError('Failed to save. Please try again.')
      setIsSubmitting(false)
    }
  }

  const minutes = Math.floor(durationMs / 1000 / 60)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl p-6 pb-8 safe-area-pb w-full md:max-w-lg md:w-full shadow-2xl animate-slide-up border-t-4 border-gradient-start max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent mb-2">
            Nice session!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            You studied for <span className="font-semibold text-primary">{minutes}</span> {minutes === 1 ? 'minute' : 'minutes'}
          </p>
        </div>

        {/* Subject Input */}
        <div className="mb-5">
          <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            📚 What were you studying?
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Math homework, Spanish vocab..."
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
            autoFocus
          />
          
          {/* Recent subjects suggestions */}
          {recentSubjects.length > 0 && !subject && (
            <div className="flex flex-wrap gap-2 mt-3">
              {recentSubjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 text-primary dark:text-primary-300 rounded-full hover:from-primary-100 hover:to-accent-100 dark:hover:from-primary-900/50 dark:hover:to-accent-900/50 transition-all border border-primary/20"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Focus Rating */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            🎯 How focused were you?
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setFocusRating(rating)}
                className={`min-w-touch min-h-touch w-12 h-12 rounded-xl font-bold text-lg transition-all transform hover:scale-110 ${
                  focusRating === rating
                    ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 scale-110'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={`Focus rating ${rating} out of 5`}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            <span>😵 Distracted</span>
            <span>🎯 Focused</span>
          </div>
        </div>

        {/* Optional Note */}
        <div className="mb-6">
          <label htmlFor="note" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            💭 Quick note (optional)
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any thoughts about this session..."
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={isSubmitting}
            className="flex-1 min-h-touch py-3 px-4 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 min-h-touch py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25"
          >
            {isSubmitting ? 'Saving...' : 'Save ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}
