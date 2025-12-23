'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/dexieClient'
import { calculateActualDuration } from '@/lib/timer'
import WeekTrend from '@/components/Analytics/WeekTrend'
import Heatmap from '@/components/Analytics/Heatmap'
import SubjectBreakdown from '@/components/Analytics/SubjectBreakdown'
import Link from 'next/link'

export default function AnalyticsPage() {
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
      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
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
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your study patterns and insights
              </p>
            </div>
          </div>
        </div>

        {/* No data state */}
        {totalSessions === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No study sessions yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Complete your first study session to see analytics
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
            >
              Start Studying
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Total Time
                  </p>
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(totalMinutes / 60)}
                  <span className="text-lg text-gray-500">h </span>
                  {totalMinutes % 60}
                  <span className="text-lg text-gray-500">m</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  All time
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Sessions
                  </p>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalSessions}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {labeledSessions} labeled
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Average
                  </p>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round(totalMinutes / totalSessions)}
                  <span className="text-lg text-gray-500"> min</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Per session
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeekTrend sessions={sessions} />
              <SubjectBreakdown sessionsWithMetadata={sessionsWithMetadata} />
            </div>

            {/* Heatmap */}
            <Heatmap sessions={sessions} months={3} />
          </div>
        )}
      </div>
    </main>
  )
}
