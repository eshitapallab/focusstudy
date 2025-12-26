'use client'

import { useState } from 'react'
import type { SyllabusTopic, TopicPreparedness, PreparednessState } from '@/lib/preparationState.types'
import { getStateEmoji, getStateLabel } from '@/lib/preparationState.types'

interface PreparednessMatrixProps {
  subjects: string[]
  topics: SyllabusTopic[]
  preparedness: Map<string, TopicPreparedness> // topicId → preparedness
  onStateChange: (topicId: string, newState: PreparednessState) => void
}

export default function PreparednessMatrix({ 
  subjects, 
  topics, 
  preparedness, 
  onStateChange 
}: PreparednessMatrixProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] || '')
  
  const subjectTopics = topics.filter(t => t.subject === selectedSubject)

  return (
    <div className="space-y-4">
      {/* Subject Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {subjects.map(subject => (
          <button
            key={subject}
            onClick={() => setSelectedSubject(subject)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedSubject === subject
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Matrix Grid */}
      <div className="space-y-2">
        {subjectTopics.map(topic => {
          const prep = preparedness.get(topic.id) || {
            id: '',
            userId: '',
            topicId: topic.id,
            state: 'untouched' as PreparednessState,
            confidenceScore: 0,
            lastRevisedAt: undefined,
            daysSinceRevision: undefined,
            revisionCount: 0,
            stateChangedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }

          return (
            <TopicRow
              key={topic.id}
              topic={topic}
              preparedness={prep}
              onStateChange={onStateChange}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-gray-600 pt-4 border-t">
        <div className="flex items-center gap-2">
          <span>🟢</span>
          <span>Strong (can teach)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🟡</span>
          <span>Shaky (need refresh)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔴</span>
          <span>Weak (struggle)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⚪</span>
          <span>Untouched (never studied)</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Individual Topic Row
// ============================================================================

interface TopicRowProps {
  topic: SyllabusTopic
  preparedness: TopicPreparedness
  onStateChange: (topicId: string, newState: PreparednessState) => void
}

function TopicRow({ topic, preparedness, onStateChange }: TopicRowProps) {
  const states: PreparednessState[] = ['strong', 'shaky', 'weak', 'untouched']

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
      {/* Topic Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{topic.name}</h4>
          {topic.examWeight >= 7 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
              HIGH WEIGHT
            </span>
          )}
        </div>
        <div className="flex gap-4 text-xs text-gray-500 mt-1">
          <span>Weight: {topic.examWeight}/10</span>
          <span>~{topic.avgQuestionsPerYear}Q/year</span>
          <span>{topic.estimatedHours}h</span>
          {preparedness.revisionCount > 0 && (
            <span className="text-green-600">✓ {preparedness.revisionCount} revisions</span>
          )}
        </div>
      </div>

      {/* State Selector */}
      <div className="flex gap-1">
        {states.map(state => (
          <button
            key={state}
            onClick={() => onStateChange(topic.id, state)}
            className={`w-10 h-10 rounded-lg text-lg transition-all ${
              preparedness.state === state
                ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            title={getStateLabel(state)}
          >
            {getStateEmoji(state)}
          </button>
        ))}
      </div>

      {/* Decay Warning */}
      {preparedness.state === 'strong' && 
       preparedness.daysSinceRevision !== null &&
       preparedness.daysSinceRevision !== undefined && 
       preparedness.daysSinceRevision > 30 && (
        <div className="text-yellow-600 text-sm">
          ⚠️ {preparedness.daysSinceRevision}d ago
        </div>
      )}
    </div>
  )
}
