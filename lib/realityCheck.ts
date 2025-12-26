import { WeeklyReality } from './types'

/**
 * Calculate reality score from weekly check-in answers
 */
export function calculateRealityScore(answers: WeeklyReality['answers']): number {
  // Each "Yes" answer to positive behaviors = points
  // Being honest about avoiding weak subjects (answering "No") also gets points
  
  const truthPoints = [
    answers.avoidedWeakSubjects ? 0 : 20,  // Admitting weakness (good)
    answers.revisedContent ? 20 : 0,        // Good if yes
    answers.readyForBasics ? 20 : 0,        // Good if yes
    answers.consistentEffort ? 20 : 0,      // Good if yes
    answers.honestWithSelf ? 20 : 0         // Good if yes
  ]
  
  return Math.round(truthPoints.reduce((a, b) => a + b, 0))
}

/**
 * Generate trajectory message based on reality score
 */
export function generateTrajectoryMessage(score: number): string {
  // Generate message based on score
  if (score >= 80) {
    return 'Strong trajectory. Keep this momentum going.'
  } else if (score >= 60) {
    return 'Good progress. Stay consistent this week.'
  } else if (score >= 40) {
    return 'Adjust course. Focus on consistency.'
  } else {
    return 'Time for honest reset. Start with basics.'
  }
}

/**
 * Check if user needs support based on reality check pattern
 */
export function needsSupportMessage(recentRealities: WeeklyReality[]): boolean {
  if (recentRealities.length < 2) return false
  
  // Check if last 2 reality checks show concerning pattern
  const recentScores = recentRealities.slice(0, 2).map(r => r.realityScore)
  const averageScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
  
  // If average score is below 40, user may need support
  return averageScore < 40
}
