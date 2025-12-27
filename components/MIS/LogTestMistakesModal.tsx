'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { User, MISMistakeType, MISAvoidability, MISConfidenceLevel } from '@/lib/types'
import type { SyllabusTopic } from '@/lib/preparationState.types'
import { createMISTest, getSyllabusTopicsForExam, logMISMistakes } from '@/lib/supabaseStudyTrack'

const MISTAKE_TYPES: Array<{ value: MISMistakeType; label: string }> = [
  { value: 'concept', label: 'Conceptual (didn’t know / misunderstood)' },
  { value: 'memory', label: 'Memory (forgot formula/fact)' },
  { value: 'calculation', label: 'Calculation (silly arithmetic)' },
  { value: 'misread', label: 'Misread question' },
  { value: 'time-pressure', label: 'Time pressure' },
  { value: 'strategy', label: 'Strategy (wrong approach)' }
]

const AVOIDABILITY: Array<{ value: MISAvoidability; label: string }> = [
  { value: 'easily', label: 'Easily avoidable' },
  { value: 'possibly', label: 'Possibly avoidable' },
  { value: 'hard', label: 'Hard to avoid' }
]

const CONFIDENCE: Array<{ value: MISConfidenceLevel; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

type MistakeRow = {
  subject: string
  topicId: string
  subtopicId?: string
  mistakeType: MISMistakeType
  avoidability: MISAvoidability
  confidenceLevel?: MISConfidenceLevel
  repeated?: boolean
}

interface LogTestMistakesModalProps {
  user: User
  onClose: () => void
  onLogged?: () => void
}

export default function LogTestMistakesModal({ user, onClose, onLogged }: LogTestMistakesModalProps) {
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [topics, setTopics] = useState<SyllabusTopic[]>([])

  const [testName, setTestName] = useState('')
  const [testType, setTestType] = useState<'mock' | 'sectional' | 'pyq'>('mock')
  const [testDate, setTestDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [totalMarks, setTotalMarks] = useState<string>('')
  const [marksObtained, setMarksObtained] = useState<string>('')

  const [rows, setRows] = useState<MistakeRow[]>([
    {
      subject: '',
      topicId: '',
      mistakeType: 'concept',
      avoidability: 'possibly'
    }
  ])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoadingTopics(true)
      try {
        const loaded = await getSyllabusTopicsForExam(user.exam)
        if (mounted) setTopics(loaded)
      } finally {
        if (mounted) setLoadingTopics(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [user.exam])

  const subjects = useMemo(() => {
    return [...new Set(topics.map(t => t.subject))].sort((a, b) => a.localeCompare(b))
  }, [topics])

  const topicsBySubject = useMemo(() => {
    const map = new Map<string, SyllabusTopic[]>()
    for (const s of subjects) {
      const list = topics
        .filter(t => t.subject === s && !t.parentId)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name))
      map.set(s, list)
    }
    return map
  }, [topics, subjects])

  const childrenByParent = useMemo(() => {
    const map = new Map<string, SyllabusTopic[]>()
    for (const t of topics) {
      if (!t.parentId) continue
      const list = map.get(t.parentId) || []
      list.push(t)
      map.set(t.parentId, list)
    }
    for (const [k, list] of map.entries()) {
      map.set(k, list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name)))
    }
    return map
  }, [topics])

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        subject: prev[prev.length - 1]?.subject || '',
        topicId: '',
        mistakeType: 'concept',
        avoidability: 'possibly'
      }
    ])
  }

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, patch: Partial<MistakeRow>) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const canSubmit = useMemo(() => {
    if (submitting) return false
    if (!testName.trim()) return false
    if (rows.length === 0) return false
    return rows.every(r => r.subject && (r.subtopicId || r.topicId) && r.mistakeType && r.avoidability)
  }, [rows, testName, submitting])

  const handleSubmit = async () => {
    setError(null)
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const createdTest = await createMISTest(user.id, {
        testName: testName.trim(),
        testType,
        date: testDate,
        totalMarks: totalMarks ? Number(totalMarks) : undefined,
        marksObtained: marksObtained ? Number(marksObtained) : undefined
      })

      if (!createdTest) throw new Error('Could not create test')

      const toInsert = rows.map(r => ({
        topicId: r.subtopicId || r.topicId,
        mistakeType: r.mistakeType,
        avoidability: r.avoidability,
        confidenceLevel: r.confidenceLevel,
        repeated: r.repeated
      }))

      const inserted = await logMISMistakes(user.id, user.exam, createdTest.id, toInsert)

      if (inserted.length === 0) {
        throw new Error('Could not save mistakes')
      }

      onLogged?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log mistakes')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl p-6 pb-8 safe-area-pb md:p-8 w-full md:max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 md:hidden" />
        
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">+ Log Test Mistakes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Log patterns, not questions. 3 fields per mistake.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Test name</label>
            <input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Mock 3 (Quant + Reasoning)"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Type</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as any)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white"
            >
              <option value="mock">Mock</option>
              <option value="sectional">Sectional</option>
              <option value="pyq">PYQ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Total</label>
              <input
                inputMode="numeric"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="250"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Scored</label>
              <input
                inputMode="numeric"
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="132"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-primary focus:outline-none dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Mistakes</h3>
            <button
              onClick={addRow}
              className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              + Add mistake
            </button>
          </div>

          {loadingTopics ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 py-6">Loading syllabus…</div>
          ) : topics.length === 0 ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              No syllabus topics found for your exam yet. Add your exam syllabus in the Preparation system first.
            </div>
          ) : (
            <div className="space-y-3 max-h-[45vh] overflow-auto pr-1">
              {rows.map((row, idx) => {
                const topTopics = row.subject ? (topicsBySubject.get(row.subject) || []) : []
                const subTopics = row.topicId ? (childrenByParent.get(row.topicId) || []) : []

                return (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Subject *</label>
                        <select
                          value={row.subject}
                          onChange={(e) => {
                            const subject = e.target.value
                            updateRow(idx, { subject, topicId: '', subtopicId: undefined })
                          }}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        >
                          <option value="">Select</option>
                          {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Topic *</label>
                        <select
                          value={row.topicId}
                          onChange={(e) => {
                            const topicId = e.target.value
                            updateRow(idx, { topicId, subtopicId: undefined })
                          }}
                          disabled={!row.subject}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm disabled:opacity-50"
                        >
                          <option value="">Select</option>
                          {topTopics.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Subtopic (optional)</label>
                        <select
                          value={row.subtopicId || ''}
                          onChange={(e) => updateRow(idx, { subtopicId: e.target.value || undefined })}
                          disabled={!row.topicId || subTopics.length === 0}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm disabled:opacity-50"
                        >
                          <option value="">None</option>
                          {subTopics.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Mistake type *</label>
                        <select
                          value={row.mistakeType}
                          onChange={(e) => updateRow(idx, { mistakeType: e.target.value as MISMistakeType })}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        >
                          {MISTAKE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Avoidability *</label>
                        <select
                          value={row.avoidability}
                          onChange={(e) => updateRow(idx, { avoidability: e.target.value as MISAvoidability })}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        >
                          {AVOIDABILITY.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Confidence (optional)</label>
                        <select
                          value={row.confidenceLevel || ''}
                          onChange={(e) => updateRow(idx, { confidenceLevel: (e.target.value || undefined) as any })}
                          className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        >
                          <option value="">—</option>
                          {CONFIDENCE.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <button
                          onClick={() => removeRow(idx)}
                          disabled={rows.length === 1}
                          className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="md:col-span-12 mt-1">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={Boolean(row.repeated)}
                            onChange={(e) => updateRow(idx, { repeated: e.target.checked })}
                          />
                          Repeated from previous tests? (optional)
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Save mistakes'}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Tip: Log even 3–4 mistakes to unlock reliable insights.
        </p>
      </div>
    </div>
  )
}
