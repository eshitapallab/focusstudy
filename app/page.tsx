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
import FocusStudyLogo from '@/components/FocusStudyLogo'
import SmartNotificationsInit from '@/components/SmartNotificationsInit'
import { db, shouldPromptForAccount } from '@/lib/dexieClient'
import { formatDuration, calculateActualDuration } from '@/lib/timer'
import { format } from 'date-fns'
import Link from 'next/link'

export default function Home() {
  const { state, start, pause, resume, stop, logDistraction, getDistractionCount, reconciliationMessage, dismissReconciliationMessage } = useTimer()
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
  const [distractionCount, setDistractionCount] = useState(0)
  const [showAuthSuccess, setShowAuthSuccess] = useState(false)

  // Check for auth success from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') {
      setShowAuthSuccess(true)
      // Clear URL parameter
      window.history.replaceState({}, '', '/')
      // Auto-hide after 5 seconds
      setTimeout(() => setShowAuthSuccess(false), 5000)
    }
  }, [])

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
    setDistractionCount(0)
  }
  
  const handleStartPlanned = async (subject: string) => {
    setPlannedSubject(subject)
    await start('flow')
    setDistractionCount(0)
  }
  
  const handleLogDistraction = async () => {
    await logDistraction()
    setDistractionCount(getDistractionCount())
  }
  
  const handleDeletePlanned = async (id: string) => {
    await db.plannedSessions.delete(id)
    setPlannedSessions(prev => prev.filter(p => p.id !== id))
  }
  
  const handleUpdatePlanned = async () => {
    // Reload today's planned sessions after status update
    const today = new Date()
    const todayDate = format(today, 'yyyy-MM-dd')
    const planned = await db.plannedSessions
      .where('plannedDate')
      .equals(todayDate)
      .toArray()
    
    setPlannedSessions(planned)
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
          onLogDistraction={handleLogDistraction}
          distractionCount={distractionCount}
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/40 to-accent-200/40 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-200/40 to-primary-200/40 dark:from-accent-900/20 dark:to-primary-900/20 rounded-full blur-3xl" />
      </div>

      {/* Initialize smart notifications */}
      <SmartNotificationsInit />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl relative">
        {/* Header */}
        <header className="mb-8">
          {/* Top row: Branding and Sign In */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-40" />
                <div className="relative bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                  <FocusStudyLogo size={32} color="#6366F1" className="flex-shrink-0" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent whitespace-nowrap">
                  FocusStudy
                </h1>
                <p className="text-xs text-text-secondary dark:text-gray-400 whitespace-nowrap">
                  {format(new Date(), 'EEEE, MMM d')}
                </p>
              </div>
            </div>
            {!user && (
              <Link
                href="/auth"
                className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 flex-shrink-0 transform hover:scale-105 active:scale-95"
              >
                Sign In ✨
              </Link>
            )}
          </div>
          
          {/* Bottom row: Navigation icons and User Menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-white/50 dark:border-gray-700/50">
              <Link
                href="/planner"
                className="min-w-touch min-h-touch p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
                aria-label="View Calendar"
              >
                <svg className="w-5 h-5 text-text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>
              <Link
                href="/analytics"
                className="min-w-touch min-h-touch p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
                aria-label="View Analytics"
              >
                <svg className="w-5 h-5 text-text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>
              <Link
                href="/settings"
                className="min-w-touch min-h-touch p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
                aria-label="Settings"
              >
                <svg className="w-5 h-5 text-text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
            {user && <UserMenu />}
          </div>
        </header>

        {/* Sync Status Banner */}
        {syncInProgress && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-4 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            <p className="text-primary dark:text-primary-300 text-sm font-medium">
              Syncing your sessions...
            </p>
          </div>
        )}
        
        {syncError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              ⚠️ Sync failed: {syncError}
            </p>
          </div>
        )}

        {/* Auth Success Banner */}
        {showAuthSuccess && user && (
          <div className="bg-gradient-to-r from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20 border border-success-200/50 dark:border-success-800/50 rounded-2xl p-4 mb-6 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-success-700 dark:text-success-200 text-sm font-semibold">
                  You're signed in! 🎉
                </p>
                <p className="text-success-600 dark:text-success-300 text-xs">
                  Your sessions sync across all devices
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthSuccess(false)}
              className="text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Goal Progress & Streaks */}
        <GoalProgress todayMinutes={todayMinutes} />

        {/* Today Stats */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1 font-medium">
                📅 Today
              </p>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {todayMinutes} <span className="text-lg text-text-secondary font-normal">min</span>
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-30 animate-pulse-slow" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 flex items-center justify-center">
                <FocusStudyLogo size={32} color="#6366F1" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Today's Planned Sessions */}
        <TodayList
          plannedSessions={plannedSessions}
          onStartSession={handleStartPlanned}
          onDelete={handleDeletePlanned}
          onUpdate={handleUpdatePlanned}
        />

        {/* Big Start Button */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            {/* Glow effect behind button */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-accent rounded-full blur-2xl opacity-40 animate-pulse-slow scale-110" />
            <button
              onClick={handleStart}
              className="relative w-56 h-56 rounded-full bg-gradient-to-br from-primary via-purple-500 to-accent hover:from-primary-600 hover:via-purple-600 hover:to-accent-600 text-white shadow-2xl transform transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center group motion-reduce:transform-none"
            >
              {/* Inner highlight */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              <FocusStudyLogo size={64} color="white" className="mb-3 opacity-95 relative z-10" />
              <span className="text-lg font-semibold relative z-10">Start Studying</span>
            </button>
          </div>
          <p className="mt-8 text-text-secondary dark:text-gray-400 text-center text-base">
            ✨ Begin a calm focus session
          </p>
          
          {/* Plan Session Button */}
          <button
            onClick={() => setShowPlannerModal(true)}
            className="mt-6 min-h-touch px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary/20 dark:border-primary/30 text-primary dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-2xl transition-all font-semibold shadow-sm hover:shadow-md"
          >
            + Plan a session
          </button>
        </div>

        {/* Account Prompt (if applicable) */}
        {showAccountPrompt && !user && isSupabaseConfigured && (
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 border-2 border-primary-200/50 dark:border-primary-700/50 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔐</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Protect your progress
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You've completed several sessions! Create a free account to sync across devices and never lose your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDismissAccountPrompt}
                className="flex-1 min-h-touch py-3 px-4 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
              >
                Maybe later
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex-1 min-h-touch py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25"
              >
                Create account ✨
              </button>
            </div>
          </div>
        )}
        
        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            onClose={() => {
              setShowAuthModal(false)
              setShowAccountPrompt(false)
            }}
          />
        )}
      </div>
    </main>
  )
}
