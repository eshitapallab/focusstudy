'use client'

import { useMemo } from 'react'
import { format, subDays, startOfWeek, isSameDay } from 'date-fns'

interface HeatmapProps {
  sessions: Array<{
    startTs: number
    endTs: number | null
    pausedMs: number
  }>
  months?: number
}

export default function Heatmap({ sessions, months = 3 }: HeatmapProps) {
  // Build simple 12-week grid (84 days)
  const totalDays = months * 28
  const today = new Date()
  
  const heatmapData = useMemo(() => {
    const data: Array<{ date: Date; minutes: number; sessions: number }> = []
    
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      
      const daySessions = sessions.filter(s => 
        s.startTs >= dayStart && s.startTs < dayEnd && s.endTs
      )
      
      const totalMs = daySessions.reduce((sum, s) => {
        if (s.endTs) {
          return sum + (s.endTs - s.startTs - s.pausedMs)
        }
        return sum
      }, 0)
      
      data.push({
        date,
        minutes: Math.floor(totalMs / 1000 / 60),
        sessions: daySessions.length
      })
    }
    
    return data
  }, [sessions, totalDays])
  
  const maxMinutes = Math.max(...heatmapData.map(d => d.minutes), 30)
  const totalMinutes = heatmapData.reduce((sum, d) => sum + d.minutes, 0)
  const totalSessions = heatmapData.reduce((sum, d) => sum + d.sessions, 0)
  const activeDays = heatmapData.filter(d => d.minutes > 0).length
  
  const getColor = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-100 dark:bg-gray-700/50'
    const ratio = minutes / maxMinutes
    if (ratio > 0.75) return 'bg-indigo-600'
    if (ratio > 0.5) return 'bg-indigo-500'
    if (ratio > 0.25) return 'bg-indigo-400'
    return 'bg-indigo-300'
  }

  // Group into weeks
  const weeks: typeof heatmapData[] = []
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
            Activity Pattern
          </h3>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
            Last {months} months
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{activeDays}</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">active days</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 md:gap-6 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <div className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{Math.round(totalMinutes / 60)}h</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">total time</div>
        </div>
        <div>
          <div className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{totalSessions}</div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">sessions</div>
        </div>
        <div>
          <div className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            {activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0}m
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">avg/day</div>
        </div>
      </div>
      
      {/* Simple grid */}
      <div className="grid grid-cols-7 gap-0.5 md:gap-1 overflow-x-auto">
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 pb-1 md:pb-2">
            {d}
          </div>
        ))}
        
        {/* Calendar cells */}
        {heatmapData.map((day, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm md:rounded-md ${getColor(day.minutes)} relative group cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 transition-all`}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
              <div className="font-medium">{format(day.date, 'MMM d')}</div>
              <div>{day.minutes > 0 ? `${day.minutes} min` : 'No activity'}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Less</span>
        <div className="flex gap-0.5 md:gap-1">
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm md:rounded bg-gray-100 dark:bg-gray-700/50"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm md:rounded bg-indigo-300"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm md:rounded bg-indigo-400"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm md:rounded bg-indigo-500"></div>
          <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm md:rounded bg-indigo-600"></div>
        </div>
        <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">More</span>
      </div>
    </div>
  )
}
