'use client'

import type { 
  SyllabusCoverage, 
  HighYieldWeakness, 
  RevisionROI,
  StrategicInsight 
} from '@/lib/preparationState.types'
import type { ExamReadiness } from '@/lib/preparationDiagnostics'

interface DiagnosticDashboardProps {
  coverage: SyllabusCoverage
  weaknesses: HighYieldWeakness[]
  rois: RevisionROI[]
  insights: StrategicInsight[]
  readiness: ExamReadiness
  daysToExam: number | null
}

export default function DiagnosticDashboard({
  coverage,
  weaknesses,
  rois,
  insights,
  readiness,
  daysToExam
}: DiagnosticDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Exam Readiness Banner */}
      <ReadinessBanner readiness={readiness} daysToExam={daysToExam} />

      {/* Coverage Visualization */}
      <CoverageCard coverage={coverage} />

      {/* Strategic Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">What to do now</h3>
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      )}

      {/* High-Yield Weaknesses */}
      {weaknesses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Your marks leaks
            <span className="ml-2 text-sm font-normal text-gray-500">
              (sorted by priority)
            </span>
          </h3>
          <div className="space-y-2">
            {weaknesses.slice(0, 5).map(weakness => (
              <WeaknessCard key={weakness.topicId} weakness={weakness} />
            ))}
          </div>
        </div>
      )}

      {/* Revision ROI */}
      {rois.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Best revision ROI
            <span className="ml-2 text-sm font-normal text-gray-500">
              (marks gained / hour spent)
            </span>
          </h3>
          <div className="space-y-2">
            {rois.slice(0, 5).map(roi => (
              <ROICard key={roi.topicId} roi={roi} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Readiness Banner
// ============================================================================

function ReadinessBanner({ 
  readiness, 
  daysToExam 
}: { 
  readiness: ExamReadiness
  daysToExam: number | null 
}) {
  const statusColors = {
    'exam-ready': 'bg-green-100 border-green-300 text-green-900',
    'needs-work': 'bg-yellow-100 border-yellow-300 text-yellow-900',
    'major-gaps': 'bg-red-100 border-red-300 text-red-900'
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${statusColors[readiness.status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{readiness.overallScore}% Ready</div>
          <div className="text-sm mt-1">{readiness.recommendation}</div>
        </div>
        {daysToExam !== null && (
          <div className="text-right">
            <div className="text-3xl font-bold">{daysToExam}</div>
            <div className="text-sm">days to exam</div>
          </div>
        )}
      </div>
      {readiness.daysNeeded !== null && (
        <div className="mt-2 text-sm font-medium">
          Est. {readiness.daysNeeded} days needed to close gaps
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Coverage Card
// ============================================================================

function CoverageCard({ coverage }: { coverage: SyllabusCoverage }) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-semibold text-gray-900 mb-3">True syllabus coverage</h3>
      
      {/* Progress Bar */}
      <div className="flex h-8 rounded-lg overflow-hidden mb-3">
        {coverage.strongCount > 0 && (
          <div 
            className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
            style={{ width: `${coverage.strongPct}%` }}
          >
            {coverage.strongPct}%
          </div>
        )}
        {coverage.shakyCount > 0 && (
          <div 
            className="bg-yellow-500 flex items-center justify-center text-white text-sm font-medium"
            style={{ width: `${coverage.shakyPct}%` }}
          >
            {coverage.shakyPct}%
          </div>
        )}
        {coverage.weakCount > 0 && (
          <div 
            className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
            style={{ width: `${coverage.weakPct}%` }}
          >
            {coverage.weakPct}%
          </div>
        )}
        {coverage.untouchedCount > 0 && (
          <div 
            className="bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-medium"
            style={{ width: `${coverage.untouchedPct}%` }}
          >
            {coverage.untouchedPct}%
          </div>
        )}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{coverage.strongCount}</div>
          <div className="text-gray-600">🟢 Strong</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{coverage.shakyCount}</div>
          <div className="text-gray-600">🟡 Shaky</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{coverage.weakCount}</div>
          <div className="text-gray-600">🔴 Weak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{coverage.untouchedCount}</div>
          <div className="text-gray-600">⚪ Untouched</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Insight Card
// ============================================================================

function InsightCard({ insight }: { insight: StrategicInsight }) {
  const priorityColors = {
    critical: 'bg-red-50 border-red-300',
    high: 'bg-orange-50 border-orange-300',
    medium: 'bg-yellow-50 border-yellow-300'
  }

  const priorityBadge = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white'
  }

  return (
    <div className={`p-4 rounded-lg border ${priorityColors[insight.priority]}`}>
      <div className="flex items-start gap-3">
        <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${priorityBadge[insight.priority]}`}>
          {insight.priority}
        </span>
        <div className="flex-1">
          <div className="font-medium text-gray-900">{insight.message}</div>
          <div className="text-sm text-gray-600 mt-1">{insight.estimatedImpact}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Weakness Card
// ============================================================================

function WeaknessCard({ weakness }: { weakness: HighYieldWeakness }) {
  return (
    <div className="p-3 bg-white rounded-lg border hover:border-red-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {weakness.state === 'weak' ? '🔴' : weakness.state === 'shaky' ? '🟡' : '⚪'}
            </span>
            <h4 className="font-medium text-gray-900">{weakness.topicName}</h4>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {weakness.subject} • Appears ~{weakness.avgQuestions}× per year • {weakness.estimatedHours}h
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-600">{weakness.priorityScore}</div>
          <div className="text-xs text-gray-500">priority</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ROI Card
// ============================================================================

function ROICard({ roi }: { roi: RevisionROI }) {
  return (
    <div className="p-3 bg-white rounded-lg border hover:border-green-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{roi.topicName}</h4>
            {roi.fitsInTime && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                QUICK WIN
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {roi.subject} • {roi.estimatedHours}h → ~{roi.potentialMarksGain} marks
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{roi.roiScore}×</div>
          <div className="text-xs text-gray-500">marks/hour</div>
        </div>
      </div>
    </div>
  )
}
