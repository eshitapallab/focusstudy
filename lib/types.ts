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
  // Layer 1-5 enhancements
  tonePreference?: 'calm' | 'direct' | 'coach'
  truthIndex?: number
  truthIndexUpdatedAt?: Date
  pausedAt?: Date
  pauseReason?: string
  onboardingCompleted?: boolean
  zeroStateViewed?: boolean
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
  summaryNarrative?: string // Layer 1: Weekly journey story
  progressMetaphor?: string // Layer 1: Visual progress bar
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
  decisionReliefMode?: boolean // Layer 2: "Decide for me" mode
  cognitiveLoad?: 'low' | 'medium' | 'high'
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
  weeklyGoalMinutes: number
  createdAt: Date
}

export interface PodStatusRow {
  userId: string
  displayName: string
  checkedIn: boolean
  verdictStatus: VerdictStatus | null
}

// Enhanced pod status with gamification data
export interface PodStatusEnhanced {
  userId: string
  displayName: string
  checkedIn: boolean
  verdictStatus: VerdictStatus | null
  currentStreak: number
  bestStreak: number
  totalKudos: number
  checkInTime: Date | null
  isFirstToday: boolean
  weekMinutes: number
  kudosFromMe: boolean
}

// Pod weekly summary
export interface PodWeeklySummary {
  totalMinutes: number
  weeklyGoal: number
  goalProgressPct: number
  podStreak: number
  topPerformerName: string | null
  topPerformerMinutes: number
  avgDailyCheckIns: number
}

// Pod kudos entry
export interface PodKudos {
  toUserId: string
  fromDisplayName: string
  emoji: string
}

// Pod study session (who's studying now)
export interface PodStudySession {
  userId: string
  displayName: string
  subject: string | null
  startedAt: Date
  minutesElapsed: number
  targetMinutes: number | null
}

// Pod message
export interface PodMessage {
  fromUserId: string
  fromDisplayName: string
  toUserId: string | null
  toDisplayName: string | null
  messageType: 'motivation' | 'challenge' | 'celebration' | 'nudge'
  messageKey: string
  createdAt: Date
}

// Pod achievement
export interface PodAchievement {
  userId: string
  displayName: string
  achievementType: string
  achievementData: Record<string, any>
  unlockedAt: Date
}

// Pod daily challenge
export interface PodDailyChallenge {
  challengeType: string
  challengeTitle: string
  challengeDescription: string
  challengeTarget: number
  currentProgress: number
  isCompleted: boolean
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
  'UPSC Civil Services',
  'JEE Main/Advanced',
  'NEET UG',
  'SSC CGL/CHSL',
  'GATE',
  'CAT',
  'Banking (IBPS/SBI)',
  'CA Foundation/Inter/Final',
  'CLAT',
  'NDA',
  'Other'
]

// Layer 2: Focus Quality Check
export interface FocusQualityCheck {
  id: string
  userId: string
  date: string
  statedHours: number
  focusLevel: 'deep' | 'mixed' | 'distracted'
  createdAt: Date
}

// Layer 2: Recovery Path
export interface RecoveryPath {
  id: string
  userId: string
  createdAt: Date
  daysInactive: number
  recommendedDays: number
  dailyMinutes: number
  accepted: boolean
}

// ============================================================================
// Mistake Intelligence System (MIS)
// ============================================================================

export type MISTestType = 'mock' | 'sectional' | 'pyq'
export type MISMistakeType =
  | 'concept'
  | 'memory'
  | 'calculation'
  | 'misread'
  | 'time-pressure'
  | 'strategy'

export type MISAvoidability = 'easily' | 'possibly' | 'hard'
export type MISConfidenceLevel = 'high' | 'medium' | 'low'

export interface MISTest {
  id: string
  userId: string
  testName: string
  testType: MISTestType
  date: string // YYYY-MM-DD
  totalMarks?: number
  marksObtained?: number
  createdAt: Date
}

export interface MISLoggedMistake {
  id: string
  userId: string
  testId: string
  topicId: string
  mistakeType: MISMistakeType
  avoidability: MISAvoidability
  confidenceLevel?: MISConfidenceLevel
  repeated?: boolean
  createdAt: Date
}

export interface MarkLeakEstimate {
  userId: string
  subject: string
  topic: string
  mistakeType: MISMistakeType | 'silly' | 'unknown'
  frequency: number
  avoidableCount: number
  lastSeenAt: Date
  estimatedMarksLost: number
  fixabilityScore: number
  priorityRank: number
}

export type MISTrend = 'rising' | 'flat' | 'falling'

export interface MistakeTrendSignal {
  userId: string
  subject: string
  topic: string
  mistakeType: MISMistakeType | 'silly' | 'unknown'
  recentCount: number
  previousCount: number
  recentMarksLost: number
  previousMarksLost: number
  countDelta: number
  marksDelta: number
  recentAvoidable: number
  lastSeenAt: Date
  trend: MISTrend
}

// Layer 3: Verdict Change
export interface VerdictChange {
  id: string
  userId: string
  date: string
  fromStatus: VerdictStatus
  toStatus: VerdictStatus
  reasons: string[]
  createdAt: Date
}

// Layer 3: Silent Win
export interface SilentWin {
  id: string
  userId: string
  date: string
  winType: string
  description: string
  shown: boolean
  createdAt: Date
}

// Layer 4: Mentor Share
export interface MentorShare {
  id: string
  userId: string
  shareCode: string
  mentorName?: string
  active: boolean
  createdAt: Date
  expiresAt?: Date
  lastViewedAt?: Date
}

// Layer 4: Cohort Benchmark
export interface CohortBenchmark {
  id: string
  exam: string
  monthStart: string
  avgRecallImprovement: number
  avgConsistencyImprovement: number
  participantCount: number
  createdAt: Date
}

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
