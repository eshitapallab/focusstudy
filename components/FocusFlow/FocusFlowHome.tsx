'use client'

import { useTimer } from '@/hooks/useTimer'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import TimerFullScreen from '@/components/Timer/TimerFullScreen'
import ReflectionModal from '@/components/ReflectionModal'
import PlannerModal from '@/components/PlannerModal'
import TodayList from '@/components/TodayList'
import AuthModal from '@/components/Auth/AuthModal'
import GoalProgress from '@/components/GoalProgress'
import AppNav from '@/components/Navigation/AppNav'
import FocusStudyLogo from '@/components/FocusStudyLogo'
import SmartNotificationsInit from '@/components/SmartNotificationsInit'
import { db, shouldPromptForAccount } from '@/lib/dexieClient'
import { calculateActualDuration } from '@/lib/timer'
import { format } from 'date-fns'

export default function FocusFlowHome() {
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
      window.history.replaceState({}, '', '/focus')
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
        <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-primary-200/40 to-accent-200/40 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-accent-200/40 to-primary-200/40 dark:from-accent-900/20 dark:to-primary-900/20 rounded-full blur-3xl" />
      </div>

      {/* Initialize smart notifications */}
      <SmartNotificationsInit />

      <AppNav user={user} showAuthButton={true} />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl relative pb-40 safe-area-pb">
        {/* Date display */}
        <div className="text-center mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Sync Status Banner */}
        {syncInProgress && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-primary border-t-transparent"></div>
            <p className="text-primary dark:text-primary-300 text-xs sm:text-sm font-medium">
              Syncing your sessions...
            </p>
          </div>
        )}

        {syncError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm">
            <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium">
              ⚠️ Sync failed: {syncError}
            </p>
          </div>
        )}

        {/* Auth Success Banner */}
        {showAuthSuccess && user && (
          <div className="bg-gradient-to-r from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20 border border-success-200/50 dark:border-success-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-success-700 dark:text-success-200 text-xs sm:text-sm font-semibold">
                  You're signed in! 🎉
                </p>
                <p className="text-success-600 dark:text-success-300 text-[10px] sm:text-xs">
                  Sessions sync across devices
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthSuccess(false)}
              className="text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-200 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}

        {/* Goal Progress & Streaks */}
        <GoalProgress todayMinutes={todayMinutes} />

        {/* Today Stats */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/50 dark:border-gray-700/50 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1 font-medium">
                📅 Today
              </p>
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {todayMinutes} <span className="text-base sm:text-lg text-text-secondary font-normal">min</span>
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-30 animate-pulse-slow" />
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 flex items-center justify-center">
                <FocusStudyLogo size={28} color="#6366F1" />
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
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className="relative">
            {/* Glow effect behind button */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-accent rounded-full blur-2xl opacity-40 animate-pulse-slow scale-110" />
            <button
              onClick={handleStart}
              className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-primary via-purple-500 to-accent hover:from-primary-600 hover:via-purple-600 hover:to-accent-600 text-white shadow-2xl transform transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center group motion-reduce:transform-none"
            >
              {/* Inner highlight */}
              <div className="absolute inset-3 sm:inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              <FocusStudyLogo size={48} color="white" className="mb-2 sm:mb-3 opacity-95 relative z-10" />
              <span className="text-base sm:text-lg font-semibold relative z-10">Start Studying</span>
            </button>
          </div>
          <p className="mt-6 sm:mt-8 text-text-secondary dark:text-gray-400 text-center text-sm sm:text-base">
            ✨ Begin a calm focus session
          </p>

          {/* Plan Session Button */}
          <button
            onClick={() => setShowPlannerModal(true)}
            className="mt-4 sm:mt-6 min-h-[48px] px-5 sm:px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary/20 dark:border-primary/30 text-primary dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl sm:rounded-2xl transition-all font-semibold shadow-sm hover:shadow-md text-sm sm:text-base active:scale-95"
          >
            + Plan a session
          </button>
        </div>

        {/* Account Prompt (if applicable) */}
        {showAccountPrompt && !user && isSupabaseConfigured && (
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 border-2 border-primary-200/50 dark:border-primary-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <span className="text-xl sm:text-2xl">🔐</span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Protect your progress
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
              Create a free account to sync across devices and never lose your data.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleDismissAccountPrompt}
                className="flex-1 min-h-[48px] py-2.5 sm:py-3 px-3 sm:px-4 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all text-sm sm:text-base active:scale-95"
              >
                Later
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex-1 min-h-[48px] py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 text-sm sm:text-base active:scale-95"
              >
                Create ✨
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
