'use client'

import { useMemo } from 'react'
import { 
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  subMonths
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
    const startDate = startOfMonth(subMonths(today, months - 1))
    const endDate = endOfMonth(today)
    
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
  
  // Calculate intensity levels with better visual distinction
  const maxMinutes = Math.max(...heatmapData.map(d => d.minutes), 1)
  
  const getIntensityClass = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
    const ratio = minutes / maxMinutes
    if (ratio > 0.75) return 'bg-emerald-600 dark:bg-emerald-500'
    if (ratio > 0.5) return 'bg-emerald-500 dark:bg-emerald-600'
    if (ratio > 0.25) return 'bg-emerald-400 dark:bg-emerald-700'
    return 'bg-emerald-300 dark:bg-emerald-800'
  }
  
  // Group by weeks (Sunday start)
  const weeks: Array<Array<{ date: Date; minutes: number; sessions: number }>> = []
  let currentWeek: Array<{ date: Date; minutes: number; sessions: number }> = []
  
  // Pad start to align with Sunday
  const firstDayOfWeek = getDay(heatmapData[0]?.date || new Date())
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: new Date(0), minutes: -1, sessions: 0 })
  }
  
  heatmapData.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  
  // Pad end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(0), minutes: -1, sessions: 0 })
    }
    weeks.push(currentWeek)
  }

  // Calculate month labels positions
  const monthLabels: Array<{ month: string; weekIndex: number }> = []
  let lastMonth = ''
  weeks.forEach((week, weekIdx) => {
    // Use the first valid day in the week to determine month
    const firstValidDay = week.find(d => d.minutes >= 0)
    if (firstValidDay) {
      const monthName = format(firstValidDay.date, 'MMM')
      if (monthName !== lastMonth) {
        monthLabels.push({ month: monthName, weekIndex: weekIdx })
        lastMonth = monthName
      }
    }
  })

  const totalMinutes = heatmapData.reduce((sum, d) => sum + d.minutes, 0)
  const totalSessions = heatmapData.reduce((sum, d) => sum + d.sessions, 0)
  const activeDays = heatmapData.filter(d => d.minutes > 0).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Activity Pattern
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeDays} active day{activeDays !== 1 ? 's' : ''} · {totalMinutes} min total · {totalSessions} session{totalSessions !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2 relative" style={{ paddingLeft: '28px' }}>
            {monthLabels.map(({ month, weekIndex }) => (
              <div
                key={`${month}-${weekIndex}`}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 absolute"
                style={{ left: `${28 + weekIndex * 16}px` }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <div
                  key={day}
                  className={`h-3.5 flex items-center justify-end text-xs font-medium ${
                    idx % 2 === 1 ? 'text-gray-700 dark:text-gray-300' : 'text-transparent'
                  }`}
                >
                  {idx % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day, dayIdx) => {
                    if (day.minutes === -1) {
                      return <div key={dayIdx} className="w-3.5 h-3.5" />
                    }

                    return (
                      <div
                        key={dayIdx}
                        className={`w-3.5 h-3.5 rounded-sm transition-all hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-500 hover:scale-110 cursor-pointer relative group ${
                          getIntensityClass(day.minutes)
                        }`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                          <div className="font-semibold">{format(day.date, 'EEEE, MMM d, yyyy')}</div>
                          <div className="mt-0.5">
                            {day.minutes > 0 ? (
                              <>
                                <span className="font-bold">{day.minutes}</span> minutes · <span className="font-bold">{day.sessions}</span> session{day.sessions !== 1 ? 's' : ''}
                              </>
                            ) : (
                              'No activity'
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
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Less</span>
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-sm"></div>
                <div className="w-3.5 h-3.5 bg-emerald-300 dark:bg-emerald-800 rounded-sm"></div>
                <div className="w-3.5 h-3.5 bg-emerald-400 dark:bg-emerald-700 rounded-sm"></div>
                <div className="w-3.5 h-3.5 bg-emerald-500 dark:bg-emerald-600 rounded-sm"></div>
                <div className="w-3.5 h-3.5 bg-emerald-600 dark:bg-emerald-500 rounded-sm"></div>
              </div>
              <span className="font-medium">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
