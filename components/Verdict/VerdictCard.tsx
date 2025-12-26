'use client'

import { VerdictStatus, Verdict } from '@/lib/types'
import { getVerdictDisplayText } from '@/lib/verdictEngine'

interface VerdictCardProps {
  verdict: Verdict
  tone?: 'neutral' | 'direct'
}

export default function VerdictCard({ verdict, tone = 'neutral' }: VerdictCardProps) {
  const display = getVerdictDisplayText(verdict.status, tone)

  const getStatusColor = (status: VerdictStatus) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-50 border-green-200'
      case 'at-risk':
        return 'bg-yellow-50 border-yellow-200'
      case 'falling-behind':
        return 'bg-red-50 border-red-200'
    }
  }

  const getTextColor = (status: VerdictStatus) => {
    switch (status) {
      case 'on-track':
        return 'text-green-700'
      case 'at-risk':
        return 'text-yellow-700'
      case 'falling-behind':
        return 'text-red-700'
    }
  }

  return (
    <div className={`rounded-2xl border-2 p-6 ${getStatusColor(verdict.status)}`}>
      {/* Status header */}
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">{display.emoji}</div>
        <h3 className={`text-2xl font-bold ${getTextColor(verdict.status)}`}>
          {display.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{display.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {verdict.studyMinutes}
          </div>
          <div className="text-xs text-gray-600">
            of {verdict.targetMinutes} min
          </div>
        </div>
        <div className="bg-white/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(verdict.recallRatio * 100)}%
          </div>
          <div className="text-xs text-gray-600">recall rate</div>
        </div>
      </div>

      {/* Additional info */}
      <div className="space-y-2">
        {verdict.streak > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-orange-500">🔥</span>
            <span className="text-gray-700">
              {verdict.streak} day{verdict.streak > 1 ? 's' : ''} streak
            </span>
          </div>
        )}
        {verdict.daysToExam !== undefined && verdict.daysToExam >= 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-500">📅</span>
            <span className="text-gray-700">
              {verdict.daysToExam} days = ~{verdict.daysToExam} honest study session{verdict.daysToExam === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* Reasons */}
      {verdict.reasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <ul className="space-y-1">
            {verdict.reasons.map((reason, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
