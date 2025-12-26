'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getStudyUser, updateStudyUser } from '@/lib/supabaseStudyTrack'
import type { User } from '@/lib/types'

const EXAM_PRESETS = [
  'UPSC Civil Services',
  'JEE Main/Advanced',
  'NEET UG',
  'SSC CGL/CHSL',
  'GATE',
  'CAT',
  'Banking (IBPS/SBI)',
  'CA Foundation/Inter/Final',
  'CLAT',
  'NDA',
  'Other'
]

export default function StudyTrackSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Form state
  const [exam, setExam] = useState('')
  const [customExam, setCustomExam] = useState('')
  const [examDate, setExamDate] = useState('')
  const [dailyTarget, setDailyTarget] = useState(120)
  const [peerComparison, setPeerComparison] = useState(true)
  const [notifications, setNotifications] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id
      
      if (!userId) {
        setLoading(false)
        return
      }

      const studyUser = await getStudyUser(userId)
      if (studyUser) {
        setUser(studyUser)
        setExam(EXAM_PRESETS.includes(studyUser.exam) ? studyUser.exam : 'Other')
        setCustomExam(EXAM_PRESETS.includes(studyUser.exam) ? '' : studyUser.exam)
        setExamDate(studyUser.examDate ? studyUser.examDate.toISOString().split('T')[0] : '')
        setDailyTarget(studyUser.dailyTargetMinutes)
        setPeerComparison(studyUser.peerComparisonEnabled)
        setNotifications(studyUser.notificationsEnabled)
      }
    } catch (error) {
      console.error('Failed to load study profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!supabase || !user) return

    setSaving(true)
    setShowSuccess(false)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id
      
      if (!userId) return

      const finalExam = exam === 'Other' ? customExam : exam
      
      await updateStudyUser(userId, {
        exam: finalExam,
        examDate: examDate ? new Date(examDate) : undefined,
        dailyTargetMinutes: dailyTarget,
        peerComparisonEnabled: peerComparison,
        notificationsEnabled: notifications
      })

      // Reload to get updated data
      await loadUserProfile()
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!user) return
    
    setExam(EXAM_PRESETS.includes(user.exam) ? user.exam : 'Other')
    setCustomExam(EXAM_PRESETS.includes(user.exam) ? '' : user.exam)
    setExamDate(user.examDate ? user.examDate.toISOString().split('T')[0] : '')
    setDailyTarget(user.dailyTargetMinutes)
    setPeerComparison(user.peerComparisonEnabled)
    setNotifications(user.notificationsEnabled)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          StudyTrack profile not found. Please complete onboarding in the Track section first.
        </p>
      </div>
    )
  }

  const hasChanges = 
    (exam === 'Other' ? customExam : exam) !== user.exam ||
    (examDate ? new Date(examDate).getTime() : 0) !== (user.examDate?.getTime() || 0) ||
    dailyTarget !== user.dailyTargetMinutes ||
    peerComparison !== user.peerComparisonEnabled ||
    notifications !== user.notificationsEnabled

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            StudyTrack Profile
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Update your exam details and study preferences
          </p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Saved!</span>
          </div>
        )}
      </div>

      {/* Exam Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Exam
        </label>
        <select
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
        >
          {EXAM_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
        
        {exam === 'Other' && (
          <input
            type="text"
            value={customExam}
            onChange={(e) => setCustomExam(e.target.value)}
            placeholder="Enter your exam name"
            className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
          />
        )}
      </div>

      {/* Exam Date */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Exam Date
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
        </label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
        />
        {examDate && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
          </p>
        )}
      </div>

      {/* Daily Target */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Daily Study Target
        </label>
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {dailyTarget}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              minutes ({Math.floor(dailyTarget / 60)}h {dailyTarget % 60}m)
            </div>
          </div>
          
          <input
            type="range"
            min="30"
            max="480"
            step="15"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>30 min</span>
            <span>4 hrs</span>
            <span>8 hrs</span>
          </div>
        </div>
      </div>

      {/* Peer Comparison Toggle */}
      <div className="flex items-start justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Peer Comparison
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Compare your study time with anonymous peers preparing for the same exam
          </p>
        </div>
        <button
          onClick={() => setPeerComparison(!peerComparison)}
          className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            peerComparison ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              peerComparison ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Notifications Toggle */}
      <div className="flex items-start justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            StudyTrack Notifications
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Receive reminders for daily check-ins and weekly reality checks
          </p>
        </div>
        <button
          onClick={() => setNotifications(!notifications)}
          className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            notifications ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notifications ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="flex-1 py-3 px-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving || (exam === 'Other' && !customExam.trim())}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-accent-600 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
