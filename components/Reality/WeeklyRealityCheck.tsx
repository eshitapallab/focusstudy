'use client'

import { useState } from 'react'
import { WeeklyReality } from '@/lib/types'

interface Question {
  id: keyof WeeklyReality['answers']
  text: string
}

const QUESTIONS: Question[] = [
  {
    id: 'avoidedWeakSubjects',
    text: 'Did you avoid weak subjects this week?'
  },
  {
    id: 'revisedContent',
    text: 'Did you revise what you studied?'
  },
  {
    id: 'readyForBasics',
    text: 'If exam were tomorrow, would you pass basics?'
  },
  {
    id: 'consistentEffort',
    text: 'Were you consistent with your study routine?'
  },
  {
    id: 'honestWithSelf',
    text: 'Have you been honest about your progress?'
  }
]

interface WeeklyRealityCheckProps {
  onSubmit: (answers: WeeklyReality['answers']) => Promise<void>
  onSkip?: () => void
}

export default function WeeklyRealityCheck({ onSubmit, onSkip }: WeeklyRealityCheckProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Partial<WeeklyReality['answers']>>({})
  const [submitting, setSubmitting] = useState(false)

  const question = QUESTIONS[currentQuestion]
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1
  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== undefined)

  const handleAnswer = async (answer: boolean) => {
    const newAnswers = { ...answers, [question.id]: answer }
    setAnswers(newAnswers)

    if (isLastQuestion) {
      // Submit
      setSubmitting(true)
      try {
        await onSubmit(newAnswers as WeeklyReality['answers'])
      } catch (error) {
        console.error('Reality check error:', error)
        setSubmitting(false)
      }
    } else {
      // Move to next question
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    }
  }

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex justify-center gap-1.5 mb-8">
          {QUESTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx <= currentQuestion
                  ? 'bg-white w-8'
                  : 'bg-white/30 w-6'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!submitting ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Weekly Reality Check
                </h2>
                <p className="text-gray-600 text-sm">
                  Be honest — it helps you grow
                </p>
              </div>

              {/* Question */}
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div className="text-sm font-medium text-purple-600 mb-2">
                    Question {currentQuestion + 1} of {QUESTIONS.length}
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">
                    {question.text}
                  </h3>
                </div>

                {/* Answer buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer(true)}
                    className={`p-6 rounded-xl border-2 font-medium transition-all ${
                      answers[question.id] === true
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">✓</div>
                    <div>Yes</div>
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className={`p-6 rounded-xl border-2 font-medium transition-all ${
                      answers[question.id] === false
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">✗</div>
                    <div>No</div>
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                {currentQuestion > 0 && (
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="flex-1 py-3 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
              <p className="text-gray-600">Calculating your reality score...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
