'use client'

import type { MarkLeakEstimate } from '@/lib/types'

interface MarkLeaksCardProps {
  leaks: MarkLeakEstimate[]
}

export default function MarkLeaksCard({ leaks }: MarkLeaksCardProps) {
  if (!leaks || leaks.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Biggest Mark Leaks</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Fastest score gains usually come from repeatable, avoidable patterns.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {leaks.slice(0, 5).map((l) => (
          <div key={`${l.topic}:${l.mistakeType}`} className="flex items-start justify-between gap-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {l.subject}: {l.topic}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {labelMistakeType(l.mistakeType)} • {l.avoidableCount}/{l.frequency} avoidable
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-bold text-gray-900 dark:text-white">~{Math.round(l.estimatedMarksLost)} marks</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">recoverable</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Based on your logged test mistakes. The estimate improves as you log more.
      </div>
    </div>
  )
}

function labelMistakeType(t: MarkLeakEstimate['mistakeType']) {
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
