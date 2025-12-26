import { VerdictStatus, DailyCheckIn, Verdict, User } from './types'
import { getRecentCheckIns, getRecentVerdicts } from './supabaseStudyTrack'

interface VerdictInput {
  userId: string
  date: string
  user: User
  todayCheckIn: DailyCheckIn
  recentCheckIns: DailyCheckIn[]
}

interface VerdictResult {
  status: VerdictStatus
  studyMinutes: number
  targetMinutes: number
  recallRatio: number
  streak: number
  daysToExam?: number
  reasons: string[]
}

/**
 * Calculate the current study streak
 */
function calculateStreak(checkIns: DailyCheckIn[]): number {
  if (checkIns.length === 0) return 0
  
  // Sort by date descending
  const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date))
  
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let expectedDate = today
  
  for (const checkIn of sorted) {
    if (checkIn.date === expectedDate) {
      streak++
      // Move to previous day
      const date = new Date(expectedDate)
      date.setDate(date.getDate() - 1)
      expectedDate = date.toISOString().split('T')[0]
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Calculate recall ratio (percentage of "Yes" answers in recent check-ins)
 */
function calculateRecallRatio(checkIns: DailyCheckIn[]): number {
  if (checkIns.length === 0) return 0
  
  const yesCount = checkIns.filter(c => c.couldRevise).length
  return yesCount / checkIns.length
}

/**
 * Calculate days to exam
 */
function calculateDaysToExam(examDate?: Date): number | undefined {
  if (!examDate) return undefined
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exam = new Date(examDate)
  exam.setHours(0, 0, 0, 0)
  
  const diffTime = exam.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

/**
 * Detect consistency issues (gaps in recent days)
 */
function hasConsistencyIssues(checkIns: DailyCheckIn[]): boolean {
  if (checkIns.length < 3) return false
  
  // Check if there are gaps in the last 7 days
  const dates = checkIns.map(c => c.date).sort()
  let gaps = 0
  
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays > 1) {
      gaps += diffDays - 1
    }
  }
  
  return gaps >= 2
}

/**
 * Core verdict engine - determines user's current status
 */
export async function calculateVerdict(input: VerdictInput): Promise<VerdictResult> {
  const { user, todayCheckIn, recentCheckIns } = input
  
  const reasons: string[] = []
  let points = 0 // Higher = better
  
  // Factor 1: Today's study minutes vs target
  const targetRatio = todayCheckIn.minutesStudied / user.dailyTargetMinutes
  if (targetRatio >= 1.0) {
    points += 3
    reasons.push('Met daily target')
  } else if (targetRatio >= 0.7) {
    points += 1
    reasons.push('Close to target')
  } else {
    points -= 2
    reasons.push('Below target')
  }
  
  // Factor 2: Recall ratio (last 7 days)
  const recallRatio = calculateRecallRatio(recentCheckIns)
  if (recallRatio >= 0.7) {
    points += 2
    reasons.push('Strong recall')
  } else if (recallRatio >= 0.5) {
    points += 1
    reasons.push('Moderate recall')
  } else {
    points -= 1
    reasons.push('Low recall rate')
  }
  
  // Factor 3: Consistency (streak and gaps)
  const streak = calculateStreak(recentCheckIns)
  const hasGaps = hasConsistencyIssues(recentCheckIns)
  
  if (streak >= 7) {
    points += 2
    reasons.push('Strong streak')
  } else if (streak >= 3) {
    points += 1
    reasons.push('Building momentum')
  }
  
  if (hasGaps) {
    points -= 1
    reasons.push('Recent gaps detected')
  }
  
  // Factor 4: Exam proximity urgency
  const daysToExam = calculateDaysToExam(user.examDate)
  if (daysToExam !== undefined) {
    if (daysToExam <= 30 && targetRatio < 0.8) {
      points -= 2
      reasons.push('Exam approaching')
    } else if (daysToExam <= 60 && targetRatio < 0.7) {
      points -= 1
      reasons.push('Consider increasing pace')
    }
  }
  
  // Determine final status
  let status: VerdictStatus
  if (points >= 4) {
    status = 'on-track'
  } else if (points >= 0) {
    status = 'at-risk'
  } else {
    status = 'falling-behind'
  }
  
  return {
    status,
    studyMinutes: todayCheckIn.minutesStudied,
    targetMinutes: user.dailyTargetMinutes,
    recallRatio,
    streak,
    daysToExam,
    reasons
  }
}

/**
 * Get verdict display text based on status
 */
export function getVerdictDisplayText(status: VerdictStatus, tone: 'neutral' | 'direct' = 'neutral'): {
  emoji: string
  title: string
  subtitle: string
} {
  if (tone === 'direct') {
    switch (status) {
      case 'on-track':
        return {
          emoji: '🟢',
          title: 'On Track',
          subtitle: 'Keep this up'
        }
      case 'at-risk':
        return {
          emoji: '🟡',
          title: 'At Risk',
          subtitle: 'Adjust course now'
        }
      case 'falling-behind':
        return {
          emoji: '🔴',
          title: 'Falling Behind',
          subtitle: 'Still recoverable'
        }
    }
  } else {
    switch (status) {
      case 'on-track':
        return {
          emoji: '🟢',
          title: 'On Track',
          subtitle: 'You\'re doing well'
        }
      case 'at-risk':
        return {
          emoji: '🟡',
          title: 'At Risk',
          subtitle: 'Here\'s what to do next'
        }
      case 'falling-behind':
        return {
          emoji: '🔴',
          title: 'Falling Behind',
          subtitle: 'Let\'s get back on course'
        }
    }
  }
}
