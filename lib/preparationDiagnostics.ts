/**
 * PREPARATION DIAGNOSTIC ENGINE
 * The real value: answering "What should I revise to gain marks?"
 */

import type {
  TopicPreparedness,
  SyllabusTopic,
  SyllabusCoverage,
  HighYieldWeakness,
  RevisionROI,
  StrategicInsight,
  MockMistake,
  PreparednessState
} from './preparationState.types'

// ============================================================================
// DIAGNOSTIC 1: True Syllabus Coverage (Not effort, actual readiness)
// ============================================================================

export function analyzeCoverage(preparedness: TopicPreparedness[]): SyllabusCoverage {
  const total = preparedness.length
  
  if (total === 0) {
    return {
      totalTopics: 0,
      strongCount: 0,
      shakyCount: 0,
      weakCount: 0,
      untouchedCount: 0,
      strongPct: 0,
      shakyPct: 0,
      weakPct: 0,
      untouchedPct: 0
    }
  }

  const strongCount = preparedness.filter(p => p.state === 'strong').length
  const shakyCount = preparedness.filter(p => p.state === 'shaky').length
  const weakCount = preparedness.filter(p => p.state === 'weak').length
  const untouchedCount = preparedness.filter(p => p.state === 'untouched').length

  return {
    totalTopics: total,
    strongCount,
    shakyCount,
    weakCount,
    untouchedCount,
    strongPct: Math.round((strongCount / total) * 100),
    shakyPct: Math.round((shakyCount / total) * 100),
    weakPct: Math.round((weakCount / total) * 100),
    untouchedPct: Math.round((untouchedCount / total) * 100)
  }
}

// ============================================================================
// DIAGNOSTIC 2: High-Yield Weaknesses (Where marks are leaking)
// ============================================================================

export function findMarksLeaks(
  preparedness: TopicPreparedness[],
  topics: SyllabusTopic[],
  limit: number = 10
): HighYieldWeakness[] {
  const topicMap = new Map(topics.map(t => [t.id, t]))
  
  const weaknesses: HighYieldWeakness[] = []

  for (const prep of preparedness) {
    // Only look at non-strong topics
    if (prep.state === 'strong') continue

    const topic = topicMap.get(prep.topicId)
    if (!topic) continue

    // Priority score: (exam_weight * weakness_multiplier) / time_cost
    const weaknessMultiplier = 
      prep.state === 'weak' ? 3.0 :
      prep.state === 'shaky' ? 2.0 :
      prep.state === 'untouched' ? 1.5 : 0

    const priorityScore = (topic.examWeight * weaknessMultiplier) / Math.max(topic.estimatedHours, 0.5)

    weaknesses.push({
      topicId: topic.id,
      topicName: topic.name,
      subject: topic.subject,
      state: prep.state,
      examWeight: topic.examWeight,
      avgQuestions: topic.avgQuestionsPerYear,
      estimatedHours: topic.estimatedHours,
      priorityScore: Math.round(priorityScore * 100) / 100
    })
  }

  // Sort by priority (highest first) and limit
  return weaknesses
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit)
}

// ============================================================================
// DIAGNOSTIC 3: Revision ROI Ranking (Fastest marks gains)
// ============================================================================

export function calculateRevisionROI(
  preparedness: TopicPreparedness[],
  topics: SyllabusTopic[],
  availableHours: number = 20
): RevisionROI[] {
  const topicMap = new Map(topics.map(t => [t.id, t]))
  
  const rois: RevisionROI[] = []

  for (const prep of preparedness) {
    if (prep.state === 'strong') continue // Already strong, low ROI

    const topic = topicMap.get(prep.topicId)
    if (!topic) continue

    // Potential marks = exam_weight * avg_questions * state_multiplier
    const stateMultiplier =
      prep.state === 'weak' ? 0.8 :
      prep.state === 'shaky' ? 0.5 :
      prep.state === 'untouched' ? 0.3 : 0

    const potentialMarksGain = topic.examWeight * topic.avgQuestionsPerYear * stateMultiplier

    // ROI = marks_gain / hours_needed
    const roiScore = potentialMarksGain / Math.max(topic.estimatedHours, 0.5)

    rois.push({
      topicId: topic.id,
      topicName: topic.name,
      subject: topic.subject,
      currentState: prep.state,
      examWeight: topic.examWeight,
      estimatedHours: topic.estimatedHours,
      potentialMarksGain: Math.round(potentialMarksGain * 100) / 100,
      roiScore: Math.round(roiScore * 100) / 100,
      fitsInTime: topic.estimatedHours <= availableHours
    })
  }

  // Sort by ROI (highest first)
  return rois.sort((a, b) => b.roiScore - a.roiScore)
}

// ============================================================================
// DIAGNOSTIC 4: Strategic Insights (Auto-generated recommendations)
// ============================================================================

export function generateStrategicInsights(
  coverage: SyllabusCoverage,
  weaknesses: HighYieldWeakness[],
  rois: RevisionROI[],
  mockMistakes?: MockMistake[]
): StrategicInsight[] {
  const insights: StrategicInsight[] = []

  // Insight 1: Biggest marks leak
  if (weaknesses.length > 0) {
    const top = weaknesses[0]
    insights.push({
      type: 'marks-leak',
      priority: 'critical',
      message: `Your biggest marks leak: ${top.topicName} (${top.subject}). This appears ${top.avgQuestions}× per year.`,
      actionableTopics: [top.topicId],
      estimatedImpact: `Can prevent ~${Math.round(top.avgQuestions * top.examWeight)} marks loss`
    })
  }

  // Insight 2: Quick wins (high ROI, fits in time)
  const quickWins = rois.filter(r => r.fitsInTime && r.roiScore > 1.5).slice(0, 3)
  if (quickWins.length > 0) {
    insights.push({
      type: 'quick-win',
      priority: 'high',
      message: `Quick wins: ${quickWins.map(q => q.topicName).join(', ')}. High marks/hour ratio.`,
      actionableTopics: quickWins.map(q => q.topicId),
      estimatedImpact: `Can gain ~${Math.round(quickWins.reduce((sum, q) => sum + q.potentialMarksGain, 0))} marks`
    })
  }

  // Insight 3: Coverage crisis
  if (coverage.untouchedPct > 40) {
    insights.push({
      type: 'marks-leak',
      priority: 'critical',
      message: `${coverage.untouchedPct}% syllabus untouched. Focus on breadth before depth.`,
      actionableTopics: [],
      estimatedImpact: 'Critical for exam readiness'
    })
  }

  // Insight 4: Mock test patterns (if provided)
  if (mockMistakes && mockMistakes.length > 0) {
    const conceptMistakes = mockMistakes.filter(m => m.mistakeType === 'concept')
    if (conceptMistakes.length > 0) {
      const topicIds = [...new Set(conceptMistakes.map(m => m.topicId))]
      insights.push({
        type: 'mock-pattern',
        priority: 'high',
        message: `Repeated concept errors in ${topicIds.length} topics. These need deep revision.`,
        actionableTopics: topicIds,
        estimatedImpact: `Lost ${conceptMistakes.reduce((sum, m) => sum + m.marksLost, 0)} marks in last mock`
      })
    }
  }

  return insights
}

// ============================================================================
// DIAGNOSTIC 5: Decay Detection (Forgetting curve)
// ============================================================================

export function detectDecayRisks(
  preparedness: TopicPreparedness[],
  topics: SyllabusTopic[]
): StrategicInsight[] {
  const topicMap = new Map(topics.map(t => [t.id, t]))
  const risks: StrategicInsight[] = []

  // Find strong topics that haven't been revised in 30+ days
  const decayingStrong = preparedness.filter(
    p => p.state === 'strong' && p.daysSinceRevision && p.daysSinceRevision > 30
  )

  if (decayingStrong.length > 0) {
    const highValueDecaying = decayingStrong
      .map(p => ({ prep: p, topic: topicMap.get(p.topicId) }))
      .filter(({ topic }) => topic && topic.examWeight >= 5)
      .slice(0, 5)

    if (highValueDecaying.length > 0) {
      risks.push({
        type: 'decay-alert',
        priority: 'medium',
        message: `${highValueDecaying.length} strong topics at risk of forgetting. Quick refresh needed.`,
        actionableTopics: highValueDecaying.map(({ prep }) => prep.topicId),
        estimatedImpact: 'Maintain existing preparation'
      })
    }
  }

  // Find shaky topics that haven't been revised in 21+ days
  const decayingShaky = preparedness.filter(
    p => p.state === 'shaky' && p.daysSinceRevision && p.daysSinceRevision > 21
  )

  if (decayingShaky.length > 0) {
    risks.push({
      type: 'decay-alert',
      priority: 'high',
      message: `${decayingShaky.length} shaky topics becoming weak. Revise before decay.`,
      actionableTopics: decayingShaky.map(p => p.topicId),
      estimatedImpact: 'Prevent confidence loss'
    })
  }

  return risks
}

// ============================================================================
// UTILITY: Smart daily micro-action (topic-based, not time-based)
// ============================================================================

export function generateSmartMicroAction(
  weaknesses: HighYieldWeakness[],
  rois: RevisionROI[]
): { topic: string; action: string; reason: string } | null {
  // Priority 1: Quick wins that fit in <30 min
  const quickWin = rois.find(r => r.fitsInTime && r.estimatedHours <= 0.5)
  if (quickWin) {
    return {
      topic: quickWin.topicName,
      action: `Quick revision: ${quickWin.topicName} (30 min)`,
      reason: `High ROI (${quickWin.roiScore}× marks/hour). Can gain ~${quickWin.potentialMarksGain} marks.`
    }
  }

  // Priority 2: Biggest leak
  if (weaknesses.length > 0) {
    const leak = weaknesses[0]
    return {
      topic: leak.topicName,
      action: `Start ${leak.topicName} basics (${leak.estimatedHours}h total)`,
      reason: `Your biggest marks leak. Appears ${leak.avgQuestions}× per year.`
    }
  }

  return null
}

// ============================================================================
// UTILITY: Exam readiness assessment
// ============================================================================

export interface ExamReadiness {
  overallScore: number // 0-100
  status: 'exam-ready' | 'needs-work' | 'major-gaps'
  daysNeeded: number | null // Realistic estimate to get exam-ready
  recommendation: string
}

export function assessExamReadiness(
  coverage: SyllabusCoverage,
  daysToExam: number | null
): ExamReadiness {
  // Score: strong=1.0, shaky=0.6, weak=0.3, untouched=0
  const score = Math.round(
    ((coverage.strongCount * 1.0 +
      coverage.shakyCount * 0.6 +
      coverage.weakCount * 0.3) / coverage.totalTopics) * 100
  )

  let status: ExamReadiness['status']
  let daysNeeded: number | null = null
  let recommendation: string

  if (score >= 75) {
    status = 'exam-ready'
    recommendation = 'Focus on weak topics and mock tests. You\'re in good shape.'
  } else if (score >= 50) {
    status = 'needs-work'
    const remainingTopics = coverage.weakCount + coverage.untouchedCount
    daysNeeded = Math.ceil(remainingTopics * 0.5) // Assume 2 topics/day
    recommendation = `Focus on ${coverage.weakCount} weak and ${coverage.untouchedCount} untouched topics. You have work to do.`
  } else {
    status = 'major-gaps'
    const remainingTopics = coverage.shakyCount + coverage.weakCount + coverage.untouchedCount
    daysNeeded = Math.ceil(remainingTopics * 0.7) // Need more time per topic
    recommendation = `Significant gaps (${coverage.untouchedPct}% uncovered). Consider realistic timeline adjustment.`
  }

  // Reality check against days to exam
  if (daysToExam !== null && daysNeeded !== null && daysNeeded > daysToExam) {
    recommendation += ` Warning: You need ~${daysNeeded} days but have ${daysToExam}.`
  }

  return {
    overallScore: score,
    status,
    daysNeeded,
    recommendation
  }
}
