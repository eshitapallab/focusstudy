'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { db, PlannedSession } from '@/lib/dexieClient'
import Link from 'next/link'

export default function PlannerCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadPlannedSessions()
  }, [currentMonth])

  const loadPlannedSessions = async () => {
    const sessions = await db.plannedSessions.toArray()
    setPlannedSessions(sessions)
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Get sessions for a specific date
  const getSessionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return plannedSessions.filter(s => s.plannedDate === dateStr)
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const handleToday = () => setCurrentMonth(new Date())

  const handleDeleteSession = async (id: string) => {
    if (confirm('Delete this planned session?')) {
      await db.plannedSessions.delete(id)
      loadPlannedSessions()
    }
  }

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : []

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Back to Home"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Session Planner
              </h1>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              + Plan Session
            </Link>
          </div>
        </header>

        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
              >
                Today
              </button>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const sessionsForDay = getSessionsForDate(day)
              const isToday = isSameDay(day, new Date())
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[80px] p-2 rounded-lg border-2 transition-all text-left
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }
                    ${isCurrentMonth 
                      ? 'bg-white dark:bg-gray-800' 
                      : 'bg-gray-50 dark:bg-gray-900 opacity-50'
                    }
                  `}
                >
                  <div className={`
                    text-sm font-semibold mb-1
                    ${isToday 
                      ? 'w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center' 
                      : isCurrentMonth
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-gray-600'
                    }
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  {sessionsForDay.length > 0 && (
                    <div className="space-y-1">
                      {sessionsForDay.slice(0, 2).map(session => (
                        <div
                          key={session.id}
                          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded px-1 py-0.5 truncate"
                        >
                          {session.subject}
                        </div>
                      ))}
                      {sessionsForDay.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{sessionsForDay.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedDateSessions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No planned sessions for this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateSessions.map(session => (
                  <div
                    key={session.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {session.subject}
                      </h4>
                      {session.goal && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Goal: {session.goal}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Created {format(session.createdAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400"
                      aria-label="Delete session"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
