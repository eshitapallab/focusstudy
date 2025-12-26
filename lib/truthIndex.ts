import { DailyCheckIn, Verdict } from './types'

/**
 * LAYER 3: Truth Index
 * Measure honesty/authenticity signal (0-100)
 */

export interface TruthIndexFactors {
  consistencyScore: number
  recallHonestyScore: number
  varianceScore: number
  gamingFlagsScore: number
  overallIndex: number
}

export function calculateTruthIndex(
  checkIns: DailyCheckIn[],
  verdicts: Verdict[],
  hasRecentGamingFlags: boolean
): TruthIndexFactors {
  if (checkIns.length < 3) {
    return {
      consistencyScore: 100,
      recallHonestyScore: 100,
      varianceScore: 100,
      gamingFlagsScore: 100,
      overallIndex: 100
    }
  }

  // Factor 1: Consistency (gaps hurt honesty)
  const dates = checkIns.map(c => new Date(c.date).getTime()).sort()
  let gaps = 0
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)
    if (daysDiff > 2) gaps++
  }
  const consistencyScore = Math.max(60, 100 - gaps * 10)

  // Factor 2: Recall Honesty (balanced yes/no is more honest than always yes)
  const yesCount = checkIns.filter(c => c.couldRevise).length
  const noCount = checkIns.length - yesCount
  const recallBalance = Math.min(yesCount, noCount) / Math.max(yesCount, noCount)
  
  // Perfect balance (0.5 yes, 0.5 no) or slight lean = high honesty
  // Always yes or always no = suspicious
  const recallHonestyScore = yesCount === checkIns.length || noCount === checkIns.length
    ? 60 // Suspicious
    : Math.min(100, 70 + recallBalance * 30)

  // Factor 3: Variance in study time (humans have natural variance)
  const minutes = checkIns.map(c => c.minutesStudied)
  const mean = minutes.reduce((a, b) => a + b, 0) / minutes.length
  const variance = minutes.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / minutes.length
  const coefficientOfVariation = Math.sqrt(variance) / mean

  // Too little variance = suspicious, healthy variance = honest
  const varianceScore = coefficientOfVariation < 0.1 ? 70 : 100

  // Factor 4: Gaming Flags
  const gamingFlagsScore = hasRecentGamingFlags ? 60 : 100

  // Weighted average
  const overallIndex = Math.round(
    consistencyScore * 0.3 +
    recallHonestyScore * 0.3 +
    varianceScore * 0.2 +
    gamingFlagsScore * 0.2
  )

  return {
    consistencyScore,
    recallHonestyScore,
    varianceScore,
    gamingFlagsScore,
    overallIndex: Math.max(0, Math.min(100, overallIndex))
  }
}

export function getTruthIndexMessage(index: number): string {
  if (index >= 90) {
    return 'Your honesty signal is strong.'
  } else if (index >= 75) {
    return 'Your data looks authentic.'
  } else if (index >= 60) {
    return 'Keep being honest with your entries.'
  } else {
    return 'Honesty matters more than perfect numbers.'
  }
}

export function getTruthIndexColor(index: number): string {
  if (index >= 80) return 'text-green-600'
  if (index >= 60) return 'text-yellow-600'
  return 'text-orange-600'
}
