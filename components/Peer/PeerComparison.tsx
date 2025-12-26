'use client'

import { useState, useEffect } from 'react'
import { CohortStats } from '@/lib/types'
import { getCohortStats } from '@/lib/supabaseStudyTrack'

interface PeerComparisonProps {
  exam: string
  todayMinutes: number
  enabled: boolean
  onToggle: () => void
}

export default function PeerComparison({ exam, todayMinutes, enabled, onToggle }: PeerComparisonProps) {
  const [cohortStats, setCohortStats] = useState<CohortStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const stats = await getCohortStats(exam, today)
        setCohortStats(stats)
      } catch (error) {
        console.error('Failed to load cohort stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [exam, enabled])

  if (!enabled) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              Compare with peers
            </h3>
            <p className="text-sm text-gray-600">
              See how others preparing for {exam} are doing
            </p>
          </div>
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enable
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-blue-700">Loading peer data...</span>
        </div>
      </div>
    )
  }

  if (!cohortStats) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-700 mb-1">
              Peer data unavailable
            </h3>
            <p className="text-sm text-gray-600">
              Not enough data yet for {exam} aspirants
            </p>
          </div>
          <button
            onClick={onToggle}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Hide
          </button>
        </div>
      </div>
    )
  }

  const diff = todayMinutes - cohortStats.medianStudyMinutes
  const isAbove = diff > 0
  const isEqual = Math.abs(diff) < 15

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-medium text-blue-900 mb-1">
            Peer Comparison
          </h3>
          <p className="text-sm text-blue-700">
            {cohortStats.participantCount.toLocaleString()} {exam} aspirants
          </p>
        </div>
        <button
          onClick={onToggle}
          className="text-sm text-blue-700 hover:text-blue-900"
        >
          Hide
        </button>
      </div>

      {/* Comparison */}
      <div className="bg-white rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">You</div>
            <div className="text-2xl font-bold text-gray-900">
              {todayMinutes}
            </div>
            <div className="text-xs text-gray-600">minutes</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Median</div>
            <div className="text-2xl font-bold text-gray-900">
              {cohortStats.medianStudyMinutes}
            </div>
            <div className="text-xs text-gray-600">minutes</div>
          </div>
        </div>

        {/* Status */}
        <div className="pt-3 border-t border-gray-100">
          {isEqual ? (
            <p className="text-sm text-gray-700">
              ✓ Right on pace with peers
            </p>
          ) : isAbove ? (
            <p className="text-sm text-green-700">
              ↑ {Math.abs(diff)} min above median
            </p>
          ) : (
            <p className="text-sm text-orange-700">
              ↓ {Math.abs(diff)} min below median
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-blue-600 mt-3">
        All data is anonymous. Updated daily.
      </p>
    </div>
  )
}
