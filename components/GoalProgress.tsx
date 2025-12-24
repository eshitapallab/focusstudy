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
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50 mb-8">
      {/* Daily Goal Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
            🎯 Daily Goal
          </h3>
          <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {todayMinutes} / {dailyGoal} min
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              goalAchieved
                ? 'bg-gradient-to-r from-success via-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-primary via-purple-500 to-accent'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '2s' }} />
        </div>

        {goalAchieved && (
          <div className="mt-3 p-3 bg-gradient-to-r from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20 rounded-xl border border-success-200/50 dark:border-success-800/50">
            <p className="text-sm text-success-700 dark:text-success-300 font-semibold flex items-center gap-2">
              <span className="text-lg">🎉</span>
              Goal achieved! Amazing work!
            </p>
          </div>
        )}
      </div>

      {/* Streak Display */}
      {showStreaks && (
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent flex items-center gap-1">
                <span className="text-orange-500 animate-pulse-slow">🔥</span>
                {currentStreak}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Day Streak
              </p>
            </div>

            {longestStreak > currentStreak && (
              <div className="text-center pl-6 border-l border-gray-200 dark:border-gray-700/50">
                <div className="text-3xl font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="text-yellow-500">🏆</span>
                  {longestStreak}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  Best Streak
                </p>
              </div>
            )}
          </div>

          <div className="text-right max-w-[140px]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {currentStreak === 0 ? (
                '✨ Start a new streak!'
              ) : currentStreak === 1 ? (
                '💪 Keep it going tomorrow!'
              ) : (
                `🌟 ${currentStreak} days of consistency!`
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
