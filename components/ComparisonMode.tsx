'use client'

import { useState, useEffect } from 'react'
import { compareWeeks, compareMonths, ComparisonData, getComparisonInsights } from '@/lib/comparisonAnalytics'

type ComparisonPeriod = 'week' | 'month'

export default function ComparisonMode() {
  const [period, setPeriod] = useState<ComparisonPeriod>('week')
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComparison()
  }, [period])

  const loadComparison = async () => {
    setLoading(true)
    
    try {
      const result = period === 'week' 
        ? await compareWeeks() 
        : await compareMonths()
      
      setData(result)
    } catch (error) {
      console.error('Failed to load comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    )
  }

  const insights = getComparisonInsights(data)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary dark:text-white">
          Comparison Mode
        </h2>
        
        {/* Period selector */}
        <div className="flex gap-2 bg-surface dark:bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-primary text-white'
                : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-primary text-white'
                : 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Current Period */}
        <div className="bg-primary-50 dark:bg-gray-900 rounded-xl p-4 border-2 border-primary">
          <h3 className="text-sm font-semibold text-primary mb-3">
            This {period === 'week' ? 'Week' : 'Month'}
          </h3>
          
          <div className="space-y-3">
            <StatRow
              label="Total Study Time"
              value={`${data.current.totalMinutes} min`}
              change={data.change.totalMinutes}
            />
            <StatRow
              label="Sessions"
              value={data.current.sessionCount.toString()}
              change={data.change.sessionCount}
            />
            <StatRow
              label="Avg Session"
              value={`${data.current.avgSessionMinutes} min`}
              change={data.change.avgSessionMinutes}
            />
            <StatRow
              label="Focus Score"
              value={data.current.focusScore.toString()}
              change={data.change.focusScore}
              highlight
            />
            <StatRow
              label="Distractions"
              value={data.current.totalDistractions.toString()}
              change={null}
            />
          </div>
        </div>

        {/* Previous Period */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-text-secondary dark:text-gray-400 mb-3">
            Previous {period === 'week' ? 'Week' : 'Month'}
          </h3>
          
          <div className="space-y-3 opacity-75">
            <StatRow
              label="Total Study Time"
              value={`${data.previous.totalMinutes} min`}
              change={null}
            />
            <StatRow
              label="Sessions"
              value={data.previous.sessionCount.toString()}
              change={null}
            />
            <StatRow
              label="Avg Session"
              value={`${data.previous.avgSessionMinutes} min`}
              change={null}
            />
            <StatRow
              label="Focus Score"
              value={data.previous.focusScore.toString()}
              change={null}
            />
            <StatRow
              label="Distractions"
              value={data.previous.totalDistractions.toString()}
              change={null}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-primary-accent dark:text-accent-300 mb-3">
          Insights
        </h3>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="text-sm text-text-secondary dark:text-gray-300">
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatRow({ 
  label, 
  value, 
  change, 
  highlight = false 
}: { 
  label: string
  value: string
  change: number | null
  highlight?: boolean 
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary dark:text-gray-400">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${
          highlight 
            ? 'text-primary text-lg' 
            : 'text-text-primary dark:text-white'
        }`}>
          {value}
        </span>
        {change !== null && (
          <ChangeIndicator value={change} />
        )}
      </div>
    </div>
  )
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="text-xs text-text-secondary dark:text-gray-500">
        —
      </span>
    )
  }
  
  const isPositive = value > 0
  const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
  const arrow = isPositive ? '↑' : '↓'
  
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {arrow} {Math.abs(value)}%
    </span>
  )
}
