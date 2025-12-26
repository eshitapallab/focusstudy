import { DailyCheckIn, MicroAction, Verdict } from './types'
import { getSubjectMarks, getExamSubjects } from './examSyllabi'

/**
 * Generate a single micro-action based on recent study patterns and verdict
 * Uses real exam data - no dummy recommendations
 */
export function generateMicroAction(
  recentCheckIns: DailyCheckIn[],
  verdict: Verdict,
  userExam?: string
): Omit<MicroAction, 'id' | 'userId' | 'verdictId' | 'date' | 'createdAt' | 'completed'> {
  
  const targetMinutes = verdict.targetMinutes
  const examSubjects = userExam ? getExamSubjects(userExam) : []
  const hasExamSubjectList = examSubjects.length > 0
  const isValidForExam = (subject: string) => {
    if (!hasExamSubjectList) return true
    return subject === 'Other' || examSubjects.includes(subject)
  }
  
  // If no check-ins exist, recommend first session
  if (recentCheckIns.length === 0) {
    const firstSubject = examSubjects.length > 0 ? examSubjects[0] : 'any subject'
    
    return {
      task: `Start with ${firstSubject}`,
      durationMinutes: Math.min(30, targetMinutes),
      relatedSubjects: examSubjects.length > 0 ? [examSubjects[0]] : []
    }
  }
  
  // Analyze recent subjects and identify patterns
  const subjectFrequency = new Map<string, number>()
  const subjectMinutes = new Map<string, number>()
  const subjectLastStudied = new Map<string, Date>()
  
  recentCheckIns.forEach(checkIn => {
    if (!isValidForExam(checkIn.subject)) return

    const count = subjectFrequency.get(checkIn.subject) || 0
    const minutes = subjectMinutes.get(checkIn.subject) || 0
    const lastDate = subjectLastStudied.get(checkIn.subject)
    const currentDate = new Date(checkIn.date)
    
    subjectFrequency.set(checkIn.subject, count + 1)
    subjectMinutes.set(checkIn.subject, minutes + checkIn.minutesStudied)
    
    if (!lastDate || currentDate > lastDate) {
      subjectLastStudied.set(checkIn.subject, currentDate)
    }
  })
  
  // Strategy 1: PRIORITY - Fix weak recall subjects (retention risk)
  const weakRecallSubjects = recentCheckIns
    .filter(c => !c.couldRevise)
    .map(c => c.subject)
    .filter(isValidForExam)
    .filter((s, i, arr) => arr.indexOf(s) === i)
  
  if (weakRecallSubjects.length > 0) {
    const subject = weakRecallSubjects[0]
    const subjectMarks = userExam ? getSubjectMarks(userExam, subject) : 0
    const duration = Math.min(25, Math.round(targetMinutes * 0.4))
    
    return {
      task: `Deep revision of ${subject}${subjectMarks > 0 ? ` (${subjectMarks} marks)` : ''}`,
      durationMinutes: duration,
      relatedSubjects: [subject]
    }
  }
  
  // Strategy 2: Balance coverage - find neglected high-value subjects
  const studiedSubjects = Array.from(subjectFrequency.keys())
  
  // Find subjects from exam syllabus that haven't been studied recently
  const neglectedSubjects = examSubjects.filter(examSubj => {
    const lastStudied = subjectLastStudied.get(examSubj)
    if (!lastStudied) return true // Never studied
    
    const daysSince = (Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 3 // Not studied in last 3 days
  })
  
  if (neglectedSubjects.length > 0) {
    // Prioritize by marks weightage
    const sortedByMarks = neglectedSubjects
      .map(subj => ({
        subject: subj,
        marks: userExam ? getSubjectMarks(userExam, subj) : 0
      }))
      .sort((a, b) => b.marks - a.marks)
    
    const bestSubject = sortedByMarks[0]
    const duration = Math.min(20, Math.round(targetMinutes * 0.35))
    
    return {
      task: `Cover ${bestSubject.subject}${bestSubject.marks > 0 ? ` (${bestSubject.marks} marks)` : ''}`,
      durationMinutes: duration,
      relatedSubjects: [bestSubject.subject]
    }
  }
  
  // Strategy 3: Revise recently studied subjects (spaced repetition)
  if (recentCheckIns.length > 0) {
    const mostRecentSubjects = recentCheckIns
      .slice(0, 3)
      .map(c => c.subject)
      .filter((s, i, arr) => arr.indexOf(s) === i)
    
    if (mostRecentSubjects.length >= 2) {
      const duration = Math.min(20, Math.round(targetMinutes * 0.3))
      const subjects = mostRecentSubjects.slice(0, 2)
      const totalMarks = subjects.reduce((sum, s) => 
        sum + (userExam ? getSubjectMarks(userExam, s) : 0), 0
      )
      
      return {
        task: `Revise ${subjects.join(' & ')}${totalMarks > 0 ? ` (${totalMarks} marks)` : ''}`,
        durationMinutes: duration,
        relatedSubjects: subjects
      }
    } else if (mostRecentSubjects.length === 1) {
      const subject = mostRecentSubjects[0]
      const subjectMarks = userExam ? getSubjectMarks(userExam, subject) : 0
      const duration = Math.min(20, Math.round(targetMinutes * 0.3))
      
      return {
        task: `Revise ${subject}${subjectMarks > 0 ? ` (${subjectMarks} marks)` : ''}`,
        durationMinutes: duration,
        relatedSubjects: [subject]
      }
    }
  }
  
  // Strategy 4: Balance by time - find least studied subject
  const subjectsByTime = Array.from(subjectMinutes.entries())
  if (subjectsByTime.length > 1) {
    const sortedByMinutes = subjectsByTime.sort((a, b) => a[1] - b[1])
    const leastStudied = sortedByMinutes[0][0]
    const subjectMarks = userExam ? getSubjectMarks(userExam, leastStudied) : 0
    const duration = Math.min(20, Math.round(targetMinutes * 0.35))
    
    return {
      task: `Focus on ${leastStudied}${subjectMarks > 0 ? ` (${subjectMarks} marks)` : ''}`,
      durationMinutes: duration,
      relatedSubjects: [leastStudied]
    }
  }
  
  // Fallback: Use most recent subject
  const duration = Math.min(20, Math.round(targetMinutes * 0.3))
  const allSubjects = Array.from(subjectFrequency.keys())
  return {
    task: `Continue revision session`,
    durationMinutes: duration,
    relatedSubjects: allSubjects.length > 0 ? [allSubjects[0]] : examSubjects.length > 0 ? [examSubjects[0]] : []
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
