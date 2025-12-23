'use client'

import { useTimer } from '@/hooks/useTimer'
import { useState, useEffect } from 'react'
import TimerFullScreen from '@/components/Timer/TimerFullScreen'
import ReflectionModal from '@/components/ReflectionModal'
import { db, shouldPromptForAccount } from '@/lib/dexieClient'
import { formatDuration, calculateActualDuration } from '@/lib/timer'
import { format } from 'date-fns'

export default function Home() {
  const { state, start, pause, resume, stop, reconciliationMessage, dismissReconciliationMessage } = useTimer()
  const [showReflection, setShowReflection] = useState(false)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)
  const [completedDurationMs, setCompletedDurationMs] = useState(0)
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const [todayMinutes, setTodayMinutes] = useState(0)

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
    }

    loadTodayStats()
  }, [state.sessionId])

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
      />
    )
  }

  // Today screen
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            FocusFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </header>

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
        </div>

        {/* Account Prompt (if applicable) */}
        {showAccountPrompt && (
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
                onClick={() => {/* TODO: Navigate to sign up */}}
                className="flex-1 min-h-touch py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
              >
                Create account
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
