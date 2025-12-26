'use client'

import { useState } from 'react'
import { EXAM_PRESETS, User } from '@/lib/types'

interface OnboardingFlowProps {
  onComplete: (data: Omit<User, 'id' | 'createdAt'>) => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1)
  const [exam, setExam] = useState('')
  const [customExam, setCustomExam] = useState('')
  const [examDate, setExamDate] = useState<string>('')
  const [dailyTarget, setDailyTarget] = useState(120) // minutes
  const [loading, setLoading] = useState(false)

  const selectedExam = exam === 'Other' ? customExam : exam

  const handleComplete = async () => {
    if (!selectedExam || dailyTarget < 30) return

    setLoading(true)
    try {
      // Call parent's onComplete with user data
      onComplete({
        exam: selectedExam,
        examDate: examDate ? new Date(examDate) : undefined,
        dailyTargetMinutes: dailyTarget,
        language: 'English',
        isAnonymous: true,
        peerComparisonEnabled: true,
        notificationsEnabled: false
      })
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Which exam are you preparing for?
                </h1>
                <p className="text-gray-600 text-sm">
                  We'll tailor your experience
                </p>
              </div>

              <div className="space-y-3">
                {EXAM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setExam(preset)
                      if (preset !== 'Other') {
                        setCustomExam('')
                      }
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      exam === preset
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{preset}</span>
                  </button>
                ))}

                {exam === 'Other' && (
                  <input
                    type="text"
                    value={customExam}
                    onChange={(e) => setCustomExam(e.target.value)}
                    placeholder="Enter your exam name"
                    className="w-full p-4 border-2 border-blue-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedExam}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  When is your exam?
                </h1>
                <p className="text-gray-600 text-sm">
                  Optional — helps us pace your preparation
                </p>
              </div>

              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Daily study target
                </h1>
                <p className="text-gray-600 text-sm">
                  How many minutes per day?
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {dailyTarget}
                  </div>
                  <div className="text-gray-600">minutes</div>
                </div>

                <input
                  type="range"
                  min="30"
                  max="480"
                  step="15"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-xs text-gray-500">
                  <span>30 min</span>
                  <span>8 hours</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Get Started'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Takes less than 30 seconds
        </p>
      </div>
    </div>
  )
}
