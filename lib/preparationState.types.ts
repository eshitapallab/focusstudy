/**
 * PREPARATION STATE SYSTEM - Core Types
 * Shift from "tracking study" to "tracking preparation state"
 */

export type PreparednessState = 'strong' | 'shaky' | 'weak' | 'untouched'
export type MistakeType = 'concept' | 'memory' | 'silly' | 'time-pressure' | 'unknown'
export type TopicDifficulty = 'basic' | 'moderate' | 'advanced'

// ============================================================================
// SYLLABUS STRUCTURE (Canonical, reusable)
// ============================================================================

export interface SyllabusTemplate {
  id: string
  exam: string
  version: string
  totalTopics: number
  createdAt: Date
  updatedAt: Date
}

export interface SyllabusTopic {
  id: string
  syllabusId: string
  parentId?: string // For hierarchical topics
  
  // Identity
  code: string // 'POLITY_PARL_POWERS'
  name: string // 'Parliament Powers'
  subject: string // 'Polity'
  
  // Exam relevance (KEY VALUE)
  examWeight: number // 1-10 scale
  avgQuestionsPerYear: number
  lastAskedYear?: number
  
  // Learning metadata
  estimatedHours: number
  difficulty: TopicDifficulty
  prerequisites: string[] // Topic codes
  
  displayOrder: number
  createdAt: Date
}

// ============================================================================
// PERSONAL PREPAREDNESS (The diagnostic truth)
// ============================================================================

export interface TopicPreparedness {
  id: string
  userId: string
  topicId: string
  
  // 4-state system
  state: PreparednessState
  // strong = 🟢 Can answer exam questions confidently
  // shaky = 🟡 Understands but can't reproduce under pressure
  // weak = 🔴 Read but weak/confused
  // untouched = ⚪ Not covered yet
  
  confidenceScore?: number // 0-100
  lastRevisedAt?: Date
  revisionCount: number
  
  daysSinceRevision?: number // Auto-computed
  
  stateChangedAt: Date
  previousState?: PreparednessState
  
  lockedUntil?: Date
  
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// MOCK TEST INTEGRATION
// ============================================================================

export interface MockTest {
  id: string
  userId: string
  testName: string
  testDate: string // YYYY-MM-DD
  totalMarks?: number
  scoredMarks?: number
  percentile?: number
  createdAt: Date
}

export interface MockMistake {
  id: string
  mockId: string
  userId: string
  topicId: string
  mistakeType: MistakeType
  marksLost: number
  createdAt: Date
}

// ============================================================================
// DAILY ACTIVITY (Repurposed for topics, not time)
// ============================================================================

export interface DailyTopicActivity {
  id: string
  userId: string
  topicId: string
  date: string // YYYY-MM-DD
  couldRecall: boolean
  minutesSpent?: number // Optional, de-emphasized
  createdAt: Date
}

// ============================================================================
// DIAGNOSTIC OUTPUTS (The real value)
// ============================================================================

export interface SyllabusCoverage {
  totalTopics: number
  strongCount: number
  shakyCount: number
  weakCount: number
  untouchedCount: number
  strongPct: number
  shakyPct: number
  weakPct: number
  untouchedPct: number
}

export interface HighYieldWeakness {
  topicId: string
  topicName: string
  subject: string
  state: PreparednessState
  examWeight: number
  avgQuestions: number
  estimatedHours: number
  priorityScore: number // Higher = bigger marks leak
}

export interface RevisionROI {
  topicId: string
  topicName: string
  subject: string
  currentState: PreparednessState
  examWeight: number
  estimatedHours: number
  potentialMarksGain: number
  roiScore: number // marks_gain / hours
  fitsInTime: boolean
}

// ============================================================================
// UI COMPONENTS DATA
// ============================================================================

export interface PreparednessMatrixView {
  subject: string
  topics: {
    id: string
    name: string
    state: PreparednessState
    examWeight: number
    daysSinceRevision?: number
    needsAttention: boolean
  }[]
}

export interface DashboardDiagnostic {
  coverage: SyllabusCoverage
  biggestWeakness: HighYieldWeakness | null
  topRevisionTargets: RevisionROI[]
  recentActivity: {
    date: string
    topicsRevised: number
    recallSuccessRate: number
  }[]
}

export interface StrategicInsight {
  type: 'marks-leak' | 'quick-win' | 'decay-alert' | 'mock-pattern'
  priority: 'critical' | 'high' | 'medium'
  message: string
  actionableTopics: string[] // topic IDs
  estimatedImpact: string // "Can gain ~15 marks"
}

// ============================================================================
// EXAM TEMPLATES (Starter data)
// ============================================================================

export const EXAM_SYLLABUS_STRUCTURE = {
  'UPSC Civil Services': {
    subjects: ['Polity', 'History', 'Geography', 'Economics', 'Science & Tech', 'Current Affairs'],
    avgTopicsPerSubject: 15,
    totalMarks: 250
  },
  'JEE Main': {
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    avgTopicsPerSubject: 20,
    totalMarks: 300
  },
  'NEET UG': {
    subjects: ['Physics', 'Chemistry', 'Biology'],
    avgTopicsPerSubject: 18,
    totalMarks: 720
  },
  'GATE': {
    subjects: ['Engineering Mathematics', 'Core Subject', 'General Aptitude'],
    avgTopicsPerSubject: 12,
    totalMarks: 100
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getStateEmoji(state: PreparednessState): string {
  switch (state) {
    case 'strong': return '🟢'
    case 'shaky': return '🟡'
    case 'weak': return '🔴'
    case 'untouched': return '⚪'
  }
}

export function getStateLabel(state: PreparednessState): string {
  switch (state) {
    case 'strong': return 'Exam Ready'
    case 'shaky': return 'Needs Practice'
    case 'weak': return 'Needs Revision'
    case 'untouched': return 'Not Covered'
  }
}

export function shouldDecay(state: PreparednessState, daysSinceRevision: number): boolean {
  if (state === 'strong' && daysSinceRevision > 30) return true
  if (state === 'shaky' && daysSinceRevision > 21) return true
  return false
}

export function calculatePreparednessScore(coverage: SyllabusCoverage): number {
  // Weighted score: strong=1.0, shaky=0.6, weak=0.3, untouched=0
  const total = coverage.totalTopics
  if (total === 0) return 0
  
  return Math.round(
    ((coverage.strongCount * 1.0 +
      coverage.shakyCount * 0.6 +
      coverage.weakCount * 0.3) / total) * 100
  )
}
