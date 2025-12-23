'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/dexieClient'
import { startOfDay, parseISO, differenceInDays } from 'date-fns'

interface GoalProgressProps {
  todayMinutes: number
}

export default function GoalProgress({ todayMinutes }: GoalProgressProps) {
  const [dailyGoal, setDailyGoal] = useState(120)
  const [showStreaks, setShowStreaks] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)

  useEffect(() => {
    loadGoalSettings()
    calculateStreak()
  }, [])

  const loadGoalSettings = async () => {
    const configs = await db.config.toArray()
    if (configs.length > 0) {
      setDailyGoal(configs[0].dailyGoalMinutes ?? 120)
      setShowStreaks(configs[0].showStreaks ?? true)
      setCurrentStreak(configs[0].currentStreak ?? 0)
      setLongestStreak(configs[0].longestStreak ?? 0)
    }
  }

  const calculateStreak = async () => {
    try {
      // Get all sessions ordered by date
      const allSessions = await db.sessions
        .where('endTs')
        .above(0)
        .toArray()

      if (allSessions.length === 0) return

    // Group sessions by date
    const sessionsByDate = new Map<string, number>()
    allSessions.forEach(session => {
      const date = startOfDay(session.startTs).toISOString()
      const durationMs = (session.endTs || session.startTs) - session.startTs
      const minutes = Math.floor(durationMs / (1000 * 60))
      sessionsByDate.set(date, (sessionsByDate.get(date) || 0) + minutes)
    })

    // Get dates with sessions meeting the minimum threshold (15 min)
    const activeDates = Array.from(sessionsByDate.entries())
      .filter(([_, minutes]) => minutes >= 15)
      .map(([date]) => date)
      .sort()
      .reverse()

    if (activeDates.length === 0) {
      setCurrentStreak(0)
      return
    }

    // Calculate current streak
    const today = startOfDay(new Date()).toISOString()
    let streak = 0
    let checkDate = today

    for (const activeDate of activeDates) {
      const daysDiff = differenceInDays(parseISO(checkDate), parseISO(activeDate))
      
      if (daysDiff === 0) {
        // Same day
        streak++
        checkDate = activeDate
      } else if (daysDiff === 1) {
        // Consecutive day
        streak++
        checkDate = activeDate
      } else {
        // Streak broken
        break
      }
    }

    // Calculate longest streak
    let longest = 0
    let tempStreak = 0
    let prevDate: Date | null = null

    for (const dateStr of activeDates.reverse()) {
      const currentDate = parseISO(dateStr)
      
      if (!prevDate) {
        tempStreak = 1
      } else {
        const daysDiff = differenceInDays(currentDate, prevDate)
        if (daysDiff === 1) {
          tempStreak++
        } else {
          longest = Math.max(longest, tempStreak)
          tempStreak = 1
        }
      }
      
      prevDate = currentDate
    }
    longest = Math.max(longest, tempStreak)

    setCurrentStreak(streak)
    setLongestStreak(longest)

    // Update in database
    const configs = await db.config.toArray()
    if (configs.length > 0) {
      await db.config.update(configs[0].deviceId, {
        currentStreak: streak,
        longestStreak: longest,
        lastSessionDate: today
      })
    }
    } catch (error) {
      console.error('Error calculating streak:', error)
      // Fail gracefully - don't show streak if calculation fails
      setCurrentStreak(0)
      setLongestStreak(0)
    }
  }

  const progressPercentage = Math.min((todayMinutes / dailyGoal) * 100, 100)
  const goalAchieved = todayMinutes >= dailyGoal

  if (!showStreaks && goalAchieved) {
    // Don't show anything if user doesn't want streaks and already achieved goal
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
      {/* Daily Goal Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Daily Goal
          </h3>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {todayMinutes} / {dailyGoal} min
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              goalAchieved
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-primary-500 to-primary-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {goalAchieved && (
          <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2 flex items-center gap-1">
            <span>🎉</span>
            Goal achieved! Great work!
          </p>
        )}
      </div>

      {/* Streak Display */}
      {showStreaks && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <span className="text-orange-500">🔥</span>
                {currentStreak}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Day Streak
              </p>
            </div>

            {longestStreak > currentStreak && (
              <div className="text-center pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <span>🏆</span>
                  {longestStreak}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Best Streak
                </p>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentStreak === 0 ? (
                'Start a new streak!'
              ) : currentStreak === 1 ? (
                'Keep it going tomorrow!'
              ) : (
                `${currentStreak} days of consistency!`
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
