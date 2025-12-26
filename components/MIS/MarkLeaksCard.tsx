'use client'

import type { MarkLeakEstimate } from '@/lib/types'
import { getMISPrescription } from '@/lib/misPrescriptions'
import { getTypicalMistakes } from '@/lib/examSyllabi'

interface MarkLeaksCardProps {
  leaks: MarkLeakEstimate[]
  onUseAsFocus?: (leak: MarkLeakEstimate) => void
  onLockForTomorrow?: (leak: MarkLeakEstimate) => void
  examName?: string
}

export default function MarkLeaksCard({ leaks, onUseAsFocus, onLockForTomorrow, examName }: MarkLeaksCardProps) {
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
        {leaks.slice(0, 5).map((l) => {
          const p = getMISPrescription(l)
          
          // Check if this matches a typical mistake pattern for the exam
          const typicalMistakes = examName ? getTypicalMistakes(examName, l.subject) : []
          const matchingTypical = typicalMistakes.find(typical => {
            const keywords = typical.toLowerCase().split(/\s+/).filter(k => k.length > 3)
            const mistakeText = `${l.topic} ${l.mistakeType}`.toLowerCase()
            return keywords.some(k => mistakeText.includes(k))
          })

          return (
            <div key={`${l.topic}:${l.mistakeType}`} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {l.subject}: {l.topic}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {labelMistakeType(l.mistakeType)} • {l.avoidableCount}/{l.frequency} avoidable
                  </div>
                  {/* Show if this matches a known typical mistake pattern */}
                  {matchingTypical && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Known pattern: {matchingTypical}</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">~{Math.round(l.estimatedMarksLost)} marks</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">recoverable</div>
                </div>
              </div>

              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{p.title}</div>
                <ul className="mt-1 text-xs text-gray-600 dark:text-gray-300 list-disc list-inside space-y-0.5">
                  {p.steps.slice(0, 2).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {(onUseAsFocus || onLockForTomorrow) && (
                <div className="mt-3 flex gap-2">
                  {onUseAsFocus && (
                    <button
                      onClick={() => onUseAsFocus(l)}
                      className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      Use as today’s 20 min
                    </button>
                  )}
                  {onLockForTomorrow && (
                    <button
                      onClick={() => onLockForTomorrow(l)}
                      className="flex-1 py-2 px-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Lock for tomorrow
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
