'use client'

import { format, parseISO } from 'date-fns'
import { PlannedSession } from '@/lib/dexieClient'

interface TodayListProps {
  plannedSessions: PlannedSession[]
  onStartSession: (subject: string) => void
  onDelete: (id: string) => void
}

export default function TodayList({ plannedSessions, onStartSession, onDelete }: TodayListProps) {
  if (plannedSessions.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Today's Plan
      </h2>
      <div className="space-y-3">
        {plannedSessions.map((planned) => (
          <div
            key={planned.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {planned.subject}
              </h3>
              {planned.goal && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {planned.goal}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartSession(planned.subject)}
                className="min-w-touch min-h-touch px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
              >
                Start
              </button>
              <button
                onClick={() => onDelete(planned.id)}
                className="min-w-touch min-h-touch p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Delete plan"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
