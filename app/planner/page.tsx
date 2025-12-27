'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isBefore, startOfDay } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { db, PlannedSession } from '@/lib/dexieClient'
import { MicroAction } from '@/lib/types'
import { getMicroActionsForDateRange, getStudyUser } from '@/lib/supabaseStudyTrack'
import { EXAM_SYLLABI } from '@/lib/examSyllabi'
import AppNav from '@/components/Navigation/AppNav'
import StatusBadge from '@/components/StatusBadge'
import SessionActions from '@/components/SessionActions'
import MicroActionActions from '@/components/MicroActionActions'
import PlannerModal from '@/components/PlannerModal'

export default function PlannerCalendarPage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([])
  const [focusActions, setFocusActions] = useState<MicroAction[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalDate, setAddModalDate] = useState<string | undefined>(undefined)
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [userDefaultExam, setUserDefaultExam] = useState<string>('')
  const examList = Object.keys(EXAM_SYLLABI)

  // Load user's default exam
  useEffect(() => {
    const loadUserExam = async () => {
      if (!user?.id) return
      const studyUser = await getStudyUser(user.id)
      if (studyUser?.exam) {
        setSelectedExam(studyUser.exam)
        setUserDefaultExam(studyUser.exam)
      }
    }
    loadUserExam()
  }, [user?.id])

  useEffect(() => {
    loadPlannedSessions()
    loadFocusActionsForMonth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, user?.id])

  const loadPlannedSessions = async () => {
    const sessions = await db.plannedSessions.toArray()
    setPlannedSessions(sessions)
  }

  const loadFocusActionsForMonth = async () => {
    if (!user?.id) {
      setFocusActions([])
      return
    }

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const startDate = format(calendarStart, 'yyyy-MM-dd')
    const endDate = format(calendarEnd, 'yyyy-MM-dd')

    const actions = await getMicroActionsForDateRange(user.id, startDate, endDate)

    // Keep calendar calm: only show actions that are explicitly locked or scheduled ahead.
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const calendarActions = actions.filter(a => Boolean(a.locked) || a.date > todayStr)
    setFocusActions(calendarActions)
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

  const getFocusActionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return focusActions.filter(a => a.date === dateStr)
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

  // Handle adding task for a specific date
  const handleAddTaskForDate = (date: Date) => {
    setAddModalDate(format(date, 'yyyy-MM-dd'))
    setShowAddModal(true)
  }

  // Handle adding task (general)
  const handleAddTask = () => {
    setAddModalDate(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined)
    setShowAddModal(true)
  }

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : []
  const selectedDateFocusActions = selectedDate ? getFocusActionsForDate(selectedDate) : []

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 pb-44 md:pb-20">
      <AppNav showAuthButton={true} />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary dark:text-white mb-2">
                Session Planner
              </h1>
              <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">
                Plan your study sessions ahead
              </p>
            </div>
            
            {/* Exam Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                📚 Exam:
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all min-w-[180px]"
              >
                <option value="">Select exam...</option>
                {examList.map(exam => (
                  <option key={exam} value={exam}>
                    {exam} {exam === userDefaultExam ? '(Your exam)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
              const focusForDay = getFocusActionsForDate(day)
              const isToday = isSameDay(day, new Date())
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isPast = isBefore(day, startOfDay(new Date())) && !isToday

              const dayItems = [
                ...focusForDay.map(a => ({
                  kind: 'focus' as const,
                  id: a.id,
                  label: a.relatedSubjects && a.relatedSubjects.length > 0 ? a.relatedSubjects[0] : 'Focus'
                })),
                ...sessionsForDay.map(s => ({
                  kind: 'planned' as const,
                  id: s.id,
                  session: s
                }))
              ]

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[80px] p-2 rounded-lg border-2 transition-all text-left cursor-pointer relative group
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
                  <div className="flex items-center justify-between mb-1">
                    <div className={`
                      text-sm font-semibold
                      ${isToday 
                        ? 'w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center' 
                        : isCurrentMonth
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-600'
                      }
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Add button - visible on hover for future/today dates */}
                    {!isPast && isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddTaskForDate(day)
                        }}
                        className="w-5 h-5 rounded-full bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Add task"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {dayItems.length > 0 && (
                    <div className="space-y-1">
                      {dayItems.slice(0, 2).map(item => {
                        if (item.kind === 'focus') {
                          return (
                            <div
                              key={item.id}
                              className="text-xs bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-300 rounded px-1 py-0.5 truncate"
                            >
                              🎯 {item.label}
                            </div>
                          )
                        }

                        const session = item.session
                        const statusColor = 
                          session.status === 'completed' ? 'bg-primary-accent/20 dark:bg-primary-accent/30 text-primary-accent dark:text-primary-accent-300' :
                          session.status === 'cancelled' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                          session.status === 'rescheduled' ? 'bg-warning/20 dark:bg-warning/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-300'

                        return (
                          <div
                            key={session.id}
                            className={`text-xs ${statusColor} rounded px-1 py-0.5 truncate`}
                          >
                            {session.subject}
                          </div>
                        )
                      })}
                      {dayItems.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{dayItems.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
              <div className="flex items-center gap-2">
                {/* Add Task button */}
                {!isBefore(selectedDate, startOfDay(new Date())) && (
                  <button
                    onClick={handleAddTask}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-primary font-medium text-sm rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Task
                  </button>
                )}
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {selectedDateSessions.length === 0 && selectedDateFocusActions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No planned sessions for this date
                </p>
                {!isBefore(selectedDate, startOfDay(new Date())) && (
                  <button
                    onClick={handleAddTask}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Plan a Study Session
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateFocusActions.map(action => (
                  <div
                    key={action.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-primary dark:text-primary-300 mb-2">
                          🎯 Focus action {action.locked ? '(locked)' : ''}
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {action.task}
                        </div>
                        {action.relatedSubjects && action.relatedSubjects.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Subject: {action.relatedSubjects[0]}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {action.durationMinutes || 20} min
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                      <MicroActionActions
                        action={action}
                        onUpdate={loadFocusActionsForMonth}
                      />
                    </div>
                  </div>
                ))}
                {selectedDateSessions.map(session => (
                  <div
                    key={session.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {session.subject}
                          </h4>
                          <StatusBadge status={session.status} />
                        </div>
                        {session.goal && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Goal: {session.goal}
                          </p>
                        )}
                        {session.rescheduledTo && (
                          <p className="text-sm text-warning dark:text-yellow-300">
                            Rescheduled to: {format(parseISO(session.rescheduledTo), 'MMM d, yyyy')}
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
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <SessionActions 
                        session={session} 
                        onUpdate={loadPlannedSessions}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <PlannerModal
          onClose={() => {
            setShowAddModal(false)
            setAddModalDate(undefined)
          }}
          onCreated={() => {
            loadPlannedSessions()
          }}
          initialDate={addModalDate}
          selectedExam={selectedExam || undefined}
        />
      )}
    </main>
  )
}
