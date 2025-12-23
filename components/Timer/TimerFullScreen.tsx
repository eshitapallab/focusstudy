'use client'

import { useState, useEffect } from 'react'
import { formatDuration } from '@/lib/timer'
import FocusStudyLogo from '@/components/FocusStudyLogo'
import { triggerHaptic, getHapticsEnabled } from '@/lib/haptics'

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
    <div className="fixed inset-0 bg-background dark:from-gray-900 dark:to-gray-800 z-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full max-w-md mb-12">
        <div className="flex items-center justify-center gap-2">
          <FocusStudyLogo size={28} color="#4F7CAC" />
          <span className="text-base text-text-secondary dark:text-gray-400 font-medium">
            {running ? 'Focus session in progress' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Timer Display with Progress Ring */}
      <div className="relative mb-16">
        <svg 
          className="transform -rotate-90 motion-reduce:transition-none" 
          width="320" 
          height="320"
          aria-hidden="true"
        >
          {/* Background circle - subtle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-surface dark:text-gray-700"
          />
          {/* Progress circle - brand primary */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="#4F7CAC"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 motion-reduce:transition-none"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(79, 124, 172, 0.3))'
            }}
          />
        </svg>
        
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-text-primary dark:text-white tabular-nums tracking-tight">
              {formatDuration(elapsedMs)}
            </div>
            <div className="text-base text-text-secondary dark:text-gray-400 mt-3 font-medium">
              {Math.floor(elapsedMs / 1000 / 60)} minutes
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 mb-8">
        {/* Primary controls */}
        <div className="flex gap-4">
          {running ? (
            <button
              onClick={handlePause}
              className="min-w-touch min-h-touch px-8 py-4 bg-warning hover:bg-yellow-500 text-gray-900 font-semibold rounded-2xl shadow-sm transition-all transform hover:scale-[1.02] active:scale-95 motion-reduce:transform-none"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="min-w-touch min-h-touch px-8 py-4 bg-primary-accent hover:bg-primary-accent-600 text-white font-semibold rounded-2xl shadow-sm transition-all transform hover:scale-[1.02] active:scale-95 motion-reduce:transform-none"
            >
              Resume
            </button>
          )}
          
          <button
            onClick={handleStop}
            className="min-w-touch min-h-touch px-8 py-4 bg-surface hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-text-primary dark:text-white font-semibold rounded-2xl shadow-sm transition-all transform hover:scale-[1.02] active:scale-95 motion-reduce:transform-none"
          >
            Stop
          </button>
        </div>
        
        {/* Distraction log button */}
        <button
          onClick={handleLogDistraction}
          className="relative px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-secondary dark:text-gray-400 text-sm font-medium rounded-xl transition-colors"
          title="Log a distraction"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Got distracted
            {distractionCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary text-white rounded-full">
                {distractionCount}
              </span>
            )}
          </span>
        </button>
        
        {/* Distraction feedback */}
        {showDistractionFeedback && (
          <div className="absolute bottom-32 text-sm text-text-secondary dark:text-gray-400 animate-fade-in">
            Logged — you're aware, that's the first step ✨
          </div>
        )}
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-3 text-text-primary dark:text-white">
              End session?
            </h3>
            <p className="text-text-secondary dark:text-gray-300 mb-8 text-base leading-relaxed">
              You've been studying for {Math.floor(elapsedMs / 1000 / 60)} minutes. Great work! Ready to wrap up and reflect?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelStop}
                className="flex-1 min-h-touch py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-text-primary dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={confirmStop}
                className="flex-1 min-h-touch py-3 px-4 bg-primary hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors"
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
