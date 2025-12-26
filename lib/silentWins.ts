import { Verdict } from './types'

/**
 * LAYER 3: Silent Wins Detection
 * Identify subtle improvements that deserve recognition
 */

export type SilentWinType =
  | 'recall_improved'
  | 'reduced_overstudying'
  | 'returned_after_gap'
  | 'consistency_restored'
  | 'honest_about_weakness'
  | 'stable_routine'

export interface SilentWin {
  type: SilentWinType
  description: string
  date: string
}

export function detectSilentWins(
  currentVerdict: Verdict,
  recentVerdicts: Verdict[],
  daysInactive?: number
): SilentWin | null {
  const today = new Date().toISOString().split('T')[0]

  // Win 1: Recall improved
  if (recentVerdicts.length >= 2) {
    const lastWeekAvgRecall = recentVerdicts.slice(0, 7).reduce((sum, v) => sum + v.recallRatio, 0) / Math.min(7, recentVerdicts.length)
    const prevWeekAvgRecall = recentVerdicts.slice(7, 14).reduce((sum, v) => sum + v.recallRatio, 0) / Math.min(7, recentVerdicts.slice(7, 14).length)

    if (lastWeekAvgRecall > prevWeekAvgRecall + 0.15) {
      return {
        type: 'recall_improved',
        description: 'Small win: recall improved this week',
        date: today
      }
    }
  }

  // Win 2: Reduced overstudying (high time but keeping balance)
  if (currentVerdict.studyMinutes < currentVerdict.targetMinutes * 1.5 && currentVerdict.studyMinutes >= currentVerdict.targetMinutes * 0.8) {
    const last3 = recentVerdicts.slice(0, 3)
    const avgOverstudying = last3.reduce((sum, v) => sum + (v.studyMinutes - v.targetMinutes), 0) / 3

    if (avgOverstudying > currentVerdict.targetMinutes * 0.5) {
      return {
        type: 'reduced_overstudying',
        description: 'Small win: found sustainable pace',
        date: today
      }
    }
  }

  // Win 3: Returned after gap
  if (daysInactive && daysInactive >= 5) {
    return {
      type: 'returned_after_gap',
      description: `Small win: came back after ${daysInactive} days`,
      date: today
    }
  }

  // Win 4: Consistency restored
  if (currentVerdict.streak >= 5 && recentVerdicts.length >= 10) {
    const had3DayGap = recentVerdicts.slice(5, 10).some((v, i, arr) => {
      if (i === 0) return false
      const prevDate = new Date(arr[i - 1].date)
      const currDate = new Date(v.date)
      const gap = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      return gap >= 3
    })

    if (had3DayGap) {
      return {
        type: 'consistency_restored',
        description: 'Small win: rebuilt your streak',
        date: today
      }
    }
  }

  // Win 5: Stable routine (low variance)
  if (recentVerdicts.length >= 7) {
    const last7Minutes = recentVerdicts.slice(0, 7).map(v => v.studyMinutes)
    const mean = last7Minutes.reduce((a, b) => a + b, 0) / 7
    const variance = last7Minutes.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / 7
    const stdDev = Math.sqrt(variance)

    if (stdDev < 30 && currentVerdict.streak >= 7) {
      return {
        type: 'stable_routine',
        description: 'Small win: very stable routine',
        date: today
      }
    }
  }

  return null
}

/**
 * LAYER 3: Verdict Change Explanation
 * Explain what caused verdict to change
 */

export interface VerdictChangeInsight {
  fromStatus: string
  toStatus: string
  primaryReason: string
  secondaryReasons: string[]
  action: string
}

export function explainVerdictChange(
  previousVerdict: Verdict | null,
  currentVerdict: Verdict
): VerdictChangeInsight | null {
  if (!previousVerdict || previousVerdict.status === currentVerdict.status) {
    return null
  }

  const reasons = currentVerdict.reasons
  const primaryReason = reasons[0] || 'multiple factors'

  // Determine action
  let action = ''
  if (currentVerdict.status === 'on-track' && previousVerdict.status !== 'on-track') {
    action = 'Keep this momentum going'
  } else if (currentVerdict.status === 'falling-behind') {
    action = 'Focus on basics today'
  } else {
    action = 'Stay consistent'
  }

  return {
    fromStatus: previousVerdict.status,
    toStatus: currentVerdict.status,
    primaryReason: primaryReason.toLowerCase(),
    secondaryReasons: reasons.slice(1).map(r => r.toLowerCase()),
    action
  }
}

/**
 * LAYER 3: Exam Pressure Simulation
 * Convert time remaining → realistic sessions
 */

export interface ExamPressureInsight {
  daysRemaining: number
  sessionsRemaining: number
  averageSessionMinutes: number
  pressureLevel: 'low' | 'moderate' | 'high' | 'critical'
  message: string
}

export function calculateExamPressure(
  examDate: Date,
  dailyTargetMinutes: number,
  recentVerdicts: Verdict[]
): ExamPressureInsight {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate realistic sessions (accounting for rest days)
  const workDaysRatio = 0.85 // Assume 1-2 rest days per week
  const sessionsRemaining = Math.floor(daysRemaining * workDaysRatio)

  // Get actual average performance
  const recentAvgMinutes = recentVerdicts.length > 0
    ? recentVerdicts.slice(0, 7).reduce((sum, v) => sum + v.studyMinutes, 0) / Math.min(7, recentVerdicts.length)
    : dailyTargetMinutes

  const averageSessionMinutes = Math.round(recentAvgMinutes)

  // Determine pressure level
  let pressureLevel: ExamPressureInsight['pressureLevel']
  let message: string

  if (daysRemaining > 90) {
    pressureLevel = 'low'
    message = `You have ~${sessionsRemaining} honest sessions left. Pace yourself.`
  } else if (daysRemaining > 30) {
    pressureLevel = 'moderate'
    message = `~${sessionsRemaining} sessions to go. Consistency matters now.`
  } else if (daysRemaining > 14) {
    pressureLevel = 'high'
    message = `${sessionsRemaining} sessions remaining. Focus on weak areas.`
  } else {
    pressureLevel = 'critical'
    message = `${sessionsRemaining} sessions left. Revise what you know best.`
  }

  return {
    daysRemaining,
    sessionsRemaining,
    averageSessionMinutes,
    pressureLevel,
    message
  }
}
