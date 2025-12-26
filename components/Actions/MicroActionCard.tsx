'use client'

import { MicroAction } from '@/lib/types'
import { completeMicroAction, lockMicroAction } from '@/lib/supabaseStudyTrack'
import { useState, useMemo } from 'react'
import { getSubjectMeta, getExamDayRules, getLastPhaseGuidance, getDaysToExam } from '@/lib/examSyllabi'

interface MicroActionCardProps {
  action: MicroAction
  onComplete?: () => void
  examName?: string
  examDate?: string
  subject?: string
}

export default function MicroActionCard({ action, onComplete, examName, examDate, subject }: MicroActionCardProps) {
  const [completing, setCompleting] = useState(false)
  const [locking, setLocking] = useState(false)
  const [locked, setLocked] = useState(Boolean(action.locked))

  // Get contextual guidance based on exam and subject
  const contextualGuidance = useMemo(() => {
    if (!examName) return null

    const daysToExam = examDate ? getDaysToExam(examDate) : null
    const subjectMeta = subject ? getSubjectMeta(examName, subject) : null
    const examDayRules = getExamDayRules(examName)
    const lastPhaseGuidance = getLastPhaseGuidance(examName)

    // Priority 1: Exam day rules (≤7 days)
    if (daysToExam !== null && daysToExam <= 7 && examDayRules && examDayRules.length > 0) {
      // Show one rule per day based on date
      const dayIndex = Math.max(0, 7 - daysToExam) % examDayRules.length
      const rule = examDayRules[dayIndex]
      return {
        type: 'exam-rule' as const,
        content: rule.rule,
        trigger: rule.trigger,
        daysLeft: daysToExam
      }
    }

    // Priority 2: Last phase guidance (≤10 days)
    if (daysToExam !== null && daysToExam <= 10 && lastPhaseGuidance && lastPhaseGuidance.length > 0) {
      // Rotate guidance based on session
      const guidanceIndex = new Date().getDate() % lastPhaseGuidance.length
      return {
        type: 'last-phase' as const,
        content: lastPhaseGuidance[guidanceIndex],
        daysLeft: daysToExam
      }
    }

    // Priority 3: Subject-specific exam tip (when studying a subject)
    if (subjectMeta && subjectMeta.examTips && subjectMeta.examTips.length > 0) {
      // One tip per session - use hour to rotate
      const tipIndex = new Date().getHours() % subjectMeta.examTips.length
      return {
        type: 'exam-tip' as const,
        content: subjectMeta.examTips[tipIndex],
        subject: subject
      }
    }

    return null
  }, [examName, examDate, subject])

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await completeMicroAction(action.id)
      onComplete?.()
    } catch (error) {
      console.error('Failed to complete action:', error)
      setCompleting(false)
    }
  }

  const handleLock = async () => {
    if (locked) return
    setLocking(true)
    try {
      await lockMicroAction(action.id)
      setLocked(true)
      setLocking(false)
    } catch (error) {
      console.error('Failed to lock action:', error)
      setLocking(false)
    }
  }

  if (action.completed) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✓</div>
          <div className="flex-1">
            <div className="text-green-700 font-medium line-through">
              {action.task}
            </div>
            <p className="text-sm text-green-600 mt-1">Completed</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
      <div className="space-y-4">
        {/* Task */}
        <div>
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
            Your Next Action
          </div>
          <p className="text-lg font-medium text-gray-900">{action.task}</p>
        </div>

        {/* Duration badge */}
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm">
          <span className="text-gray-600">⏱️</span>
          <span className="font-medium text-gray-900">
            {action.durationMinutes} minutes
          </span>
        </div>

        {/* Contextual Guidance - appears only when relevant */}
        {contextualGuidance && (
          <div className={`rounded-lg p-3 text-sm ${
            contextualGuidance.type === 'exam-rule' 
              ? 'bg-amber-50 border border-amber-200'
              : contextualGuidance.type === 'last-phase'
              ? 'bg-purple-50 border border-purple-200'
              : 'bg-indigo-50 border border-indigo-200'
          }`}>
            {contextualGuidance.type === 'exam-rule' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-600 font-medium">
                    ⚡ {contextualGuidance.daysLeft} day{contextualGuidance.daysLeft !== 1 ? 's' : ''} to exam
                  </span>
                </div>
                <p className="text-amber-800 text-xs mb-1">
                  <span className="font-medium">If:</span> {contextualGuidance.trigger}
                </p>
                <p className="text-amber-900 font-medium">
                  → {contextualGuidance.content}
                </p>
              </>
            )}
            {contextualGuidance.type === 'last-phase' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-600 font-medium">
                    🎯 Final stretch — {contextualGuidance.daysLeft} days left
                  </span>
                </div>
                <p className="text-purple-800">{contextualGuidance.content}</p>
              </>
            )}
            {contextualGuidance.type === 'exam-tip' && contextualGuidance.subject && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-600 font-medium text-xs uppercase tracking-wide">
                    {contextualGuidance.subject}
                  </span>
                </div>
                <p className="text-indigo-800">{contextualGuidance.content}</p>
              </>
            )}
          </div>
        )}

        {locked && (
          <div className="bg-white/70 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            Locked for tomorrow. You'll be asked about it next day.
          </div>
        )}

        {/* Complete button */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleLock}
            disabled={locking || locked}
            className="w-full py-3 bg-white text-blue-700 rounded-lg font-medium border border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {locked ? 'Locked' : locking ? 'Locking…' : 'Lock this'}
          </button>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {completing ? 'Marking complete...' : 'Mark as complete'}
          </button>
        </div>
      </div>
    </div>
  )
}
