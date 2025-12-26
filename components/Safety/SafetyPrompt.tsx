'use client'

import { useState } from 'react'
import { Verdict } from '@/lib/types'

interface SafetyPromptProps {
  recentVerdicts: Verdict[]
  onDisableComparison?: () => void
  onDismiss: () => void
}

export default function SafetyPrompt({ recentVerdicts, onDisableComparison, onDismiss }: SafetyPromptProps) {
  const [showOptions, setShowOptions] = useState(false)

  // Count consecutive "falling behind" verdicts
  const consecutiveFalling = recentVerdicts
    .slice(0, 3)
    .filter(v => v.status === 'falling-behind')
    .length

  if (consecutiveFalling < 2) {
    return null // Don't show unless pattern detected
  }

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-amber-900 mb-2">
            Feeling overwhelmed?
          </h3>
          <p className="text-sm text-amber-700">
            We've noticed you've been struggling lately. That's completely normal during exam prep.
          </p>
        </div>

        {!showOptions ? (
          <button
            onClick={() => setShowOptions(true)}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
          >
            Show options
          </button>
        ) : (
          <div className="space-y-3">
            {onDisableComparison && (
              <button
                onClick={() => {
                  onDisableComparison()
                  onDismiss()
                }}
                className="w-full p-3 bg-white border border-amber-200 rounded-lg text-left hover:bg-amber-50 transition-colors"
              >
                <div className="font-medium text-amber-900 text-sm mb-1">
                  Turn off peer comparison
                </div>
                <div className="text-xs text-amber-700">
                  Focus on your own progress only
                </div>
              </button>
            )}

            <button
              onClick={onDismiss}
              className="w-full p-3 bg-white border border-amber-200 rounded-lg text-left hover:bg-amber-50 transition-colors"
            >
              <div className="font-medium text-amber-900 text-sm mb-1">
                Adjust my target
              </div>
              <div className="text-xs text-amber-700">
                Set a more realistic daily goal
              </div>
            </button>

            <div className="pt-3 border-t border-amber-200">
              <p className="text-xs text-amber-700 mb-2">
                Remember: Consistency matters more than perfection
              </p>
              <button
                onClick={onDismiss}
                className="text-xs text-amber-600 hover:text-amber-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
