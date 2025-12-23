'use client'

import { useState } from 'react'
import { formatDuration } from '@/lib/timer'
import FocusStudyLogo from '@/components/FocusStudyLogo'

interface TimerFullScreenProps {
  sessionId: string
  elapsedMs: number
  running: boolean
  mode: string
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export default function TimerFullScreen({
  sessionId,
  elapsedMs,
  running,
  mode,
  onPause,
  onResume,
  onStop
}: TimerFullScreenProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  
  const handleStop = () => {
    setShowStopConfirm(true)
  }
  
  const confirmStop = () => {
    setShowStopConfirm(false)
    onStop()
  }
  
  const cancelStop = () => {
    setShowStopConfirm(false)
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
      <div className="flex gap-4 mb-8">
        {running ? (
          <button
            onClick={onPause}
            className="min-w-touch min-h-touch px-8 py-4 bg-warning hover:bg-yellow-500 text-gray-900 font-semibold rounded-2xl shadow-sm transition-all transform hover:scale-[1.02] active:scale-95 motion-reduce:transform-none"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={onResume}
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
