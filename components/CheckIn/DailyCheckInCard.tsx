'use client'

import { useState } from 'react'
import { DailyCheckIn } from '@/lib/types'
import { getExamSubjects } from '@/lib/examSyllabi'

interface DailyCheckInCardProps {
  onSubmit: (data: Omit<DailyCheckIn, 'id' | 'userId' | 'createdAt' | 'date'>) => Promise<void>
  onClose?: () => void
  userExam?: string
}

export default function DailyCheckInCard({ onSubmit, onClose, userExam }: DailyCheckInCardProps) {
  const [subject, setSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [minutes, setMinutes] = useState(60)
  const [couldRevise, setCouldRevise] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Get exam-specific subjects or fallback to generic list
  const examSubjects = userExam ? [...getExamSubjects(userExam), 'Other'] : [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Economics',
    'Other'
  ]

  const selectedSubject = subject === 'Other' ? customSubject : subject
  const isComplete = selectedSubject && minutes > 0 && couldRevise !== null

  const handleSubmit = async () => {
    if (!isComplete || submitting) return

    setSubmitting(true)
    try {
      await onSubmit({
        subject: selectedSubject,
        minutesStudied: minutes,
        couldRevise: couldRevise!
      })
    } catch (error) {
      console.error('Check-in error:', error)
      alert('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // Auto-submit when all fields are filled
  if (isComplete && !submitting) {
    handleSubmit()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Today's Check-In
            </h2>
            <p className="text-gray-600 text-sm">
              Quick — just 3 questions
            </p>
          </div>

          {/* Question 1: Subject */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-2 block">
                What did you study?
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {examSubjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setSubject(sub)
                      if (sub !== 'Other') setCustomSubject('')
                    }}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      subject === sub
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
              {subject === 'Other' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter subject name"
                  className="mt-2 w-full p-3 border-2 border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </label>
          </div>

          {/* Question 2: Minutes */}
          {selectedSubject && (
            <div className="space-y-3 animate-fade-in">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-3 block">
                  How long did you study?
                </span>
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-blue-600">
                    {minutes}
                  </div>
                  <div className="text-gray-600 text-sm">minutes</div>
                </div>
                <input
                  type="range"
                  min="15"
                  max="480"
                  step="15"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>15 min</span>
                  <span>8 hours</span>
                </div>
              </label>
            </div>
          )}

          {/* Question 3: Recall */}
          {selectedSubject && minutes > 0 && (
            <div className="space-y-3 animate-fade-in">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-3 block">
                  Could you revise this tomorrow without notes?
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCouldRevise(true)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all ${
                      couldRevise === true
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ✓ Yes
                  </button>
                  <button
                    onClick={() => setCouldRevise(false)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all ${
                      couldRevise === false
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ✗ No
                  </button>
                </div>
              </label>
            </div>
          )}

          {/* Loading state */}
          {submitting && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600 mt-2">Saving...</p>
            </div>
          )}

          {/* Close button (only if onClose provided) */}
          {onClose && !submitting && (
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
