'use client'

import { useState } from 'react'
import { formatDuration } from '@/lib/timer'

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

  // Calculate progress (for visual ring - maxes at 60 min)
  const maxMs = 60 * 60 * 1000
  const progress = Math.min((elapsedMs / maxMs) * 100, 100)
  const circumference = 2 * Math.PI * 140
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 z-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {mode} mode
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {running ? 'Running' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Timer Display with Progress Ring */}
      <div className="relative mb-12">
        <svg className="transform -rotate-90" width="320" height="320">
          {/* Background circle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary-500 transition-all duration-300"
          />
        </svg>
        
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatDuration(elapsedMs)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
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
            className="min-w-touch min-h-touch px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            className="min-w-touch min-h-touch px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            Resume
          </button>
        )}
        
        <button
          onClick={handleStop}
          className="min-w-touch min-h-touch px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          Stop
        </button>
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              End session?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You've been studying for {Math.floor(elapsedMs / 1000 / 60)} minutes. Ready to wrap up?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelStop}
                className="flex-1 min-h-touch py-3 px-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={confirmStop}
                className="flex-1 min-h-touch py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
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
