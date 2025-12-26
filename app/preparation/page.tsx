'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import PreparednessMatrix from '@/components/Preparation/PreparednessMatrix'
import DiagnosticDashboard from '@/components/Preparation/DiagnosticDashboard'
import {
  analyzeCoverage,
  findMarksLeaks,
  calculateRevisionROI,
  generateStrategicInsights,
  detectDecayRisks,
  assessExamReadiness,
  generateSmartMicroAction
} from '@/lib/preparationDiagnostics'
import type {
  SyllabusTopic,
  TopicPreparedness,
  PreparednessState,
  SyllabusCoverage,
  HighYieldWeakness,
  RevisionROI,
  StrategicInsight
} from '@/lib/preparationState.types'
import type { ExamReadiness } from '@/lib/preparationDiagnostics'

export default function PreparationPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'matrix' | 'diagnostics'>('diagnostics')

  // Data
  const [subjects, setSubjects] = useState<string[]>([])
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [preparedness, setPreparedness] = useState<Map<string, TopicPreparedness>>(new Map())
  const [daysToExam, setDaysToExam] = useState<number | null>(null)

  // Diagnostics
  const [coverage, setCoverage] = useState<SyllabusCoverage | null>(null)
  const [weaknesses, setWeaknesses] = useState<HighYieldWeakness[]>([])
  const [rois, setROIs] = useState<RevisionROI[]>([])
  const [insights, setInsights] = useState<StrategicInsight[]>([])
  const [readiness, setReadiness] = useState<ExamReadiness | null>(null)
  const [microAction, setMicroAction] = useState<{ topic: string; action: string; reason: string } | null>(null)

  // Load data
  useEffect(() => {
    if (!user) return
    loadPreparationData()
  }, [user])

  // Recompute diagnostics whenever preparedness changes
  useEffect(() => {
    if (topics.length > 0 && preparedness.size > 0) {
      computeDiagnostics()
    }
  }, [topics, preparedness])

  async function loadPreparationData() {
    try {
      setLoading(true)

      if (!supabase) return

      // Get user's exam info (from existing daily_check_ins or new profile field)
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('target_exam, exam_date')
        .eq('user_id', user!.id)
        .single()

      if (userData?.exam_date) {
        const examDate = new Date(userData.exam_date)
        const today = new Date()
        const diffTime = examDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setDaysToExam(diffDays)
      }

      // Load syllabus topics for user's exam
      const { data: topicsData, error: topicsError } = await supabase
        .from('syllabus_topics')
        .select('*')
        .order('subject', { ascending: true })
        .order('name', { ascending: true })

      if (topicsError) throw topicsError

      const loadedTopics = topicsData as SyllabusTopic[]
      setTopics(loadedTopics)

      // Extract unique subjects
      const uniqueSubjects = [...new Set(loadedTopics.map(t => t.subject))]
      setSubjects(uniqueSubjects)

      // Load user's preparedness state
      const { data: prepData, error: prepError } = await supabase
        .from('topic_preparedness')
        .select('*')
        .eq('user_id', user!.id)

      if (prepError) throw prepError

      // Convert to Map
      const prepMap = new Map<string, TopicPreparedness>()
      for (const prep of prepData as any[]) {
        // Compute days_since_revision on client side
        const lastRevised = prep.last_revised_at ? new Date(prep.last_revised_at) : null
        const daysSince = lastRevised 
          ? Math.floor((Date.now() - lastRevised.getTime()) / (1000 * 60 * 60 * 24))
          : undefined

        prepMap.set(prep.topic_id, {
          id: prep.id,
          userId: prep.user_id,
          topicId: prep.topic_id,
          state: prep.state,
          confidenceScore: prep.confidence_score || undefined,
          lastRevisedAt: lastRevised || undefined,
          daysSinceRevision: daysSince,
          revisionCount: prep.revision_count,
          stateChangedAt: new Date(prep.state_changed_at),
          createdAt: new Date(prep.created_at),
          updatedAt: new Date(prep.updated_at)
        })
      }
      setPreparedness(prepMap)

    } catch (error) {
      console.error('Error loading preparation data:', error)
    } finally {
      setLoading(false)
    }
  }

  function computeDiagnostics() {
    // Convert preparedness map to array
    const prepArray = Array.from(preparedness.values())

    // 1. Coverage
    const cov = analyzeCoverage(prepArray)
    setCoverage(cov)

    // 2. Weaknesses (marks leaks)
    const weak = findMarksLeaks(prepArray, topics, 10)
    setWeaknesses(weak)

    // 3. ROI ranking
    const roi = calculateRevisionROI(prepArray, topics, 20)
    setROIs(roi)

    // 4. Decay risks
    const decayRisks = detectDecayRisks(prepArray, topics)

    // 5. Strategic insights
    const ins = generateStrategicInsights(cov, weak, roi)
    const allInsights = [...ins, ...decayRisks]
    setInsights(allInsights)

    // 6. Exam readiness
    const ready = assessExamReadiness(cov, daysToExam)
    setReadiness(ready)

    // 7. Smart micro-action
    const action = generateSmartMicroAction(weak, roi)
    setMicroAction(action)
  }

  async function handleStateChange(topicId: string, newState: PreparednessState) {
    try {
      if (!supabase) return

      // Call update_topic_state RPC
      const { error } = await supabase.rpc('update_topic_state', {
        p_user_id: user!.id,
        p_topic_id: topicId,
        p_new_state: newState
      })

      if (error) throw error

      // Update local state
      const existing = preparedness.get(topicId) || {
        id: '',
        userId: user!.id,
        topicId,
        state: 'untouched' as PreparednessState,
        confidenceScore: 0,
        lastRevisedAt: undefined,
        daysSinceRevision: undefined,
        revisionCount: 0,
        stateChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const newPrep = new Map(preparedness)
      newPrep.set(topicId, {
        ...existing,
        state: newState,
        lastRevisedAt: new Date(),
        daysSinceRevision: 0,
        revisionCount: existing.revisionCount + 1,
        confidenceScore: newState === 'strong' ? 100 : newState === 'shaky' ? 60 : newState === 'weak' ? 30 : 0,
        updatedAt: new Date()
      })

      setPreparedness(newPrep)

    } catch (error) {
      console.error('Error updating topic state:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your preparation state...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-900">Please sign in to access preparation tracking</p>
        </div>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No syllabus loaded</h2>
          <p className="text-gray-600 mb-6">
            You need to select an exam and load its syllabus structure to start tracking preparation.
          </p>
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
            Select Exam & Load Syllabus
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Preparation State</h1>
          <p className="text-gray-600 mt-1">
            Not "how much did you study?" — "What are you unprepared for?"
          </p>
        </div>

        {/* Smart Micro-Action Banner */}
        {microAction && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Today's smart action</h3>
                <p className="text-blue-800 mt-1">{microAction.action}</p>
                <p className="text-sm text-blue-600 mt-1">{microAction.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('diagnostics')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'diagnostics'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            📊 Diagnostics
          </button>
          <button
            onClick={() => setView('matrix')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'matrix'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            📋 Full Matrix
          </button>
        </div>

        {/* Content */}
        {view === 'diagnostics' && coverage && readiness ? (
          <DiagnosticDashboard
            coverage={coverage}
            weaknesses={weaknesses}
            rois={rois}
            insights={insights}
            readiness={readiness}
            daysToExam={daysToExam}
          />
        ) : view === 'matrix' ? (
          <PreparednessMatrix
            subjects={subjects}
            topics={topics}
            preparedness={preparedness}
            onStateChange={handleStateChange}
          />
        ) : null}
      </div>
    </div>
  )
}
