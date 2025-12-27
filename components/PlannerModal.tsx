'use client'

import { useState, useEffect } from 'react'
import { db, PlannedSession, getOrCreateDeviceId } from '@/lib/dexieClient'
import { format } from 'date-fns'
import { getExamSubjects, isKnownExam, getSubjectMarks, getSubjectMeta, analyzeStudyPatterns, StudyPatternAnalysis } from '@/lib/examSyllabi'
import { getStudyUser, getRecentCheckIns } from '@/lib/supabaseStudyTrack'
import { supabase } from '@/lib/supabaseClient'

// Common task templates per subject type
const TASK_TEMPLATES: { [category: string]: string[] } = {
  'revision': [
    'Quick revision of key concepts',
    'Review formulas and important points',
    'Solve previous year questions',
    'Practice MCQs',
    'Revise notes'
  ],
  'new-topic': [
    'Study new chapter',
    'Watch lecture and take notes',
    'Read textbook section',
    'Complete exercises'
  ],
  'practice': [
    'Solve practice problems',
    'Take mock test',
    'Time-bound practice set',
    'Error analysis from previous tests'
  ],
  'memorization': [
    'Memorize formulas/facts',
    'Flashcard revision',
    'Write and recall key points'
  ]
}

interface SubjectRecommendation {
  subject: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  marks?: number
  recallRate?: number
  daysSinceStudied?: number
}

interface PlannerModalProps {
  onClose: () => void
  onCreated: () => void
  initialDate?: string  // Allow pre-selecting a date
}

export default function PlannerModal({ onClose, onCreated, initialDate }: PlannerModalProps) {
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'))
  const [goal, setGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Exam-aware state
  const [userExam, setUserExam] = useState<string | null>(null)
  const [examSubjects, setExamSubjects] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<SubjectRecommendation[]>([])
  const [studyPatterns, setStudyPatterns] = useState<StudyPatternAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    loadUserExamAndPatterns()
  }, [])

  const loadUserExamAndPatterns = async () => {
    try {
      if (!supabase) {
        setLoading(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }

      const user = await getStudyUser(session.user.id)
      if (!user) {
        setLoading(false)
        return
      }

      setUserExam(user.exam)

      // Get exam subjects
      if (isKnownExam(user.exam)) {
        const subjects = getExamSubjects(user.exam)
        setExamSubjects(subjects)

        // Get study patterns for recommendations
        const checkIns = await getRecentCheckIns(session.user.id, 30)
        const patterns = analyzeStudyPatterns(checkIns, subjects)
        setStudyPatterns(patterns)

        // Generate recommendations
        const recs = generateRecommendations(user.exam, subjects, patterns)
        setRecommendations(recs)
      }
    } catch (e) {
      console.error('Failed to load exam data:', e)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendations = (
    exam: string, 
    subjects: string[], 
    patterns: StudyPatternAnalysis
  ): SubjectRecommendation[] => {
    const recs: SubjectRecommendation[] = []

    // Sort subjects by various criteria
    for (const subj of subjects) {
      const marks = getSubjectMarks(exam, subj)
      const meta = getSubjectMeta(exam, subj)
      const recallRate = patterns.subjectRecallRate.get(subj)
      const minutes = patterns.subjectMinutes.get(subj) || 0
      
      // Check if neglected
      const isNeglected = patterns.neglectedSubjects.includes(subj)
      const isWeakRecall = patterns.weakRecallSubjects.includes(subj)
      
      let reason = ''
      let priority: 'high' | 'medium' | 'low' = 'low'
      
      if (isWeakRecall && recallRate !== undefined) {
        reason = `Weak recall (${Math.round(recallRate * 100)}%) — needs revision`
        priority = 'high'
      } else if (isNeglected) {
        reason = `Not studied in 5+ days`
        priority = 'high'
      } else if (meta?.weight === 'high' && minutes < 60) {
        reason = `High-weight subject (${marks} marks) — needs more time`
        priority = 'medium'
      } else if (minutes === 0) {
        reason = `Not started yet`
        priority = 'medium'
      } else {
        reason = `${minutes} min studied • ${marks} marks`
        priority = 'low'
      }
      
      recs.push({
        subject: subj,
        reason,
        priority,
        marks,
        recallRate,
        daysSinceStudied: isNeglected ? 5 : undefined
      })
    }

    // Sort by priority (high first), then by marks
    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return (b.marks || 0) - (a.marks || 0)
    })
  }

  const handleSubjectSelect = (subj: string) => {
    setSubject(subj)
    setShowSubjectPicker(false)
  }

  const handleTaskTemplateSelect = (template: string) => {
    setGoal(template)
    setSelectedCategory(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim()) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const deviceId = await getOrCreateDeviceId()
      
      const planned: PlannedSession = {
        id: crypto.randomUUID(),
        deviceId,
        userId: null,
        subject: subject.trim(),
        plannedDate: date,
        goal: goal.trim() || null,
        status: 'pending',
        completedSessionId: null,
        rescheduledTo: null,
        createdAt: Date.now(),
        syncStatus: 'pending'
      }
      
      await db.plannedSessions.add(planned)
      
      onCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create planned session:', error)
      setError('Failed to create session. Please try again.')
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'medium': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      case 'low': return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return <span className="text-xs font-medium text-red-600 dark:text-red-400">Priority</span>
      case 'medium': return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Suggested</span>
      case 'low': return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl p-6 w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
              📅 Plan a Session
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {userExam && isKnownExam(userExam) ? `For ${userExam}` : 'Schedule your next study block'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              📆 When?
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
              required
            />
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              📚 What will you study?
            </label>
            
            {/* Custom input or selected subject */}
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => examSubjects.length > 0 && setShowSubjectPicker(true)}
                placeholder={examSubjects.length > 0 ? "Select or type a subject..." : "e.g., Math homework, Spanish vocab..."}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
                required
              />
              {examSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${showSubjectPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Subject Picker with Recommendations */}
            {showSubjectPicker && recommendations.length > 0 && (
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                  Recommended for you
                </p>
                {recommendations.map((rec) => (
                  <button
                    key={rec.subject}
                    type="button"
                    onClick={() => handleSubjectSelect(rec.subject)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all hover:scale-[1.01] ${getPriorityColor(rec.priority)} ${
                      subject === rec.subject ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{rec.subject}</span>
                      <div className="flex items-center gap-2">
                        {rec.marks && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{rec.marks} marks</span>
                        )}
                        {getPriorityBadge(rec.priority)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rec.reason}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Loading state */}
            {loading && examSubjects.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading subject recommendations...</p>
            )}
          </div>

          {/* Goal with Task Templates */}
          <div>
            <label htmlFor="goal" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              🎯 What's the goal?
            </label>
            <input
              id="goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Complete chapter 5, Practice 50 questions..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:text-white transition-all"
            />

            {/* Quick task templates */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick templates:</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(TASK_TEMPLATES).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      selectedCategory === category
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category === 'revision' && '📖 Revision'}
                    {category === 'new-topic' && '📚 New Topic'}
                    {category === 'practice' && '✍️ Practice'}
                    {category === 'memorization' && '🧠 Memorize'}
                  </button>
                ))}
              </div>

              {/* Show templates for selected category */}
              {selectedCategory && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {TASK_TEMPLATES[selectedCategory].map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => handleTaskTemplateSelect(template)}
                      className="px-3 py-1.5 text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-300 rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-all"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Subject-specific tips */}
          {subject && userExam && isKnownExam(userExam) && examSubjects.includes(subject) && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">💡 Tip for {subject}</p>
              {(() => {
                const meta = getSubjectMeta(userExam, subject)
                if (meta?.examTips && meta.examTips.length > 0) {
                  return <p className="text-xs text-indigo-600 dark:text-indigo-400">{meta.examTips[0]}</p>
                }
                return <p className="text-xs text-indigo-600 dark:text-indigo-400">Focus on understanding concepts, not just memorization.</p>
              })()}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-touch py-3 px-4 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim()}
              className="flex-1 min-h-touch py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25"
            >
              {isSubmitting ? 'Creating...' : 'Create Plan ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
