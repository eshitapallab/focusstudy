'use client'

import { useMemo } from 'react'
import { 
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  isSameDay,
  startOfMonth
} from 'date-fns'

interface HeatmapProps {
  sessions: Array<{
    startTs: number
    endTs: number | null
    pausedMs: number
  }>
  months?: number
}

export default function Heatmap({ sessions, months = 3 }: HeatmapProps) {
  const heatmapData = useMemo(() => {
    const data: Array<{ date: Date; minutes: number; sessions: number }> = []
    const today = new Date()
    
    // Get last N weeks of data (more intuitive than months)
    const weeks = months * 4
    const endDate = endOfWeek(today, { weekStartsOn: 0 })
    const startDate = startOfWeek(addWeeks(today, -weeks), { weekStartsOn: 0 })
    
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    days.forEach(date => {
      const dayStart = date.getTime()
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
    })
    
    return data
  }, [sessions, months])
  
  // Calculate intensity with better distribution
  const maxMinutes = Math.max(...heatmapData.map(d => d.minutes), 1)
  
  const getIntensityClass = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
    const ratio = minutes / maxMinutes
    if (ratio > 0.75) return 'bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-500'
    if (ratio > 0.5) return 'bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600'
    if (ratio > 0.25) return 'bg-emerald-300 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-700'
    return 'bg-emerald-200 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-800'
  }
  
  // Group into weeks
  const weeks: Date[][] = []
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7).map(d => d.date))
  }

  // Calculate month markers
  const monthMarkers: { label: string; weekIndex: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, idx) => {
    const firstDay = week[0]
    const month = firstDay.getMonth()
    if (month !== lastMonth && idx > 0) {
      monthMarkers.push({
        label: format(firstDay, 'MMM yyyy'),
        weekIndex: idx
      })
      lastMonth = month
    }
  })

  const totalMinutes = heatmapData.reduce((sum, d) => sum + d.minutes, 0)
  const totalSessions = heatmapData.reduce((sum, d) => sum + d.sessions, 0)
  const activeDays = heatmapData.filter(d => d.minutes > 0).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        Activity Pattern
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {activeDays} active day{activeDays !== 1 ? 's' : ''} · {totalMinutes} min total · {totalSessions} session{totalSessions !== 1 ? 's' : ''}
      </p>
      
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month markers */}
          {monthMarkers.length > 0 && (
            <div className="flex mb-3 pl-12">
              {monthMarkers.map(({ label, weekIndex }) => (
                <div
                  key={`${label}-${weekIndex}`}
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                  style={{ 
                    marginLeft: weekIndex === 0 ? 0 : `${(weekIndex * 20)}px`,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {/* Day labels */}
            <div className="flex flex-col justify-between py-1">
              {['Mon', 'Wed', 'Fri'].map((day) => (
                <div
                  key={day}
                  className="text-xs font-medium text-gray-600 dark:text-gray-400 h-5 flex items-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((date) => {
                    const dayData = heatmapData.find(d => isSameDay(d.date, date))
                    if (!dayData) return null

                    return (
                      <div
                        key={date.toISOString()}
                        className={`w-4 h-4 rounded transition-all hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-500 hover:scale-125 cursor-pointer relative group ${
                          getIntensityClass(dayData.minutes)
                        }`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-950 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-xl">
                          <div className="font-bold text-sm">{format(date, 'EEE, MMM d')}</div>
                          <div className="mt-1 text-gray-300">
                            {dayData.minutes > 0 ? (
                              <>
                                {dayData.minutes} min · {dayData.sessions} session{dayData.sessions !== 1 ? 's' : ''}
                              </>
                            ) : (
                              'No study time'
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Less</span>
            <div className="flex gap-1.5">
              <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"></div>
              <div className="w-4 h-4 bg-emerald-200 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded"></div>
              <div className="w-4 h-4 bg-emerald-300 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-700 rounded"></div>
              <div className="w-4 h-4 bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600 rounded"></div>
              <div className="w-4 h-4 bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-500 rounded"></div>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
