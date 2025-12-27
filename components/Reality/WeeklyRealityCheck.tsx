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
  onSubmit: (payload: { answers: WeeklyReality['answers']; confidenceScore: number }) => Promise<{
    realityScore: number
    confidenceScore: number
    gap: 'overconfidence' | 'underconfidence' | 'aligned'
  }>
  onSkip?: () => void
}

export default function WeeklyRealityCheck({ onSubmit, onSkip }: WeeklyRealityCheckProps) {
  const [step, setStep] = useState<'confidence' | 'questions' | 'result'>('confidence')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Partial<WeeklyReality['answers']>>({})
  const [confidenceScore, setConfidenceScore] = useState(65)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    realityScore: number
    confidenceScore: number
    gap: 'overconfidence' | 'underconfidence' | 'aligned'
  } | null>(null)

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
        const submitResult = await onSubmit({
          answers: newAnswers as WeeklyReality['answers'],
          confidenceScore
        })
        setResult(submitResult)
        setStep('result')
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
    if (step === 'questions') {
      if (currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1)
      } else {
        setStep('confidence')
      }
    }
  }

  const getGapCopy = (gap: 'overconfidence' | 'underconfidence' | 'aligned') => {
    switch (gap) {
      case 'overconfidence':
        return { title: 'Overconfidence', subtitle: 'Your confidence is running ahead of your habits.' }
      case 'underconfidence':
        return { title: 'Underconfidence', subtitle: 'You are doing better than you feel.' }
      case 'aligned':
        return { title: 'Aligned', subtitle: 'Your self-belief matches your reality.' }
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 flex items-end md:items-center justify-center p-0 md:p-4 z-50 safe-area-pb">
      <div className="w-full max-w-lg p-4">
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
          {step === 'confidence' && !submitting && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Weekly Reality Check
                </h2>
                <p className="text-gray-600 text-sm">Quick and honest — under a minute</p>
              </div>

              <div className="mb-8">
                <div className="text-center mb-4">
                  <div className="text-sm font-medium text-purple-600 mb-2">Confidence</div>
                  <h3 className="text-xl font-medium text-gray-900">How prepared do you feel right now?</h3>
                </div>

                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-purple-700">{confidenceScore}</div>
                  <div className="text-sm text-gray-600">out of 100</div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={confidenceScore}
                  onChange={(e) => setConfidenceScore(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('questions')}
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700"
                >
                  Continue
                </button>
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
          )}

          {step === 'questions' && !submitting && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Reality Check</h2>
                <p className="text-gray-600 text-sm">Be honest — it helps you grow</p>
              </div>

              {/* Question */}
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div className="text-sm font-medium text-purple-600 mb-2">
                    Question {currentQuestion + 1} of {QUESTIONS.length}
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">{question.text}</h3>
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
                <button
                  onClick={goBack}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
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
          )}

          {submitting && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
              <p className="text-gray-600">Calculating your reality score...</p>
            </div>
          )}

          {step === 'result' && result && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Confidence vs Reality</h2>
                <p className="text-gray-600 text-sm">A small mirror — no judgment</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Confidence</div>
                  <div className="text-3xl font-bold text-purple-800 mt-1">{result.confidenceScore}</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
                  <div className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Reality</div>
                  <div className="text-3xl font-bold text-indigo-800 mt-1">{result.realityScore}</div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <div className="font-semibold text-gray-900">{getGapCopy(result.gap).title}</div>
                <div className="text-sm text-gray-700 mt-1">{getGapCopy(result.gap).subtitle}</div>
              </div>

              <button
                onClick={() => onSkip?.()}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
