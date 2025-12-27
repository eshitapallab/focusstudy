'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/dexieClient'
import { calculateActualDuration } from '@/lib/timer'
import { format, subDays, startOfDay } from 'date-fns'
import { getStreakMessage } from '@/lib/motivationalQuotes'

export default function QuickStats() {
  const [stats, setStats] = useState({
    todayMinutes: 0,
    weekMinutes: 0,
    currentStreak: 0,
    totalSessions: 0,
    isLoading: true
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const now = new Date()
        const todayStart = startOfDay(now).getTime()
        const weekAgo = startOfDay(subDays(now, 7)).getTime()

        // Get all sessions
        const allSessions = await db.sessions
          .where('endTs')
          .above(0)
          .toArray()

        // Today's sessions
        const todaySessions = allSessions.filter(s => s.startTs >= todayStart)
        const todayMs = todaySessions.reduce((sum, s) => sum + calculateActualDuration(s), 0)

        // This week's sessions
        const weekSessions = allSessions.filter(s => s.startTs >= weekAgo)
        const weekMs = weekSessions.reduce((sum, s) => sum + calculateActualDuration(s), 0)

        // Calculate streak (consecutive days with at least one session)
        let streak = 0
        let checkDate = new Date()
        
        // Check if there's a session today, if not start from yesterday
        const hasSessionToday = todaySessions.length > 0
        if (!hasSessionToday) {
          checkDate = subDays(checkDate, 1)
        }
        
        while (true) {
          const dayStart = startOfDay(checkDate).getTime()
          const dayEnd = dayStart + 24 * 60 * 60 * 1000
          
          const dayHasSession = allSessions.some(s => s.startTs >= dayStart && s.startTs < dayEnd)
          
          if (dayHasSession) {
            streak++
            checkDate = subDays(checkDate, 1)
          } else {
            break
          }
          
          // Safety limit
          if (streak > 365) break
        }

        setStats({
          todayMinutes: Math.floor(todayMs / 1000 / 60),
          weekMinutes: Math.floor(weekMs / 1000 / 60),
          currentStreak: streak,
          totalSessions: allSessions.length,
          isLoading: false
        })
      } catch (error) {
        console.error('Error loading quick stats:', error)
        setStats(prev => ({ ...prev, isLoading: false }))
      }
    }

    loadStats()
  }, [])

  if (stats.isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
        <div className="animate-pulse flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/30"></div>
          <span className="text-gray-400">Loading stats...</span>
        </div>
      </div>
    )
  }

  // Don't show if no data yet
  if (stats.totalSessions === 0) {
    return null
  }

  const streakMessage = getStreakMessage(stats.currentStreak)

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/50 dark:border-gray-700/50 mt-4 sm:mt-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">📈 Your Progress</h3>
        <Link href="/analytics" className="text-xs sm:text-sm text-primary hover:text-primary-600 font-medium">
          More →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {/* Today */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center">
          <div className="text-xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
            {stats.todayMinutes}
          </div>
          <div className="text-[10px] sm:text-xs text-primary-600/70 dark:text-primary-400/70 font-medium mt-0.5 sm:mt-1">
            min today
          </div>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/30 dark:to-accent-800/30 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center">
          <div className="text-xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400">
            {Math.floor(stats.weekMinutes / 60)}
            <span className="text-sm sm:text-lg">h</span>
          </div>
          <div className="text-[10px] sm:text-xs text-accent-600/70 dark:text-accent-400/70 font-medium mt-0.5 sm:mt-1">
            week
          </div>
        </div>

        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/30 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center">
          <div className="text-xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
            {stats.currentStreak}<span className="text-sm sm:text-lg">🔥</span>
          </div>
          <div className="text-[10px] sm:text-xs text-orange-600/70 dark:text-orange-400/70 font-medium mt-0.5 sm:mt-1">
            streak
          </div>
        </div>

        {/* Total Sessions */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-800/30 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center">
          <div className="text-xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.totalSessions}
          </div>
          <div className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium mt-0.5 sm:mt-1">
            total
          </div>
        </div>
      </div>

      {/* Streak Message */}
      {stats.currentStreak > 0 && (
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{streakMessage}</p>
        </div>
      )}

      {/* Quick Action */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/focus"
          className="flex items-center justify-center gap-2 w-full py-3 sm:py-3.5 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] sm:hover:scale-[1.02] min-h-[48px]"
        >
          <span className="text-base sm:text-lg">⏱️</span>
          <span className="text-sm sm:text-base">Start Focus Session</span>
        </Link>
      </div>
    </div>
  )
}
