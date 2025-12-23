'use client'

import { useTimer } from '@/hooks/useTimer'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import TimerFullScreen from '@/components/Timer/TimerFullScreen'
import ReflectionModal from '@/components/ReflectionModal'
import PlannerModal from '@/components/PlannerModal'
import TodayList from '@/components/TodayList'
import AuthModal from '@/components/Auth/AuthModal'
import UserMenu from '@/components/Auth/UserMenu'
import GoalProgress from '@/components/GoalProgress'
import { db, shouldPromptForAccount } from '@/lib/dexieClient'
import { formatDuration, calculateActualDuration } from '@/lib/timer'
import { format } from 'date-fns'
import Link from 'next/link'

export default function Home() {
  const { state, start, pause, resume, stop, reconciliationMessage, dismissReconciliationMessage } = useTimer()
  const { user, syncInProgress, syncError, isSupabaseConfigured } = useAuth()
  const [showReflection, setShowReflection] = useState(false)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)
  const [completedDurationMs, setCompletedDurationMs] = useState(0)
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [showPlannerModal, setShowPlannerModal] = useState(false)
  const [plannedSessions, setPlannedSessions] = useState<any[]>([])
  const [plannedSubject, setPlannedSubject] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Load today's stats
  useEffect(() => {
    const loadTodayStats = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStart = today.getTime()

      const sessions = await db.sessions
        .where('startTs')
        .aboveOrEqual(todayStart)
        .toArray()

      const totalMs = sessions.reduce((sum, session) => {
        if (session.endTs) {
          return sum + calculateActualDuration(session)
        }
        return sum
      }, 0)

      setTodayMinutes(Math.floor(totalMs / 1000 / 60))
      
      // Load today's planned sessions
      const todayDate = format(today, 'yyyy-MM-dd')
      const planned = await db.plannedSessions
        .where('plannedDate')
        .equals(todayDate)
        .toArray()
      
      setPlannedSessions(planned)
    }

    loadTodayStats()
  }, [state.sessionId, showPlannerModal])

  // Check if should prompt for account
  useEffect(() => {
    const checkAccountPrompt = async () => {
      const shouldPrompt = await shouldPromptForAccount()
      setShowAccountPrompt(shouldPrompt)
    }

    if (showReflection) {
      checkAccountPrompt()
    }
  }, [showReflection])

  const handleStart = async () => {
    await start('flow')
    setPlannedSubject(null)
  }
  
  const handleStartPlanned = async (subject: string) => {
    setPlannedSubject(subject)
    await start('flow')
  }
  
  const handleDeletePlanned = async (id: string) => {
    await db.plannedSessions.delete(id)
    setPlannedSessions(prev => prev.filter(p => p.id !== id))
  }

  const handleStop = async () => {
    const sessionId = await stop()
    
    if (sessionId) {
      // Get session details
      const session = await db.sessions.get(sessionId)
      
      if (session && session.endTs) {
        const duration = calculateActualDuration(session)
        setCompletedSessionId(sessionId)
        setCompletedDurationMs(duration)
        setShowReflection(true)
      }
    }
  }

  const handleReflectionComplete = () => {
    setShowReflection(false)
    setCompletedSessionId(null)
  }

  const handleReflectionSkip = () => {
    setShowReflection(false)
    setCompletedSessionId(null)
  }

  const handleDismissAccountPrompt = () => {
    setShowAccountPrompt(false)
    // Mark as prompted in DB
    db.config.toArray().then(configs => {
      if (configs.length > 0) {
        db.config.update(configs[0].deviceId, { hasPromptedForAccount: true })
      }
    })
  }

  // Show timer fullscreen if active
  if (state.sessionId && !showReflection) {
    return (
      <>
        <TimerFullScreen
          sessionId={state.sessionId}
          elapsedMs={state.elapsedMs}
          running={state.running}
          mode={state.mode}
          onPause={pause}
          onResume={resume}
          onStop={handleStop}
        />
        
        {/* Reconciliation Banner */}
        {reconciliationMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 rounded-lg px-4 py-3 shadow-lg z-[60] max-w-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{reconciliationMessage}</p>
              <button
                onClick={dismissReconciliationMessage}
                className="ml-4 text-yellow-600 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  // Show reflection modal
  if (showReflection && completedSessionId) {
    return (
      <ReflectionModal
        sessionId={completedSessionId}
        durationMs={completedDurationMs}
        onComplete={handleReflectionComplete}
        onSkip={handleReflectionSkip}
        defaultSubject={plannedSubject}
      />
    )
  }
  
  // Show planner modal
  if (showPlannerModal) {
    return (
      <PlannerModal
        onClose={() => setShowPlannerModal(false)}
        onCreated={() => {
          setShowPlannerModal(false)
        }}
      />
    )
  }

  // Today screen
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                FocusFlow
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user && <UserMenu />}
              <Link
                href="/analytics"
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="View Analytics"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>
              <Link
                href="/settings"
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </header>

        {/* Sync Status Banner */}
        {syncInProgress && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
              Syncing your sessions...
            </p>
          </div>
        )}
        
        {syncError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              Sync failed: {syncError}
            </p>
          </div>
        )}

        {/* Goal Progress & Streaks */}
        <GoalProgress todayMinutes={todayMinutes} />

        {/* Today Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Today
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {todayMinutes} <span className="text-lg text-gray-500">min</span>
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Today's Planned Sessions */}
        <TodayList
          plannedSessions={plannedSessions}
          onStartSession={handleStartPlanned}
          onDelete={handleDeletePlanned}
        />

        {/* Big Start Button */}
        <div className="flex flex-col items-center justify-center py-12">
          <button
            onClick={handleStart}
            className="w-64 h-64 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-white shadow-2xl transform transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center group"
          >
            <svg className="w-20 h-20 mb-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-2xl font-bold">Start Studying</span>
          </button>
          <p className="mt-6 text-gray-500 dark:text-gray-400 text-center">
            Tap to begin a focus session
          </p>
          
          {/* Plan Session Button */}
          <button
            onClick={() => setShowPlannerModal(true)}
            className="mt-4 px-6 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors font-medium"
          >
            + Plan a session
          </button>
        </div>

        {/* Account Prompt (if applicable) */}
        {showAccountPrompt && !user && isSupabaseConfigured && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Protect your history & sync devices
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You've completed several sessions! Create a free account to sync across devices and never lose your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDismissAccountPrompt}
                className="flex-1 min-h-touch py-2 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Maybe later
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex-1 min-h-touch py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
              >
                Create account
              </button>
            </div>
          </div>
        )}
        
        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              setShowAuthModal(false)
              setShowAccountPrompt(false)
            }}
          />
        )}
      </div>
    </main>
  )
}
