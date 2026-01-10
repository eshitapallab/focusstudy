'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatDuration } from '@/lib/timer'
import FocusStudyLogo from '@/components/FocusStudyLogo'
import { triggerHaptic, getHapticsEnabled } from '@/lib/haptics'
import { getRandomQuote } from '@/lib/motivationalQuotes'
import AmbientSoundSelector from '@/components/AmbientSoundSelector'
import NetworkStatus, { NetworkStatusBadge } from '@/components/NetworkStatus'

interface TimerFullScreenProps {
  sessionId: string
  elapsedMs: number
  running: boolean
  mode: string
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onLogDistraction: () => void
  distractionCount: number
}

export default function TimerFullScreen({
  sessionId,
  elapsedMs,
  running,
  mode,
  onPause,
  onResume,
  onStop,
  onLogDistraction,
  distractionCount
}: TimerFullScreenProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [hapticsEnabled, setHapticsEnabled] = useState(true)
  const [showDistractionFeedback, setShowDistractionFeedback] = useState(false)
  
  // Get a random quote that stays consistent during session
  const motivationalQuote = useMemo(() => getRandomQuote('focus'), [sessionId])
  
  useEffect(() => {
    // Load haptics setting
    getHapticsEnabled().then(setHapticsEnabled)
  }, [])
  
  const handleStop = () => {
    setShowStopConfirm(true)
  }
  
  const confirmStop = async () => {
    setShowStopConfirm(false)
    await triggerHaptic('success', hapticsEnabled)
    onStop()
  }
  
  const cancelStop = () => {
    setShowStopConfirm(false)
  }
  
  const handlePause = async () => {
    await triggerHaptic('pause', hapticsEnabled)
    onPause()
  }
  
  const handleResume = async () => {
    await triggerHaptic('start', hapticsEnabled)
    onResume()
  }
  
  const handleLogDistraction = async () => {
    await triggerHaptic('distraction', hapticsEnabled)
    onLogDistraction()
    
    // Show brief feedback
    setShowDistractionFeedback(true)
    setTimeout(() => setShowDistractionFeedback(false), 1500)
  }

  // Calculate progress (for visual ring - maxes at 90 min for breathing room)
  const maxMs = 90 * 60 * 1000
  const progress = Math.min((elapsedMs / maxMs) * 100, 100)
  const circumference = 2 * Math.PI * 140
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 z-50 flex flex-col items-center justify-center p-4 sm:p-6 safe-area-inset">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-gradient-to-br from-primary-200/40 to-accent-200/40 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-gradient-to-tr from-accent-200/40 to-primary-200/40 dark:from-accent-900/20 dark:to-primary-900/20 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <div className="relative w-full max-w-md mb-4 sm:mb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <div className="relative">
            <FocusStudyLogo size={28} color="#6366F1" />
            {running && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-base sm:text-lg text-text-secondary dark:text-gray-300 font-medium">
            {running ? 'Focus session in progress' : 'Session paused'}
          </span>
        </div>
        
        {/* Motivational Quote */}
        <div className="mt-3 sm:mt-4 text-center px-2 sm:px-4">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic line-clamp-2">
            "{motivationalQuote.text}"
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
            — {motivationalQuote.author}
          </p>
        </div>
      </div>

      {/* Timer Display with Progress Ring */}
      <div className="relative mb-8 sm:mb-16">
        <svg 
          className="transform -rotate-90 motion-reduce:transition-none w-64 h-64 sm:w-80 sm:h-80" 
          viewBox="0 0 320 320"
          aria-hidden="true"
        >
          {/* Background circle - subtle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-100 dark:text-gray-800"
          />
          {/* Progress circle - gradient effect */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="url(#progressGradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 motion-reduce:transition-none"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))'
            }}
          />
        </svg>
        
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent tabular-nums tracking-tight">
              {formatDuration(elapsedMs)}
            </div>
            <div className="text-sm sm:text-lg text-text-secondary dark:text-gray-400 mt-2 sm:mt-3 font-medium">
              {Math.floor(elapsedMs / 1000 / 60)} minutes focused
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Primary controls */}
        <div className="flex gap-3 sm:gap-4">
          {running ? (
            <button
              onClick={handlePause}
              className="min-h-[52px] px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 motion-reduce:transform-none text-sm sm:text-base"
            >
              ⏸️ Pause
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="min-h-[52px] px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-success to-emerald-400 hover:from-success-600 hover:to-emerald-500 text-white font-semibold rounded-2xl shadow-lg shadow-success/25 transition-all active:scale-95 motion-reduce:transform-none text-sm sm:text-base"
            >
              ▶️ Resume
            </button>
          )}
          
          <button
            onClick={handleStop}
            className="min-h-[52px] px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-primary dark:text-white font-semibold rounded-2xl shadow-lg transition-all active:scale-95 motion-reduce:transform-none border border-gray-200 dark:border-gray-700 text-sm sm:text-base"
          >
            ⏹️ Stop
          </button>
        </div>
        
        {/* Distraction log button */}
        <button
          onClick={handleLogDistraction}
          className="relative px-5 sm:px-6 py-2.5 sm:py-3 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-sm text-text-secondary dark:text-gray-400 text-xs sm:text-sm font-medium rounded-xl transition-all border border-gray-200/50 dark:border-gray-700/50 shadow-sm min-h-[44px]"
          title="Log a distraction"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Got distracted
            {distractionCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-gradient-to-r from-primary to-accent text-white rounded-full">
                {distractionCount}
              </span>
            )}
          </span>
        </button>
        
        {/* Distraction feedback */}
        {showDistractionFeedback && (
          <div className="absolute -bottom-8 text-xs sm:text-sm text-text-secondary dark:text-gray-400 animate-fade-in">
            Logged — awareness is the first step ✨
          </div>
        )}
      </div>

      {/* Ambient Sound Control - Bottom positioned for mobile */}
      <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 safe-area-mb">
        <AmbientSoundSelector compact />
      </div>

      {/* Network Status Indicator */}
      <NetworkStatus />

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full sm:max-w-sm shadow-2xl border-t sm:border border-gray-100 dark:border-gray-700 safe-area-pb">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 rounded-full mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">🎉</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-white">
                End session?
              </h3>
            </div>
            <p className="text-text-secondary dark:text-gray-300 mb-6 sm:mb-8 text-center text-sm sm:text-base leading-relaxed">
              You've been focused for <span className="font-semibold text-primary">{Math.floor(elapsedMs / 1000 / 60)} minutes</span>. Great work! Ready to wrap up?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelStop}
                className="flex-1 min-h-[48px] py-3 px-4 bg-gray-100 dark:bg-gray-700 text-text-primary dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
              >
                Keep going
              </button>
              <button
                onClick={confirmStop}
                className="flex-1 min-h-[48px] py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-95"
              >
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
