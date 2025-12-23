'use client'

import { useMemo } from 'react'
import { format, subDays, startOfDay } from 'date-fns'

interface WeekTrendProps {
  sessions: Array<{
    startTs: number
    endTs: number | null
    pausedMs: number
  }>
}

export default function WeekTrend({ sessions }: WeekTrendProps) {
  const weekData = useMemo(() => {
    const data = []
    const today = startOfDay(new Date())
    
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dayStart = date.getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      
      // Filter sessions for this day
      const daySessions = sessions.filter(s => 
        s.startTs >= dayStart && s.startTs < dayEnd && s.endTs
      )
      
      // Calculate total minutes
      const totalMs = daySessions.reduce((sum, s) => {
        if (s.endTs) {
          return sum + (s.endTs - s.startTs - s.pausedMs)
        }
        return sum
      }, 0)
      
      data.push({
        date,
        label: format(date, 'EEE'),
        minutes: Math.floor(totalMs / 1000 / 60),
        sessions: daySessions.length
      })
    }
    
    return data
  }, [sessions])
  
  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 60)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        7-Day Trend
      </h3>
      
      {/* Chart */}
      <div className="space-y-4">
        <div className="flex items-end justify-between h-40 gap-2">
          {weekData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar */}
              <div className="w-full flex flex-col justify-end h-32">
                <div 
                  className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600 relative group"
                  style={{ 
                    height: `${(day.minutes / maxMinutes) * 100}%`,
                    minHeight: day.minutes > 0 ? '4px' : '0'
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.minutes} min
                  </div>
                </div>
              </div>
              
              {/* Label */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {day.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {weekData.reduce((sum, d) => sum + d.minutes, 0)}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">min</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {weekData.reduce((sum, d) => sum + d.sessions, 0)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(weekData.reduce((sum, d) => sum + d.minutes, 0) / 7)}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">min</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily avg</p>
          </div>
        </div>
      </div>
    </div>
  )
}
