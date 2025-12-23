'use client'

import { useMemo } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay,
  isSameDay,
  startOfWeek,
  addDays
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
    const startDate = startOfMonth(new Date(today.getFullYear(), today.getMonth() - (months - 1), 1))
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
  
  // Calculate intensity levels (neutral grayscale + primary tint)
  const maxMinutes = Math.max(...heatmapData.map(d => d.minutes), 1)
  
  const getIntensityClass = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-100 dark:bg-gray-800 opacity-40'
    const ratio = minutes / maxMinutes
    if (ratio > 0.75) return 'bg-primary'
    if (ratio > 0.5) return 'bg-primary/75'
    if (ratio > 0.25) return 'bg-primary/50'
    return 'bg-primary/25'
  }
  
  // Group by weeks
  const weeks: Array<Array<{ date: Date; minutes: number; sessions: number }>> = []
  let currentWeek: Array<{ date: Date; minutes: number; sessions: number }> = []
  
  // Pad start to align with Sunday
  const firstDayOfWeek = getDay(heatmapData[0]?.date || new Date())
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: new Date(0), minutes: -1, sessions: 0 })
  }
  
  heatmapData.forEach((day, i) => {
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

  return (
    <div className="bg-surface dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4">
        Activity Pattern
      </h3>
      <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
        Your study consistency over time
      </p>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day labels */}
          <div className="flex gap-1 mb-2">
            <div className="w-8"></div>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="w-4 text-xs text-text-secondary dark:text-gray-400 text-center font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-1 items-center">
                {/* Week label */}
                <div className="w-8 text-xs text-text-secondary dark:text-gray-400">
                  {weekIdx === 0 || week[0].minutes === -1 ? '' : format(week[0].date, 'MMM d')}
                </div>
                
                {/* Days */}
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={`w-4 h-4 rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer relative group ${
                      day.minutes === -1 ? 'bg-transparent' : getIntensityClass(day.minutes)
                    }`}
                    title={day.minutes >= 0 ? `${format(day.date, 'MMM d')}: ${day.minutes} min` : ''}
                  >
                    {day.minutes >= 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {format(day.date, 'MMM d')}<br />
                        {day.minutes} min · {day.sessions} session{day.sessions !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-text-secondary dark:text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 opacity-40 rounded-sm"></div>
              <div className="w-4 h-4 bg-primary/25 rounded-sm"></div>
              <div className="w-4 h-4 bg-primary/50 rounded-sm"></div>
              <div className="w-4 h-4 bg-primary/75 rounded-sm"></div>
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
