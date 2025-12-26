import { Verdict, DailyCheckIn, WeeklyReality } from './types'

/**
 * LAYER 1: Narrative Mode
 * Generate weekly journey narrative from existing data
 */

export interface JourneyPhase {
  week: number
  pattern: 'inconsistent' | 'stabilizing' | 'consistent' | 'declining'
  keyEvent?: string
}

export function generateWeeklyNarrative(
  weeklyVerdicts: Verdict[],
  weeklyCheckIns: DailyCheckIn[],
  previousWeek?: WeeklyReality
): string {
  if (weeklyVerdicts.length === 0) {
    return 'Your journey is just beginning. One day at a time.'
  }

  const phases: string[] = []

  // Analyze consistency
  const consistencyDays = weeklyCheckIns.length
  if (consistencyDays >= 6) {
    phases.push('stayed highly consistent')
  } else if (consistencyDays >= 4) {
    phases.push('maintained decent consistency')
  } else {
    phases.push('started rebuilding consistency')
  }

  // Analyze recall trend
  const recallRatios = weeklyVerdicts.map(v => v.recallRatio)
  const avgRecall = recallRatios.reduce((a, b) => a + b, 0) / recallRatios.length
  const prevRecall = previousWeek?.answers?.revisedContent ? 0.7 : 0.5

  if (avgRecall > prevRecall + 0.1) {
    phases.push('your recall improved significantly')
  } else if (avgRecall > prevRecall) {
    phases.push('recall stayed strong')
  } else if (avgRecall < prevRecall - 0.1) {
    phases.push('recall needs attention')
  }

  // Analyze study time pattern
  const totalMinutes = weeklyCheckIns.reduce((sum, c) => sum + c.minutesStudied, 0)
  const avgMinutes = totalMinutes / weeklyCheckIns.length

  if (avgMinutes > 180) {
    phases.push('you pushed hard on hours')
  } else if (avgMinutes < 60 && avgRecall > 0.7) {
    phases.push('you found efficiency over volume')
  }

  // Construct narrative
  const opening = consistencyDays >= 5 ? 'This week, you' : 'This week showed progress:'
  return `${opening} ${phases.join(', ')}.`
}

export function generateMonthlyNarrative(verdicts: Verdict[]): string {
  if (verdicts.length < 7) {
    return 'Not enough data yet. Keep going.'
  }

  const weeks = Math.floor(verdicts.length / 7)
  const phases: JourneyPhase[] = []

  for (let i = 0; i < weeks; i++) {
    const weekVerdicts = verdicts.slice(i * 7, (i + 1) * 7)
    const onTrackCount = weekVerdicts.filter(v => v.status === 'on-track').length
    
    let pattern: JourneyPhase['pattern']
    if (onTrackCount >= 5) pattern = 'consistent'
    else if (onTrackCount >= 3) pattern = 'stabilizing'
    else if (onTrackCount <= 2 && i > 0) pattern = 'declining'
    else pattern = 'inconsistent'

    phases.push({ week: i + 1, pattern })
  }

  // Build story
  const story: string[] = []
  
  if (phases[0]?.pattern === 'inconsistent' && phases[phases.length - 1]?.pattern === 'consistent') {
    story.push('You started inconsistent')
    const stabilizingWeek = phases.findIndex(p => p.pattern === 'stabilizing')
    if (stabilizingWeek > 0) {
      story.push(`stabilized in Week ${stabilizingWeek + 1}`)
    }
    story.push('and reached consistency')
  } else if (phases.every(p => p.pattern === 'consistent')) {
    story.push('You maintained strong consistency throughout')
  } else if (phases[phases.length - 1]?.pattern === 'declining') {
    story.push('You started strong but faced challenges recently')
  } else {
    story.push('Your journey shows gradual improvement')
  }

  return story.join(', ') + '.'
}

/**
 * Visual Progress Metaphor
 * Generate simple bar/path representation
 */
export function generateProgressBar(
  consistency: number, // 0-1
  recall: number, // 0-1
  streak: number
): string {
  const score = (consistency * 0.4 + recall * 0.4 + Math.min(streak / 14, 1) * 0.2)
  const filled = Math.round(score * 10)
  const empty = 10 - filled
  
  return `█${'█'.repeat(filled)}${'░'.repeat(empty)}`
}

export function generateStabilityLevel(verdicts: Verdict[]): { level: string; description: string } {
  if (verdicts.length < 7) {
    return { level: 'Building', description: 'Foundation phase' }
  }

  const lastWeek = verdicts.slice(0, 7)
  const variance = calculateVariance(lastWeek.map(v => v.studyMinutes))
  const avgStatus = lastWeek.filter(v => v.status === 'on-track').length / 7

  if (avgStatus >= 0.7 && variance < 900) {
    return { level: 'Highly Stable', description: 'Strong foundation' }
  } else if (avgStatus >= 0.5) {
    return { level: 'Stable', description: 'Consistent progress' }
  } else if (avgStatus >= 0.3) {
    return { level: 'Stabilizing', description: 'Finding rhythm' }
  } else {
    return { level: 'Rebuilding', description: 'One step at a time' }
  }
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
}
