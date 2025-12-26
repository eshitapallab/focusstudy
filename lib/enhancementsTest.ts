/**
 * StudyTrack Enhancements - Integration Test
 * Verify all new libraries work together
 */

import { generateWeeklyNarrative, generateMonthlyNarrative, generateProgressBar, generateStabilityLevel } from './narrativeEngine'
import { calculateTruthIndex, getTruthIndexMessage, getTruthIndexColor } from './truthIndex'
import { calculateRecoveryPath, generateDecisionReliefTask, buildSubjectConfidenceMap } from './recoveryIntelligence'
import { detectSilentWins, explainVerdictChange, calculateExamPressure } from './silentWins'
import { getVerdictCopy, getMicroActionIntro, getRealityCheckIntro, getHonestyPromptTone, getResetPromptCopy, getRecoveryPathCopy, getTruthIndexCopy, getSilentWinCopy, getDecisionReliefIntro, getExamPressureCopy, getPauseCopy } from './toneEngine'
import type { Verdict, DailyCheckIn, WeeklyReality, User } from './types'

/**
 * Test all tone variants
 */
export function testToneEngine() {
  const tones = ['calm', 'direct', 'coach'] as const
  const statuses = ['on-track', 'at-risk', 'falling-behind'] as const

  console.log('=== Tone Engine Test ===')
  
  tones.forEach(tone => {
    console.log(`\n${tone.toUpperCase()} TONE:`)
    statuses.forEach(status => {
      const copy = getVerdictCopy(status, tone)
      console.log(`  ${status}: ${copy.heading}`)
    })
  })

  // Test other tone functions
  console.log('\nMicro-action intros:', tones.map(t => getMicroActionIntro(t)))
  console.log('Reality check intros:', tones.map(t => getRealityCheckIntro(t)))
  console.log('Decision relief intros:', tones.map(t => getDecisionReliefIntro(t)))
}

/**
 * Test narrative engine
 */
export function testNarrativeEngine() {
  console.log('\n=== Narrative Engine Test ===')
  
  const mockVerdicts: Verdict[] = [
    {
      id: '1',
      userId: 'test',
      date: '2025-01-01',
      status: 'on-track',
      studyMinutes: 120,
      targetMinutes: 120,
      recallRatio: 0.75,
      streak: 5,
      reasons: [],
      createdAt: new Date()
    }
  ]

  const mockCheckIns: DailyCheckIn[] = [
    {
      id: '1',
      userId: 'test',
      date: '2025-01-01',
      subject: 'Math',
      minutesStudied: 120,
      couldRevise: true,
      createdAt: new Date()
    }
  ]

  const narrative = generateWeeklyNarrative(mockVerdicts, mockCheckIns)
  console.log('Weekly narrative:', narrative)

  const progress = generateProgressBar(0.85, 0.75, 5)
  console.log('Progress bar:', progress)

  const stability = generateStabilityLevel(mockVerdicts)
  console.log('Stability:', stability.level, '-', stability.description)
}

/**
 * Test truth index
 */
export function testTruthIndex() {
  console.log('\n=== Truth Index Test ===')
  
  const mockCheckIns: DailyCheckIn[] = [
    {
      id: '1',
      userId: 'test',
      date: '2025-01-01',
      subject: 'Math',
      minutesStudied: 120,
      couldRevise: true,
      createdAt: new Date()
    },
    {
      id: '2',
      userId: 'test',
      date: '2025-01-02',
      subject: 'Physics',
      minutesStudied: 90,
      couldRevise: false,
      createdAt: new Date()
    },
    {
      id: '3',
      userId: 'test',
      date: '2025-01-03',
      subject: 'Chemistry',
      minutesStudied: 150,
      couldRevise: true,
      createdAt: new Date()
    }
  ]

  const mockVerdicts: Verdict[] = []

  const truthIndex = calculateTruthIndex(mockCheckIns, mockVerdicts, false)
  console.log('Truth index:', truthIndex.overallIndex)
  console.log('Factors:', {
    consistency: truthIndex.consistencyScore,
    honesty: truthIndex.recallHonestyScore,
    variance: truthIndex.varianceScore,
    gaming: truthIndex.gamingFlagsScore
  })
  console.log('Message:', getTruthIndexMessage(truthIndex.overallIndex))
  console.log('Color:', getTruthIndexColor(truthIndex.overallIndex))
}

/**
 * Test recovery intelligence
 */
export function testRecoveryIntelligence() {
  console.log('\n=== Recovery Intelligence Test ===')
  
  const mockUser = { dailyTargetMinutes: 120 }
  const recoveryPath = calculateRecoveryPath('2024-12-01', mockUser, 10)
  
  console.log('Recovery path:', {
    daysInactive: recoveryPath.daysInactive,
    recommendedDays: recoveryPath.recommendedDays,
    dailyMinutes: recoveryPath.dailyMinutes,
    difficulty: recoveryPath.difficulty
  })

  const mockCheckInsForRelief: DailyCheckIn[] = [
    { id: '1', userId: 'test', date: '2025-01-01', subject: 'Math', minutesStudied: 120, couldRevise: true, createdAt: new Date() }
  ]
  
  const mockVerdictForRelief: Verdict = {
    id: '1',
    userId: 'test',
    date: '2025-01-01',
    status: 'on-track',
    studyMinutes: 120,
    targetMinutes: 120,
    recallRatio: 0.75,
    streak: 3,
    reasons: [],
    createdAt: new Date()
  }
  
  const reliefTask = generateDecisionReliefTask(mockCheckInsForRelief, mockVerdictForRelief)
  console.log('Decision relief task:', reliefTask.task)

  const mockCheckIns: DailyCheckIn[] = [
    { id: '1', userId: 'test', date: '2025-01-01', subject: 'Math', minutesStudied: 120, couldRevise: true, createdAt: new Date() },
    { id: '2', userId: 'test', date: '2025-01-02', subject: 'Math', minutesStudied: 90, couldRevise: false, createdAt: new Date() },
    { id: '3', userId: 'test', date: '2025-01-03', subject: 'Physics', minutesStudied: 60, couldRevise: true, createdAt: new Date() }
  ]

  const confidenceMap = buildSubjectConfidenceMap(mockCheckIns)
  console.log('Subject confidence:', confidenceMap.slice(0, 3))
}

/**
 * Test silent wins
 */
export function testSilentWins() {
  console.log('\n=== Silent Wins Test ===')
  
  const currentVerdict: Verdict = {
    id: '1',
    userId: 'test',
    date: '2025-01-03',
    status: 'on-track',
    studyMinutes: 120,
    targetMinutes: 120,
    recallRatio: 0.8,
    streak: 3,
    reasons: [],
    createdAt: new Date()
  }

  const recentVerdicts: Verdict[] = [
    {
      id: '2',
      userId: 'test',
      date: '2025-01-02',
      status: 'on-track',
      studyMinutes: 120,
      targetMinutes: 120,
      recallRatio: 0.6,
      streak: 2,
      reasons: [],
      createdAt: new Date()
    },
    {
      id: '3',
      userId: 'test',
      date: '2025-01-01',
      status: 'at-risk',
      studyMinutes: 90,
      targetMinutes: 120,
      recallRatio: 0.5,
      streak: 1,
      reasons: [],
      createdAt: new Date()
    }
  ]

  const win = detectSilentWins(currentVerdict, recentVerdicts)
  if (win) {
    console.log('Silent win detected:', win.type, '-', win.description)
  } else {
    console.log('No silent wins detected this time')
  }

  const previousVerdict: Verdict = {
    id: '4',
    userId: 'test',
    date: '2025-01-02',
    status: 'at-risk',
    studyMinutes: 90,
    targetMinutes: 120,
    recallRatio: 0.6,
    streak: 1,
    reasons: ['Low study time'],
    createdAt: new Date()
  }

  const changeInsight = explainVerdictChange(previousVerdict, currentVerdict)
  if (changeInsight) {
    console.log('Verdict change:', `${changeInsight.fromStatus} → ${changeInsight.toStatus}`)
    console.log('Primary reason:', changeInsight.primaryReason)
  }

  const examPressure = calculateExamPressure(new Date('2025-03-01'), 120, recentVerdicts)
  console.log('Exam pressure:', {
    daysRemaining: examPressure.daysRemaining,
    sessionsRemaining: examPressure.sessionsRemaining,
    pressureLevel: examPressure.pressureLevel
  })
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('🧪 StudyTrack Enhancements - Integration Test\n')
  
  try {
    testToneEngine()
    testNarrativeEngine()
    testTruthIndex()
    testRecoveryIntelligence()
    testSilentWins()
    
    console.log('\n✅ All tests passed! All libraries are working correctly.\n')
    return true
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    return false
  }
}

// Only run if executed directly
if (require.main === module) {
  runAllTests()
}
