// User profile and settings
export interface User {
  id: string
  createdAt: Date
  exam: string
  examDate?: Date
  dailyTargetMinutes: number
  language: string
  isAnonymous: boolean
  email?: string
  peerComparisonEnabled: boolean
  notificationsEnabled: boolean
  lastWeeklyRealityCheck?: Date
  lastWeakSubjectNudgeAt?: Date
  resetAt?: Date
}

// Daily check-in entry
export interface DailyCheckIn {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  subject: string
  minutesStudied: number
  couldRevise: boolean // "Yes" = true, "No" = false
  createdAt: Date
}

// Weekly reality check
export interface WeeklyReality {
  id: string
  userId: string
  weekStartDate: string // YYYY-MM-DD
  confidenceScore?: number // 0-100
  answers: {
    avoidedWeakSubjects: boolean
    revisedContent: boolean
    readyForBasics: boolean
    consistentEffort: boolean
    honestWithSelf: boolean
  }
  realityScore: number // 0-100
  trajectoryMessage: string
  createdAt: Date
}

// Verdict states
export type VerdictStatus = 'on-track' | 'at-risk' | 'falling-behind'

// Daily verdict
export interface Verdict {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  status: VerdictStatus
  studyMinutes: number
  targetMinutes: number
  recallRatio: number // last 7 days
  streak: number
  daysToExam?: number
  reasons: string[]
  createdAt: Date
}

// Micro-action recommendation
export interface MicroAction {
  id: string
  userId: string
  verdictId: string
  date: string // YYYY-MM-DD
  task: string
  durationMinutes: number
  relatedSubjects: string[]
  createdAt: Date
  completed: boolean
  locked?: boolean
  lockedAt?: Date
  lockCheckedAt?: Date
  lockedDone?: boolean
}

export type EmotionalFeeling = 'calm' | 'neutral' | 'draining'

export interface EmotionalCheckIn {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  feeling: EmotionalFeeling
  createdAt: Date
}

export type ExamTomorrowResponse = 'yes' | 'maybe' | 'no'

export interface ExamTomorrowCheck {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  response: ExamTomorrowResponse
  createdAt: Date
}

export interface MonthlySnapshot {
  id: string
  userId: string
  monthStartDate: string // YYYY-MM-DD
  avgDailyMinutes: number
  consistencyDays: number
  biggestImprovement: string
  reflection: string
  createdAt: Date
}

export interface Pod {
  id: string
  ownerId: string
  inviteCode: string
  createdAt: Date
}

export interface PodStatusRow {
  userId: string
  checkedIn: boolean
  verdictStatus: VerdictStatus | null
}

// Anonymous cohort statistics
export interface CohortStats {
  exam: string
  date: string // YYYY-MM-DD
  medianStudyMinutes: number
  participantCount: number
  updatedAt: Date
}

// Gaming detection flags
export interface GamingDetection {
  userId: string
  detectedAt: Date
  patterns: {
    sameMinutesDaily?: boolean
    alwaysYesRecall?: boolean
    noVariance?: boolean
  }
  prompted: boolean
}

// Share snapshot
export interface ShareSnapshot {
  userId: string
  date: string
  status: VerdictStatus
  hoursStudied: number
  imageUrl?: string
  createdAt: Date
}

// A/B test flags
export interface ABTestFlags {
  verdictTone: 'neutral' | 'direct'
  shareCTAPlacement: 'top' | 'bottom'
  peerMedianVisibleByDefault: boolean
}

// Onboarding state
export interface OnboardingState {
  completed: boolean
  currentStep: number
  exam: string
  examDate?: Date
  dailyTargetMinutes: number
}

// Exam presets
export const EXAM_PRESETS = [
  'UPSC',
  'JEE',
  'NEET',
  'SSC',
  'GATE',
  'CAT',
  'Banking',
  'Other'
]

// Subject presets (common subjects)
export const SUBJECT_PRESETS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Polity',
  'Economics',
  'Current Affairs',
  'English',
  'Reasoning',
  'Quantitative Aptitude',
  'Other'
]
