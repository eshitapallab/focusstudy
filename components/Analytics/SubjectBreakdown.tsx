'use client'

import { useMemo } from 'react'

interface SubjectBreakdownProps {
  sessionsWithMetadata: Array<{
    session: {
      id: string
      startTs: number
      endTs: number | null
      pausedMs: number
    }
    metadata?: {
      subject: string | null
    }
  }>
}

export default function SubjectBreakdown({ sessionsWithMetadata }: SubjectBreakdownProps) {
  const subjectData = useMemo(() => {
    const subjectMap = new Map<string, { minutes: number; sessions: number }>()
    
    sessionsWithMetadata.forEach(({ session, metadata }) => {
      if (!session.endTs || !metadata?.subject) return
      
      const subject = metadata.subject
      const minutes = Math.floor((session.endTs - session.startTs - session.pausedMs) / 1000 / 60)
      
      const existing = subjectMap.get(subject) || { minutes: 0, sessions: 0 }
      subjectMap.set(subject, {
        minutes: existing.minutes + minutes,
        sessions: existing.sessions + 1
      })
    })
    
    // Filter: only show subjects with 2+ sessions
    const filtered = Array.from(subjectMap.entries())
      .filter(([_, data]) => data.sessions >= 2)
      .map(([subject, data]) => ({
        subject,
        ...data
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6) // Top 6
    
    return filtered
  }, [sessionsWithMetadata])
  
  if (subjectData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
          Subject Breakdown
        </h3>
        <div className="text-center py-6 md:py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm md:text-base">
            Not enough labeled sessions yet
          </p>
          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">
            Label at least 2 sessions for the same subject to see breakdown
          </p>
        </div>
      </div>
    )
  }
  
  const totalMinutes = subjectData.reduce((sum, s) => sum + s.minutes, 0)
  
  // Color palette (neutral, accessible)
  const colors = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-teal-500'
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">
        Subject Breakdown
      </h3>
      
      <div className="space-y-3 md:space-y-4">
        {/* Donut chart (simple bar representation) */}
        <div className="flex h-3 md:h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {subjectData.map((subject, i) => (
            <div
              key={subject.subject}
              className={`${colors[i % colors.length]} transition-all hover:opacity-80`}
              style={{ width: `${(subject.minutes / totalMinutes) * 100}%` }}
              title={`${subject.subject}: ${subject.minutes} min`}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="space-y-2 md:space-y-3">
          {subjectData.map((subject, i) => (
            <div key={subject.subject} className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ${colors[i % colors.length]}`} />
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {subject.subject}
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
                <span className="text-gray-600 dark:text-gray-400 tabular-nums">
                  {subject.minutes}m
                </span>
                <span className="text-gray-500 dark:text-gray-500 tabular-nums w-10 md:w-12 text-right">
                  {Math.round((subject.minutes / totalMinutes) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Total
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
              {totalMinutes} min
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
