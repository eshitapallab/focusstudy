import { DailyCheckIn, MicroAction, Verdict } from './types'

/**
 * Generate a single micro-action based on recent study patterns and verdict
 */
export function generateMicroAction(
  recentCheckIns: DailyCheckIn[],
  verdict: Verdict
): Omit<MicroAction, 'id' | 'userId' | 'verdictId' | 'date' | 'createdAt' | 'completed'> {
  
  const targetMinutes = verdict.targetMinutes
  
  // Analyze recent subjects and identify patterns
  const subjectFrequency = new Map<string, number>()
  const subjectMinutes = new Map<string, number>()
  
  recentCheckIns.forEach(checkIn => {
    const count = subjectFrequency.get(checkIn.subject) || 0
    const minutes = subjectMinutes.get(checkIn.subject) || 0
    
    subjectFrequency.set(checkIn.subject, count + 1)
    subjectMinutes.set(checkIn.subject, minutes + checkIn.minutesStudied)
  })
  
  // Find subjects that need attention
  const subjects = Array.from(subjectFrequency.keys())
  
  // Strategy 1: Revise recently studied subjects (if they exist)
  if (recentCheckIns.length > 0) {
    const mostRecentSubjects = recentCheckIns
      .slice(0, 3)
      .map(c => c.subject)
      .filter((s, i, arr) => arr.indexOf(s) === i)
    
    if (mostRecentSubjects.length >= 2) {
      const duration = Math.min(20, Math.round(targetMinutes * 0.3))
      return {
        task: `Tomorrow: Revise ${mostRecentSubjects.slice(0, 2).join(' & ')} (${duration} min)`,
        durationMinutes: duration,
        relatedSubjects: mostRecentSubjects.slice(0, 2)
      }
    } else if (mostRecentSubjects.length === 1) {
      const duration = Math.min(20, Math.round(targetMinutes * 0.3))
      return {
        task: `Tomorrow: Revise ${mostRecentSubjects[0]} (${duration} min)`,
        durationMinutes: duration,
        relatedSubjects: mostRecentSubjects
      }
    }
  }
  
  // Strategy 2: Focus on weak recall subjects
  const weakRecallSubjects = recentCheckIns
    .filter(c => !c.couldRevise)
    .map(c => c.subject)
    .filter((s, i, arr) => arr.indexOf(s) === i)
  
  if (weakRecallSubjects.length > 0) {
    const subject = weakRecallSubjects[0]
    const duration = Math.min(25, Math.round(targetMinutes * 0.4))
    return {
      task: `Tomorrow: Deep review of ${subject} (${duration} min)`,
      durationMinutes: duration,
      relatedSubjects: [subject]
    }
  }
  
  // Strategy 3: Balance subjects (find least studied)
  if (subjects.length > 1) {
    const sortedByMinutes = Array.from(subjectMinutes.entries())
      .sort((a, b) => a[1] - b[1])
    
    const leastStudied = sortedByMinutes[0][0]
    const duration = Math.min(20, Math.round(targetMinutes * 0.35))
    
    return {
      task: `Tomorrow: Focus on ${leastStudied} (${duration} min)`,
      durationMinutes: duration,
      relatedSubjects: [leastStudied]
    }
  }
  
  // Fallback: Generic micro-action
  const duration = Math.min(20, Math.round(targetMinutes * 0.3))
  return {
    task: `Tomorrow: Quick revision session (${duration} min)`,
    durationMinutes: duration,
    relatedSubjects: subjects.length > 0 ? [subjects[0]] : []
  }
}

/**
 * Validate that micro-action meets requirements
 */
export function validateMicroAction(action: { task: string; durationMinutes: number }): boolean {
  // Must be 30 minutes or less
  if (action.durationMinutes > 30) return false
  
  // Task must not be empty
  if (!action.task || action.task.trim().length === 0) return false
  
  // Task should be reasonably short
  if (action.task.length > 150) return false
  
  return true
}
