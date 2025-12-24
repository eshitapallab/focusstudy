'use client'

import { format, parseISO } from 'date-fns'
import { PlannedSession } from '@/lib/dexieClient'
import StatusBadge from './StatusBadge'
import SessionActions from './SessionActions'

interface TodayListProps {
  plannedSessions: PlannedSession[]
  onStartSession: (subject: string) => void
  onDelete: (id: string) => void
  onUpdate?: () => void
}

export default function TodayList({ plannedSessions, onStartSession, onDelete, onUpdate }: TodayListProps) {
  if (plannedSessions.length === 0) {
    return null
  }

  // Separate pending and non-pending sessions
  const pendingSessions = plannedSessions.filter(s => s.status === 'pending')
  const otherSessions = plannedSessions.filter(s => s.status !== 'pending')

  return (
    <div className="mb-8">
      {pendingSessions.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-text-primary dark:text-white mb-4 flex items-center gap-2">
            📋 Today's Plan
          </h2>
          <div className="space-y-3">
            {pendingSessions.map((planned) => (
              <div
                key={planned.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 dark:border-gray-700/50 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary dark:text-white truncate">
                        {planned.subject}
                      </h3>
                      <StatusBadge status={planned.status} />
                    </div>
                    {planned.goal && (
                      <p className="text-sm text-text-secondary dark:text-gray-400 truncate">
                        {planned.goal}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => onStartSession(planned.subject)}
                    className="min-w-touch min-h-touch px-5 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 transform hover:scale-105 active:scale-95"
                  >
                    Start →
                  </button>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <SessionActions 
                    session={planned} 
                    onUpdate={() => onUpdate?.()} 
                    compact 
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {otherSessions.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide mt-6 mb-3">
            Other Sessions
          </h3>
          <div className="space-y-2">
            {otherSessions.map((planned) => (
              <div
                key={planned.id}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between gap-4 border border-gray-100 dark:border-gray-700/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-text-primary dark:text-white truncate">
                      {planned.subject}
                    </h4>
                    <StatusBadge status={planned.status} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <SessionActions 
                    session={planned} 
                    onUpdate={() => onUpdate?.()} 
                    compact 
                  />
                  <button
                    onClick={() => onDelete(planned.id)}
                    className="min-h-touch p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
