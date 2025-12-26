import { DailyCheckIn, Verdict } from './types'

/**
 * LAYER 2: Recovery Intelligence
 * Calculate fastest recovery path after inactivity
 */

export interface RecoveryPath {
  daysInactive: number
  recommendedDays: number
  dailyMinutes: number
  rationale: string
  difficulty: 'easy' | 'moderate' | 'challenging'
}

export function calculateRecoveryPath(
  lastCheckInDate: string,
  user: { dailyTargetMinutes: number },
  pastBestStreak: number
): RecoveryPath {
  const lastDate = new Date(lastCheckInDate)
  const today = new Date()
  const daysInactive = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  // Recovery strategy based on past performance
  const baseRecoveryDays = Math.min(7, Math.ceil(daysInactive / 2))
  
  // Adjust for past streak strength
  const streakFactor = pastBestStreak >= 14 ? 0.8 : pastBestStreak >= 7 ? 0.9 : 1.0
  const recommendedDays = Math.ceil(baseRecoveryDays * streakFactor)

  // Start with reduced load
  const targetReductionFactor = daysInactive >= 14 ? 0.5 : daysInactive >= 7 ? 0.7 : 0.85
  const dailyMinutes = Math.round(user.dailyTargetMinutes * targetReductionFactor)

  // Determine difficulty
  let difficulty: RecoveryPath['difficulty']
  if (daysInactive >= 21) {
    difficulty = 'challenging'
  } else if (daysInactive >= 7) {
    difficulty = 'moderate'
  } else {
    difficulty = 'easy'
  }

  // Generate rationale
  const rationale = difficulty === 'challenging'
    ? `After ${daysInactive} days away, start light. You've done this before.`
    : difficulty === 'moderate'
    ? `You can realistically get back on track in ${recommendedDays} days with ${dailyMinutes} min/day.`
    : `Quick restart: ${recommendedDays} days at ${dailyMinutes} min/day gets you back.`

  return {
    daysInactive,
    recommendedDays,
    dailyMinutes,
    rationale,
    difficulty
  }
}

/**
 * LAYER 2: Decision Relief Mode
 * Generate lowest cognitive load task
 */

export function generateDecisionReliefTask(
  recentCheckIns: DailyCheckIn[],
  verdict: Verdict
): { task: string; durationMinutes: number; relatedSubjects: string[] } {
  // Always under 20 minutes
  // Extremely specific, no decisions needed

  if (recentCheckIns.length === 0) {
    return {
      task: 'Review any 5 flashcards from last week',
      durationMinutes: 15,
      relatedSubjects: []
    }
  }

  // Find subject studied most recently
  const lastSubject = recentCheckIns[0]?.subject || 'any subject'
  
  // Low cognitive load tasks
  const tasks = [
    {
      task: `Skim through ${lastSubject} notes for 15 min — just read, no memorizing`,
      durationMinutes: 15,
      relatedSubjects: [lastSubject]
    },
    {
      task: `Write down 3 things you remember about ${lastSubject} without notes`,
      durationMinutes: 10,
      relatedSubjects: [lastSubject]
    },
    {
      task: `Review any 5 ${lastSubject} flashcards`,
      durationMinutes: 12,
      relatedSubjects: [lastSubject]
    },
    {
      task: `Explain ${lastSubject} basics out loud for 10 min (to yourself)`,
      durationMinutes: 10,
      relatedSubjects: [lastSubject]
    }
  ]

  // Pick based on recall status
  const recentRecall = recentCheckIns[0]?.couldRevise
  const index = recentRecall ? 0 : 1 // If recall was good, skim. If not, write down.

  return tasks[index]
}

/**
 * LAYER 2: Subject Confidence Heatmap
 * Build private subject × recall matrix
 */

export interface SubjectConfidence {
  subject: string
  totalSessions: number
  yesCount: number
  noCount: number
  recallRate: number
  color: 'green' | 'yellow' | 'red'
  confidence: 'high' | 'medium' | 'low'
}

export function buildSubjectConfidenceMap(checkIns: DailyCheckIn[]): SubjectConfidence[] {
  const subjectMap = new Map<string, { yes: number; no: number; total: number }>()

  for (const checkIn of checkIns) {
    const current = subjectMap.get(checkIn.subject) || { yes: 0, no: 0, total: 0 }
    current.total++
    if (checkIn.couldRevise) {
      current.yes++
    } else {
      current.no++
    }
    subjectMap.set(checkIn.subject, current)
  }

  const results: SubjectConfidence[] = []

  for (const [subject, stats] of subjectMap.entries()) {
    const recallRate = stats.yes / stats.total
    
    let color: SubjectConfidence['color']
    let confidence: SubjectConfidence['confidence']

    if (recallRate >= 0.7) {
      color = 'green'
      confidence = 'high'
    } else if (recallRate >= 0.4) {
      color = 'yellow'
      confidence = 'medium'
    } else {
      color = 'red'
      confidence = 'low'
    }

    results.push({
      subject,
      totalSessions: stats.total,
      yesCount: stats.yes,
      noCount: stats.no,
      recallRate,
      color,
      confidence
    })
  }

  return results.sort((a, b) => a.recallRate - b.recallRate) // Weakest first
}
