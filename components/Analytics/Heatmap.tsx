'use client'

import { useMemo } from 'react'
import { 
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  isSameDay,
  getDay
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
    if (minutes === 0) return 'bg-gray-100 dark:bg-gray-800'
    const ratio = minutes / maxMinutes
    if (ratio > 0.75) return 'bg-emerald-600 dark:bg-emerald-500'
    if (ratio > 0.5) return 'bg-emerald-500 dark:bg-emerald-600'
    if (ratio > 0.25) return 'bg-emerald-400 dark:bg-emerald-700'
    return 'bg-emerald-300 dark:bg-emerald-800'
  }
  
  // Group into weeks (7 days each)
  const weeks: Array<Array<{ date: Date; minutes: number; sessions: number }>> = []
  let currentWeek: Array<{ date: Date; minutes: number; sessions: number }> = []
  
  // Pad to start on Sunday
  if (heatmapData.length > 0) {
    const firstDayOfWeek = getDay(heatmapData[0].date)
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), minutes: -1, sessions: 0 })
    }
  }
  
  heatmapData.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  // Pad end of last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(0), minutes: -1, sessions: 0 })
    }
    weeks.push(currentWeek)
  }

  // Calculate month markers
  const monthMarkers: { label: string; weekIndex: number }[] = []
  let lastMonth = ''
  weeks.forEach((week, idx) => {
    const firstValidDay = week.find(d => d.minutes >= 0)
    if (firstValidDay) {
      const monthLabel = format(firstValidDay.date, 'MMM yyyy')
      if (monthLabel !== lastMonth) {
        monthMarkers.push({ label: monthLabel, weekIndex: idx })
        lastMonth = monthLabel
      }
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
          <div className="flex gap-3 mb-3 ml-16">
            {monthMarkers.map(({ label, weekIndex }) => (
              <div
                key={`${label}-${weekIndex}`}
                className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                style={{ 
                  marginLeft: weekIndex === 0 ? 0 : `${weekIndex * 24}px`
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {/* Day labels */}
            <div className="flex flex-col gap-1.5 justify-start pt-0.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-xs font-medium text-gray-600 dark:text-gray-400 h-5 flex items-center justify-end pr-2 w-10"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex gap-1.5">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1.5">
                  {week.map((day, dayIdx) => {
                    if (day.minutes === -1) {
                      return <div key={dayIdx} className="w-5 h-5" />
                    }

                    return (
                      <div
                        key={dayIdx}
                        className={`w-5 h-5 rounded transition-all hover:ring-2 hover:ring-emerald-500 hover:ring-offset-1 dark:hover:ring-emerald-400 hover:scale-110 cursor-pointer relative group ${
                          getIntensityClass(day.minutes)
                        }`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-950 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-xl">
                          <div className="font-bold">{format(day.date, 'EEE, MMM d, yyyy')}</div>
                          <div className="mt-1 text-gray-300">
                            {day.minutes > 0 ? (
                              <>
                                {day.minutes} min · {day.sessions} session{day.sessions !== 1 ? 's' : ''}
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
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 ml-16">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Less</span>
            <div className="flex gap-1.5">
              <div className="w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <div className="w-5 h-5 bg-emerald-300 dark:bg-emerald-800 rounded"></div>
              <div className="w-5 h-5 bg-emerald-400 dark:bg-emerald-700 rounded"></div>
              <div className="w-5 h-5 bg-emerald-500 dark:bg-emerald-600 rounded"></div>
              <div className="w-5 h-5 bg-emerald-600 dark:bg-emerald-500 rounded"></div>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
