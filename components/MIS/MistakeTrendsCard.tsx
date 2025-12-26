'use client'

import type { MistakeTrendSignal } from '@/lib/types'
import { getMISPrescription } from '@/lib/misPrescriptions'

interface MistakeTrendsCardProps {
  signals: MistakeTrendSignal[]
  onUseAsFocus?: (signal: MistakeTrendSignal) => void
}

export default function MistakeTrendsCard({ signals, onUseAsFocus }: MistakeTrendsCardProps) {
  if (!signals || signals.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rising Mistake Patterns</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
        Based on your most recent tests. Fix these early.
      </p>

      <div className="space-y-3 mt-4">
        {signals.slice(0, 3).map((s) => {
          const p = getMISPrescription(s)
          return (
            <div key={`${s.topic}:${s.mistakeType}`} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {s.subject}: {s.topic}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {labelMistakeType(s.mistakeType)} • recent {s.recentCount} vs prev {s.previousCount}
                  </div>
                </div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Rising
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                {p.title}
              </div>

              {onUseAsFocus && (
                <button
                  onClick={() => onUseAsFocus(s)}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Use as today’s 20 min
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        This is a lightweight signal — it improves as you log more tests.
      </div>
    </div>
  )
}

function labelMistakeType(t: MistakeTrendSignal['mistakeType']) {
  switch (t) {
    case 'concept':
      return 'Concept'
    case 'memory':
      return 'Memory'
    case 'calculation':
      return 'Calculation'
    case 'misread':
      return 'Misread'
    case 'time-pressure':
      return 'Time pressure'
    case 'strategy':
      return 'Strategy'
    default:
      return t
  }
}
