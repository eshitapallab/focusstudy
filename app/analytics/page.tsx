'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db } from '@/lib/dexieClient'
import { calculateActualDuration } from '@/lib/timer'
import { useAuth } from '@/hooks/useAuth'
import AppNav from '@/components/Navigation/AppNav'
import FocusStudyLogo from '@/components/FocusStudyLogo'
import WeekTrend from '@/components/Analytics/WeekTrend'
import Heatmap from '@/components/Analytics/Heatmap'
import SubjectBreakdown from '@/components/Analytics/SubjectBreakdown'
import ComparisonMode from '@/components/ComparisonMode'
import AchievementBadges from '@/components/AchievementBadges'

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsWithMetadata, setSessionsWithMetadata] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all completed sessions
        const allSessions = await db.sessions
          .where('endTs')
          .above(0)
          .reverse()
          .toArray()
        
        setSessions(allSessions)
        
        // Load sessions with metadata
        const withMetadata = await Promise.all(
          allSessions.map(async (session) => {
            const metadata = await db.sessionMetadata
              .where('sessionId')
              .equals(session.id)
              .first()
            
            return {
              session,
              metadata
            }
          })
        )
        
        setSessionsWithMetadata(withMetadata)
      } catch (error) {
        console.error('Failed to load analytics data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  if (loading) {
    return (
      <main className="min-h-screen bg-background dark:from-gray-900 dark:to-gray-800 pb-44 md:pb-20">
        <AppNav />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary dark:text-gray-400">Loading analytics...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }
  
  // Calculate overall stats
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, session) => {
    return sum + Math.floor(calculateActualDuration(session) / 1000 / 60)
  }, 0)
  const labeledSessions = sessionsWithMetadata.filter(s => s.metadata?.subject).length

  return (
    <main className="min-h-screen bg-background dark:from-gray-900 dark:to-gray-800 pb-44 md:pb-20">
      <AppNav showAuthButton={true} />
      
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-text-primary dark:text-white mb-1 md:mb-2">
            📊 Analytics
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-xs md:text-base">
            Your study patterns and insights
          </p>
        </div>

        {/* No data state */}
        {totalSessions === 0 ? (
          <div className="bg-surface dark:bg-gray-800 rounded-2xl p-12 shadow-sm text-center">
            <div className="w-20 h-20 bg-background dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <FocusStudyLogo size={48} color="#4F7CAC" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary dark:text-white mb-2">
              Ready to start your journey?
            </h2>
            <p className="text-text-secondary dark:text-gray-400 mb-6 text-base">
              Complete your first study session to see your progress here
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
            >
              Start Studying
            </Link>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Summary Cards - 2 on mobile, 3 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              <div className="bg-surface dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <p className="text-xs md:text-sm text-text-secondary dark:text-gray-400 uppercase tracking-wide font-medium">
                    Total Time
                  </p>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <FocusStudyLogo size={16} color="#4F7CAC" />
                  </div>
                </div>
                <p className="text-xl md:text-3xl font-bold text-text-primary dark:text-white">
                  {Math.floor(totalMinutes / 60)}
                  <span className="text-sm md:text-lg text-text-secondary">h </span>
                  {totalMinutes % 60}
                  <span className="text-sm md:text-lg text-text-secondary">m</span>
                </p>
                <p className="text-xs md:text-sm text-text-secondary dark:text-gray-400 mt-0.5 md:mt-1">
                  All time
                </p>
              </div>

              <div className="bg-surface dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <p className="text-xs md:text-sm text-text-secondary dark:text-gray-400 uppercase tracking-wide font-medium">
                    Sessions
                  </p>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-accent/10 dark:bg-primary-accent-900 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-primary-accent dark:text-primary-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl md:text-3xl font-bold text-text-primary dark:text-white">
                  {totalSessions}
                </p>
                <p className="text-xs md:text-sm text-text-secondary dark:text-gray-400 mt-0.5 md:mt-1">
                  {labeledSessions} labeled
                </p>
              </div>

              <div className="col-span-2 md:col-span-1 bg-surface dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <p className="text-xs md:text-sm text-text-secondary dark:text-gray-400 uppercase tracking-wide font-medium">
                    Average
                  </p>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-primary dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <p className="text-xl md:text-3xl font-bold text-text-primary dark:text-white">
                  {Math.round(totalMinutes / totalSessions)}
                  <span className="text-sm md:text-lg text-text-secondary"> min</span>
                </p>
                <p className="text-xs md:text-sm text-text-secondary dark:text-gray-400 mt-0.5 md:mt-1">
                  Per session
                </p>
              </div>
            </div>

            {/* Charts - stack on mobile */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              <WeekTrend sessions={sessions} />
              <SubjectBreakdown sessionsWithMetadata={sessionsWithMetadata} />
            </div>
            
            {/* Achievements */}
            <AchievementBadges />
            
            {/* Comparison Mode */}
            <ComparisonMode />

            {/* Heatmap */}
            <Heatmap sessions={sessions} months={3} />
          </div>
        )}
      </div>
    </main>
  )
}
