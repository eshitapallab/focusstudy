import { supabase } from './supabaseClient'
import { logError } from './errorLogger'
import type {
  User,
  DailyCheckIn,
  WeeklyReality,
  Verdict,
  MicroAction,
  MISTest,
  MISLoggedMistake,
  MarkLeakEstimate,
  MistakeTrendSignal,
  MISTestType,
  MISMistakeType,
  MISAvoidability,
  MISConfidenceLevel,
  CohortStats,
  GamingDetection,
  EmotionalCheckIn,
  EmotionalFeeling,
  ExamTomorrowCheck,
  ExamTomorrowResponse,
  MonthlySnapshot,
  Pod,
  PodStatusRow,
  PodStatusEnhanced,
  PodWeeklySummary,
  PodKudos,
  PodStudySession,
  PodMessage,
  PodAchievement,
  PodDailyChallenge
} from './types'

import type { SyllabusTopic } from './preparationState.types'

// User operations
export async function createStudyUser(userId: string, userData: Omit<User, 'id' | 'createdAt'>): Promise<User | null> {
  if (!supabase) {
    logError('createStudyUser', 'Supabase not configured')
    return null
  }
  
  const { data, error } = await supabase
    .from('study_users')
    .insert({
      id: userId,
      exam: userData.exam,
      exam_date: userData.examDate?.toISOString(),
      daily_target_minutes: userData.dailyTargetMinutes,
      language: userData.language,
      is_anonymous: userData.isAnonymous,
      peer_comparison_enabled: userData.peerComparisonEnabled,
      notifications_enabled: userData.notificationsEnabled
    })
    .select()
    .single()

  if (error) {
    logError('createStudyUser', error)
    return null
  }

  return {
    id: data.id,
    exam: data.exam,
    examDate: data.exam_date ? new Date(data.exam_date) : undefined,
    dailyTargetMinutes: data.daily_target_minutes,
    language: data.language,
    isAnonymous: data.is_anonymous,
    peerComparisonEnabled: data.peer_comparison_enabled,
    notificationsEnabled: data.notifications_enabled,
    lastWeeklyRealityCheck: data.last_weekly_reality_check ? new Date(data.last_weekly_reality_check) : undefined,
    lastWeakSubjectNudgeAt: data.last_weak_subject_nudge_at ? new Date(data.last_weak_subject_nudge_at) : undefined,
    resetAt: data.reset_at ? new Date(data.reset_at) : undefined,
    createdAt: new Date(data.created_at)
  }
}

export async function getStudyUser(userId: string): Promise<User | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('study_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    logError('getStudyUser', error)

    // If the table doesn't exist / schema isn't exposed, Supabase PostgREST often returns 404.
    // Throw so the UI can show actionable setup steps instead of silently treating it as "no profile".
    const status = (error as any)?.status
    const message = String((error as any)?.message || '')
    if (status === 404 || message.toLowerCase().includes('could not find') || message.toLowerCase().includes('schema cache')) {
      throw new Error('StudyTrack database tables are not available (migration not applied or public schema not exposed).')
    }

    return null
  }
  if (!data) return null

  return {
    id: data.id,
    exam: data.exam,
    examDate: data.exam_date ? new Date(data.exam_date) : undefined,
    dailyTargetMinutes: data.daily_target_minutes,
    language: data.language,
    isAnonymous: data.is_anonymous,
    peerComparisonEnabled: data.peer_comparison_enabled,
    notificationsEnabled: data.notifications_enabled,
    lastWeeklyRealityCheck: data.last_weekly_reality_check ? new Date(data.last_weekly_reality_check) : undefined,
    lastWeakSubjectNudgeAt: data.last_weak_subject_nudge_at ? new Date(data.last_weak_subject_nudge_at) : undefined,
    resetAt: data.reset_at ? new Date(data.reset_at) : undefined,
    createdAt: new Date(data.created_at)
  }
}

export async function updateStudyUser(userId: string, updates: Partial<User>): Promise<void> {
  if (!supabase) return
  
  const updateData: any = {}
  if (updates.exam !== undefined) updateData.exam = updates.exam
  if (updates.examDate !== undefined) updateData.exam_date = updates.examDate?.toISOString()
  if (updates.dailyTargetMinutes !== undefined) updateData.daily_target_minutes = updates.dailyTargetMinutes
  if (updates.peerComparisonEnabled !== undefined) updateData.peer_comparison_enabled = updates.peerComparisonEnabled
  if (updates.notificationsEnabled !== undefined) updateData.notifications_enabled = updates.notificationsEnabled
  if (updates.lastWeeklyRealityCheck !== undefined) updateData.last_weekly_reality_check = updates.lastWeeklyRealityCheck?.toISOString()
  if (updates.lastWeakSubjectNudgeAt !== undefined) updateData.last_weak_subject_nudge_at = updates.lastWeakSubjectNudgeAt?.toISOString()
  if (updates.resetAt !== undefined) updateData.reset_at = updates.resetAt?.toISOString()

  await supabase
    .from('study_users')
    .update(updateData)
    .eq('id', userId)
}

// Daily check-in operations
export async function createDailyCheckIn(
  userId: string,
  checkInData: Omit<DailyCheckIn, 'id' | 'userId' | 'createdAt'>
): Promise<DailyCheckIn | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('daily_check_ins')
    .insert({
      user_id: userId,
      date: checkInData.date,
      subject: checkInData.subject,
      minutes_studied: checkInData.minutesStudied,
      could_revise: checkInData.couldRevise
    })
    .select()
    .single()

  if (error) {
    logError('createDailyCheckIn', error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    subject: data.subject,
    minutesStudied: data.minutes_studied,
    couldRevise: data.could_revise,
    createdAt: new Date(data.created_at)
  }
}

export async function getDailyCheckIn(userId: string, date: string): Promise<DailyCheckIn | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    subject: data.subject,
    minutesStudied: data.minutes_studied,
    couldRevise: data.could_revise,
    createdAt: new Date(data.created_at)
  }
}

export async function getRecentCheckIns(userId: string, days: number = 7): Promise<DailyCheckIn[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(days)

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    subject: row.subject,
    minutesStudied: row.minutes_studied,
    couldRevise: row.could_revise,
    createdAt: new Date(row.created_at)
  }))
}

// Verdict operations
export async function createVerdict(
  userId: string,
  verdictData: Omit<Verdict, 'id' | 'userId' | 'createdAt'>
): Promise<Verdict | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('verdicts')
    .insert({
      user_id: userId,
      date: verdictData.date,
      status: verdictData.status,
      study_minutes: verdictData.studyMinutes,
      target_minutes: verdictData.targetMinutes,
      recall_ratio: verdictData.recallRatio,
      streak: verdictData.streak,
      days_to_exam: verdictData.daysToExam,
      reasons: verdictData.reasons
    })
    .select()
    .single()

  if (error) {
    logError('createVerdict', error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    status: data.status,
    studyMinutes: data.study_minutes,
    targetMinutes: data.target_minutes,
    recallRatio: data.recall_ratio,
    streak: data.streak,
    daysToExam: data.days_to_exam,
    reasons: data.reasons,
    createdAt: new Date(data.created_at)
  }
}

export async function getTodayVerdict(userId: string, date: string): Promise<Verdict | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('verdicts')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    status: data.status,
    studyMinutes: data.study_minutes,
    targetMinutes: data.target_minutes,
    recallRatio: data.recall_ratio,
    streak: data.streak,
    daysToExam: data.days_to_exam,
    reasons: data.reasons,
    createdAt: new Date(data.created_at)
  }
}

export async function getRecentVerdicts(userId: string, days: number = 7): Promise<Verdict[]> {
  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('verdicts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(days)

  if (error || !data) return []

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    status: row.status,
    studyMinutes: row.study_minutes,
    targetMinutes: row.target_minutes,
    recallRatio: row.recall_ratio,
    streak: row.streak,
    daysToExam: row.days_to_exam,
    reasons: row.reasons,
    createdAt: new Date(row.created_at)
  }))
}

// Micro-action operations
export async function createMicroAction(
  userId: string,
  actionData: Omit<MicroAction, 'id' | 'userId' | 'createdAt'>
): Promise<MicroAction | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('micro_actions')
    .insert({
      user_id: userId,
      verdict_id: actionData.verdictId,
      date: actionData.date,
      task: actionData.task,
      duration_minutes: actionData.durationMinutes,
      related_subjects: actionData.relatedSubjects,
      completed: actionData.completed,
      locked: actionData.locked ?? false,
      locked_at: actionData.lockedAt ? actionData.lockedAt.toISOString() : null,
      lock_checked_at: actionData.lockCheckedAt ? actionData.lockCheckedAt.toISOString() : null,
      locked_done: actionData.lockedDone ?? null
    })
    .select()
    .single()

  if (error) {
    logError('createMicroAction', error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    verdictId: data.verdict_id,
    date: data.date,
    task: data.task,
    durationMinutes: data.duration_minutes,
    relatedSubjects: data.related_subjects,
    completed: data.completed,
    locked: data.locked,
    lockedAt: data.locked_at ? new Date(data.locked_at) : undefined,
    lockCheckedAt: data.lock_checked_at ? new Date(data.lock_checked_at) : undefined,
    lockedDone: data.locked_done ?? undefined,
    createdAt: new Date(data.created_at)
  }
}

export async function getTodayMicroAction(userId: string, date: string): Promise<MicroAction | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('micro_actions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    verdictId: data.verdict_id,
    date: data.date,
    task: data.task,
    durationMinutes: data.duration_minutes,
    relatedSubjects: data.related_subjects,
    completed: data.completed,
    locked: data.locked,
    lockedAt: data.locked_at ? new Date(data.locked_at) : undefined,
    lockCheckedAt: data.lock_checked_at ? new Date(data.lock_checked_at) : undefined,
    lockedDone: data.locked_done ?? undefined,
    createdAt: new Date(data.created_at)
  }
}

export async function getMicroActionForDate(userId: string, date: string): Promise<MicroAction | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('micro_actions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    verdictId: data.verdict_id,
    date: data.date,
    task: data.task,
    durationMinutes: data.duration_minutes,
    relatedSubjects: data.related_subjects,
    completed: data.completed,
    locked: data.locked,
    lockedAt: data.locked_at ? new Date(data.locked_at) : undefined,
    lockCheckedAt: data.lock_checked_at ? new Date(data.lock_checked_at) : undefined,
    lockedDone: data.locked_done ?? undefined,
    createdAt: new Date(data.created_at)
  }
}

export async function getMicroActionsForDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<MicroAction[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('micro_actions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Defensive: if duplicates exist for the same date, keep the latest.
  const latestByDate = new Map<string, typeof data[number]>()
  for (const row of data) {
    if (!latestByDate.has(row.date)) {
      latestByDate.set(row.date, row)
    }
  }

  return Array.from(latestByDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => ({
      id: row.id,
      userId: row.user_id,
      verdictId: row.verdict_id,
      date: row.date,
      task: row.task,
      durationMinutes: row.duration_minutes,
      relatedSubjects: row.related_subjects,
      completed: row.completed,
      locked: row.locked,
      lockedAt: row.locked_at ? new Date(row.locked_at) : undefined,
      lockCheckedAt: row.lock_checked_at ? new Date(row.lock_checked_at) : undefined,
      lockedDone: row.locked_done ?? undefined,
      createdAt: new Date(row.created_at)
    }))
}

export async function updateMicroAction(
  actionId: string,
  updates: Partial<Pick<MicroAction, 'task' | 'durationMinutes' | 'relatedSubjects' | 'verdictId' | 'completed' | 'locked'>>
): Promise<MicroAction | null> {
  if (!supabase) return null

  const updateData: any = {}
  if (updates.task !== undefined) updateData.task = updates.task
  if (updates.durationMinutes !== undefined) updateData.duration_minutes = updates.durationMinutes
  if (updates.relatedSubjects !== undefined) updateData.related_subjects = updates.relatedSubjects
  if (updates.verdictId !== undefined) updateData.verdict_id = updates.verdictId
  if (updates.completed !== undefined) updateData.completed = updates.completed
  if (updates.locked !== undefined) updateData.locked = updates.locked

  const { data, error } = await supabase
    .from('micro_actions')
    .update(updateData)
    .eq('id', actionId)
    .select('*')
    .maybeSingle()

  if (error || !data) {
    logError('updateMicroAction', error || 'No data returned')
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    verdictId: data.verdict_id,
    date: data.date,
    task: data.task,
    durationMinutes: data.duration_minutes,
    relatedSubjects: data.related_subjects,
    completed: data.completed,
    locked: data.locked,
    lockedAt: data.locked_at ? new Date(data.locked_at) : undefined,
    lockCheckedAt: data.lock_checked_at ? new Date(data.lock_checked_at) : undefined,
    lockedDone: data.locked_done ?? undefined,
    createdAt: new Date(data.created_at)
  }
}

export async function completeMicroAction(actionId: string): Promise<void> {
  if (!supabase) return
  
  await supabase
    .from('micro_actions')
    .update({ completed: true })
    .eq('id', actionId)
}

export async function updateMicroActionDate(actionId: string, date: string): Promise<void> {
  if (!supabase) return

  await supabase
    .from('micro_actions')
    .update({ date })
    .eq('id', actionId)
}

export async function deleteMicroAction(actionId: string): Promise<void> {
  if (!supabase) return

  await supabase
    .from('micro_actions')
    .delete()
    .eq('id', actionId)
}

// ============================================================================
// Mistake Intelligence System (MIS)
// ============================================================================

export async function getSyllabusTopicsForExam(exam: string): Promise<SyllabusTopic[]> {
  if (!supabase) return []

  // Find the canonical syllabus template for this exam.
  const { data: template, error: templateError } = await supabase
    .from('syllabus_templates')
    .select('id')
    .eq('exam', exam)
    .maybeSingle()

  if (templateError || !template?.id) return []

  const { data, error } = await supabase
    .from('syllabus_topics')
    .select('*')
    .eq('syllabus_id', template.id)
    .order('subject', { ascending: true })
    .order('display_order', { ascending: true })

  if (error || !data) return []

  return (data as any[]).map(row => ({
    id: row.id,
    syllabusId: row.syllabus_id,
    parentId: row.parent_id ?? undefined,
    code: row.code,
    name: row.name,
    subject: row.subject,
    examWeight: row.exam_weight,
    avgQuestionsPerYear: Number(row.avg_questions_per_year ?? 0),
    lastAskedYear: row.last_asked_year ?? undefined,
    estimatedHours: Number(row.estimated_hours ?? 1.0),
    difficulty: row.difficulty,
    prerequisites: row.prerequisites ?? [],
    displayOrder: row.display_order ?? 0,
    createdAt: new Date(row.created_at)
  }))
}

export async function createMISTest(
  userId: string,
  test: Omit<MISTest, 'id' | 'userId' | 'createdAt'>
): Promise<MISTest | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('mock_tests')
    .insert({
      user_id: userId,
      test_name: test.testName,
      test_type: test.testType,
      test_date: test.date,
      total_marks: test.totalMarks ?? null,
      scored_marks: test.marksObtained ?? null
    })
    .select('*')
    .single()

  if (error || !data) {
    logError('createMISTest', error || 'No data returned')
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    testName: data.test_name,
    testType: data.test_type as MISTestType,
    date: data.test_date,
    totalMarks: data.total_marks ?? undefined,
    marksObtained: data.scored_marks ?? undefined,
    createdAt: new Date(data.created_at)
  }
}

function estimateMarksLostPerMistake(exam: string): number {
  const e = (exam || '').toLowerCase()
  if (e.includes('upsc')) return 2
  if (e.includes('jee') || e.includes('neet')) return 4
  if (e.includes('cat')) return 1
  if (e.includes('gate')) return 1
  if (e.includes('bank')) return 1
  // SSC & most objective tests: 1–2 marks; default to 2 to stay conservative.
  if (e.includes('ssc')) return 2
  return 2
}

export async function logMISMistakes(
  userId: string,
  userExam: string,
  testId: string,
  mistakes: Array<{
    topicId: string
    mistakeType: MISMistakeType
    avoidability: MISAvoidability
    confidenceLevel?: MISConfidenceLevel
    repeated?: boolean
  }>
): Promise<MISLoggedMistake[]> {
  if (!supabase) return []

  const marksLost = estimateMarksLostPerMistake(userExam)

  const { data, error } = await supabase
    .from('mock_mistakes')
    .insert(
      mistakes.map(m => ({
        user_id: userId,
        mock_id: testId,
        topic_id: m.topicId,
        mistake_type: m.mistakeType,
        avoidability: m.avoidability,
        confidence_level: m.confidenceLevel ?? null,
        repeated: m.repeated ?? null,
        marks_lost: marksLost
      }))
    )
    .select('*')

  if (error || !data) {
    logError('logMISMistakes', error || 'No data returned')
    return []
  }

  return (data as any[]).map(row => ({
    id: row.id,
    userId: row.user_id,
    testId: row.mock_id,
    topicId: row.topic_id,
    mistakeType: row.mistake_type,
    avoidability: row.avoidability,
    confidenceLevel: row.confidence_level ?? undefined,
    repeated: row.repeated ?? undefined,
    createdAt: new Date(row.created_at)
  }))
}

export async function getTopMarkLeaks(userId: string, limit: number = 3): Promise<MarkLeakEstimate[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('mark_leak_estimates')
    .select('*')
    .eq('user_id', userId)
    .order('priority_rank', { ascending: true })
    .limit(limit)

  if (error || !data) return []

  return (data as any[]).map(row => ({
    userId: row.user_id,
    subject: row.subject,
    topic: row.topic,
    mistakeType: row.mistake_type,
    frequency: row.frequency,
    avoidableCount: row.avoidable_count,
    lastSeenAt: new Date(row.last_seen_at),
    estimatedMarksLost: Number(row.estimated_marks_lost ?? 0),
    fixabilityScore: Number(row.fixability_score ?? 0.6),
    priorityRank: row.priority_rank
  }))
}

export async function getRisingMistakeSignals(userId: string, limit: number = 3): Promise<MistakeTrendSignal[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('mistake_trend_signals')
    .select('*')
    .eq('user_id', userId)
    .eq('trend', 'rising')
    .order('recent_count', { ascending: false })
    .order('marks_delta', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as any[]).map(row => ({
    userId: row.user_id,
    subject: row.subject,
    topic: row.topic,
    mistakeType: row.mistake_type,
    recentCount: Number(row.recent_count ?? 0),
    previousCount: Number(row.previous_count ?? 0),
    recentMarksLost: Number(row.recent_marks_lost ?? 0),
    previousMarksLost: Number(row.previous_marks_lost ?? 0),
    countDelta: Number(row.count_delta ?? 0),
    marksDelta: Number(row.marks_delta ?? 0),
    recentAvoidable: Number(row.recent_avoidable ?? 0),
    lastSeenAt: new Date(row.last_seen_at),
    trend: row.trend
  }))
}

export async function lockMicroAction(actionId: string): Promise<void> {
  if (!supabase) return

  await supabase
    .from('micro_actions')
    .update({ locked: true, locked_at: new Date().toISOString() })
    .eq('id', actionId)
}

export async function recordLockedMicroActionOutcome(actionId: string, done: boolean): Promise<void> {
  if (!supabase) return

  await supabase
    .from('micro_actions')
    .update({
      lock_checked_at: new Date().toISOString(),
      locked_done: done,
      completed: done
    })
    .eq('id', actionId)
}

// Weekly reality check operations
export async function createWeeklyReality(
  userId: string,
  realityData: Omit<WeeklyReality, 'id' | 'userId' | 'createdAt'>
): Promise<WeeklyReality | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('weekly_reality')
    .insert({
      user_id: userId,
      week_start_date: realityData.weekStartDate,
      confidence_score: realityData.confidenceScore ?? null,
      avoided_weak_subjects: realityData.answers.avoidedWeakSubjects,
      revised_content: realityData.answers.revisedContent,
      ready_for_basics: realityData.answers.readyForBasics,
      consistent_effort: realityData.answers.consistentEffort,
      honest_with_self: realityData.answers.honestWithSelf,
      reality_score: realityData.realityScore,
      trajectory_message: realityData.trajectoryMessage
    })
    .select()
    .single()

  if (error) {
    logError('createWeeklyReality', error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    weekStartDate: data.week_start_date,
    confidenceScore: data.confidence_score ?? undefined,
    answers: {
      avoidedWeakSubjects: data.avoided_weak_subjects,
      revisedContent: data.revised_content,
      readyForBasics: data.ready_for_basics,
      consistentEffort: data.consistent_effort,
      honestWithSelf: data.honest_with_self
    },
    realityScore: data.reality_score,
    trajectoryMessage: data.trajectory_message,
    createdAt: new Date(data.created_at)
  }
}

export async function getWeeklyReality(userId: string, weekStartDate: string): Promise<WeeklyReality | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('weekly_reality')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .maybeSingle()

  // When no row exists, maybeSingle returns { data: null, error: null }.
  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    weekStartDate: data.week_start_date,
    confidenceScore: data.confidence_score ?? undefined,
    answers: {
      avoidedWeakSubjects: data.avoided_weak_subjects,
      revisedContent: data.revised_content,
      readyForBasics: data.ready_for_basics,
      consistentEffort: data.consistent_effort,
      honestWithSelf: data.honest_with_self
    },
    realityScore: data.reality_score,
    trajectoryMessage: data.trajectory_message,
    createdAt: new Date(data.created_at)
  }
}

// Emotional check-in operations
export async function getLatestEmotionalCheckIn(userId: string): Promise<EmotionalCheckIn | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('emotional_check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    feeling: data.feeling as EmotionalFeeling,
    createdAt: new Date(data.created_at)
  }
}

export async function createEmotionalCheckIn(userId: string, date: string, feeling: EmotionalFeeling): Promise<EmotionalCheckIn | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('emotional_check_ins')
    .insert({ user_id: userId, date, feeling })
    .select('*')
    .single()

  if (error || !data) {
    logError('createEmotionalCheckIn', error || 'No data')
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    feeling: data.feeling as EmotionalFeeling,
    createdAt: new Date(data.created_at)
  }
}

// Exam tomorrow operations
export async function getLatestExamTomorrowCheck(userId: string): Promise<ExamTomorrowCheck | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('exam_tomorrow_checks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    response: data.response as ExamTomorrowResponse,
    createdAt: new Date(data.created_at)
  }
}

export async function createExamTomorrowCheck(userId: string, date: string, response: ExamTomorrowResponse): Promise<ExamTomorrowCheck | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('exam_tomorrow_checks')
    .insert({ user_id: userId, date, response })
    .select('*')
    .single()

  if (error || !data) {
    logError('createExamTomorrowCheck', error || 'No data')
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    response: data.response as ExamTomorrowResponse,
    createdAt: new Date(data.created_at)
  }
}

// Monthly snapshot operations
export async function getMonthlySnapshot(userId: string, monthStartDate: string): Promise<MonthlySnapshot | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('monthly_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('month_start_date', monthStartDate)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    userId: data.user_id,
    monthStartDate: data.month_start_date,
    avgDailyMinutes: data.avg_daily_minutes,
    consistencyDays: data.consistency_days,
    biggestImprovement: data.biggest_improvement,
    reflection: data.reflection,
    createdAt: new Date(data.created_at)
  }
}

export async function createMonthlySnapshot(userId: string, snapshot: Omit<MonthlySnapshot, 'id' | 'userId' | 'createdAt'>): Promise<MonthlySnapshot | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('monthly_snapshots')
    .insert({
      user_id: userId,
      month_start_date: snapshot.monthStartDate,
      avg_daily_minutes: snapshot.avgDailyMinutes,
      consistency_days: snapshot.consistencyDays,
      biggest_improvement: snapshot.biggestImprovement,
      reflection: snapshot.reflection
    })
    .select('*')
    .single()

  if (error || !data) {
    logError('createMonthlySnapshot', error || 'No data')
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    monthStartDate: data.month_start_date,
    avgDailyMinutes: data.avg_daily_minutes,
    consistencyDays: data.consistency_days,
    biggestImprovement: data.biggest_improvement,
    reflection: data.reflection,
    createdAt: new Date(data.created_at)
  }
}

// Pods operations (RPC)
export async function createPod(displayName: string = 'Anonymous'): Promise<{ pod: Pod; joined: boolean } | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data: authData } = await supabase.auth.getUser()
  const ownerId = authData?.user?.id
  if (!ownerId) {
    throw new Error('Please sign in to create a pod')
  }

  const { data, error } = await supabase.rpc('create_pod', { p_display_name: displayName })
  if (error) {
    logError('createPod', error)
    throw new Error(error.message || 'Failed to create pod')
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    logError('createPod', 'No data returned')
    throw new Error('Pod creation returned no data. Please check database setup.')
  }

  const row = Array.isArray(data) ? data[0] : data
  const pod: Pod = {
    id: row.pod_id,
    ownerId,
    inviteCode: row.invite_code,
    weeklyGoalMinutes: 600, // default
    createdAt: new Date()
  }

  return { pod, joined: true }
}

export async function joinPod(inviteCode: string, displayName: string = 'Anonymous'): Promise<string | null> {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user?.id) {
    throw new Error('Please sign in to join a pod')
  }

  const { data, error } = await supabase.rpc('join_pod', { p_invite_code: inviteCode, p_display_name: displayName })
  if (error) {
    logError('joinPod', error)
    throw new Error(error.message || 'Failed to join pod')
  }
  if (!data) {
    throw new Error('Invalid invite code or pod is full')
  }
  return String(data)
}

export async function getPodStatus(podId: string, date: string): Promise<PodStatusRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_pod_status', { p_pod_id: podId, p_date: date })
  if (error || !data) {
    logError('getPodStatus', error || 'No data')
    return []
  }

  return (data as any[]).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name || 'Anonymous',
    checkedIn: Boolean(row.checked_in),
    verdictStatus: (row.verdict_status as any) ?? null
  }))
}

export async function updatePodDisplayName(podId: string, displayName: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('update_pod_display_name', { 
    p_pod_id: podId, 
    p_display_name: displayName 
  })
  
  if (error) {
    logError('updatePodDisplayName', error)
    return false
  }
  
  return Boolean(data)
}

// Enhanced pod status with gamification data
export async function getPodStatusEnhanced(podId: string, date: string): Promise<PodStatusEnhanced[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_pod_status_enhanced', { p_pod_id: podId, p_date: date })
  if (error || !data) {
    logError('getPodStatusEnhanced', error || 'No data')
    return []
  }

  return (data as any[]).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name || 'Anonymous',
    checkedIn: Boolean(row.checked_in),
    verdictStatus: (row.verdict_status as any) ?? null,
    currentStreak: row.current_streak || 0,
    bestStreak: row.best_streak || 0,
    totalKudos: row.total_kudos || 0,
    checkInTime: row.check_in_time ? new Date(row.check_in_time) : null,
    isFirstToday: Boolean(row.is_first_today),
    weekMinutes: row.week_minutes || 0,
    kudosFromMe: Boolean(row.kudos_from_me),
    memberStatus: row.member_status || 'approved',
    joinedAt: row.joined_at ? new Date(row.joined_at) : null,
    isOwner: Boolean(row.is_owner)
  }))
}

// Get pod weekly summary with stats
export async function getPodWeeklySummary(podId: string): Promise<PodWeeklySummary | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_pod_weekly_summary', { p_pod_id: podId })
  if (error || !data) {
    logError('getPodWeeklySummary', error || 'No data')
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  return {
    totalMinutes: row.total_minutes || 0,
    weeklyGoal: row.weekly_goal || 600,
    goalProgressPct: row.goal_progress_pct || 0,
    podStreak: row.pod_streak || 0,
    topPerformerName: row.top_performer_name || null,
    topPerformerMinutes: row.top_performer_minutes || 0,
    avgDailyCheckIns: parseFloat(row.avg_daily_check_ins) || 0
  }
}

// Send kudos to a pod member
export async function sendPodKudos(podId: string, toUserId: string, emoji: string = '👏'): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('send_pod_kudos', { 
    p_pod_id: podId, 
    p_to_user_id: toUserId, 
    p_emoji: emoji 
  })
  
  if (error) {
    logError('sendPodKudos', error)
    return false
  }
  
  return Boolean(data)
}

// Get today's kudos for the pod
export async function getPodKudosToday(podId: string): Promise<PodKudos[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_pod_kudos_today', { p_pod_id: podId })
  if (error || !data) {
    logError('getPodKudosToday', error || 'No data')
    return []
  }

  return (data as any[]).map((row) => ({
    toUserId: row.to_user_id,
    fromDisplayName: row.from_display_name || 'Anonymous',
    emoji: row.emoji || '👏'
  }))
}

// Update pod weekly goal (owner only)
export async function updatePodWeeklyGoal(podId: string, goalMinutes: number): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('update_pod_weekly_goal', { 
    p_pod_id: podId, 
    p_goal_minutes: goalMinutes 
  })
  
  if (error) {
    logError('updatePodWeeklyGoal', error)
    return false
  }
  
  return Boolean(data)
}

// Start a study session (visible to pod members)
export async function startPodStudySession(podId: string, subject?: string, targetMinutes?: number): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('start_pod_study_session', { 
    p_pod_id: podId,
    p_subject: subject || null,
    p_target_minutes: targetMinutes || null
  })
  
  if (error) {
    logError('startPodStudySession', error)
    return false
  }
  
  return Boolean(data)
}

// End a study session
export async function endPodStudySession(podId: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('end_pod_study_session', { p_pod_id: podId })
  
  if (error) {
    logError('endPodStudySession', error)
    return false
  }
  
  return Boolean(data)
}

// Get who's currently studying in the pod
export async function getPodStudyingNow(podId: string): Promise<PodStudySession[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_pod_studying_now', { p_pod_id: podId })
  if (error || !data) {
    logError('getPodStudyingNow', error || 'No data')
    return []
  }

  return (data as any[]).map((row) => ({
    userId: row.out_user_id || row.user_id,
    displayName: row.out_display_name || row.display_name || 'Anonymous',
    subject: row.out_subject || row.subject,
    startedAt: new Date(row.out_started_at || row.started_at),
    minutesElapsed: row.out_minutes_elapsed || row.minutes_elapsed || 0,
    targetMinutes: row.out_target_minutes || row.target_minutes
  }))
}

// Send a motivational message
export async function sendPodMessage(
  podId: string, 
  toUserId: string | null, 
  messageType: string, 
  messageKey: string
): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('send_pod_message', { 
    p_pod_id: podId,
    p_to_user_id: toUserId,
    p_message_type: messageType,
    p_message_key: messageKey
  })
  
  if (error) {
    logError('sendPodMessage', error)
    return false
  }
  
  return Boolean(data)
}

// Get recent messages for the pod
export async function getPodMessagesRecent(podId: string): Promise<PodMessage[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_pod_messages_recent', { p_pod_id: podId })
  if (error || !data) {
    logError('getPodMessagesRecent', error || 'No data')
    return []
  }

  return (data as any[]).map((row) => ({
    fromUserId: row.from_user_id,
    fromDisplayName: row.from_display_name || 'Anonymous',
    toUserId: row.to_user_id,
    toDisplayName: row.to_display_name,
    messageType: row.message_type,
    messageKey: row.message_key,
    createdAt: new Date(row.created_at)
  }))
}

// Get pod achievements
export async function getPodAchievements(podId: string): Promise<PodAchievement[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_pod_achievements', { p_pod_id: podId })
  if (error || !data) {
    logError('getPodAchievements', error || 'No data')
    return []
  }

  return (data as any[]).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name || 'Anonymous',
    achievementType: row.achievement_type,
    achievementData: row.achievement_data || {},
    unlockedAt: new Date(row.unlocked_at)
  }))
}

// Unlock an achievement
export async function unlockPodAchievement(
  podId: string, 
  achievementType: string, 
  achievementData: Record<string, any> = {}
): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('unlock_pod_achievement', { 
    p_pod_id: podId,
    p_achievement_type: achievementType,
    p_achievement_data: achievementData
  })
  
  if (error) {
    logError('unlockPodAchievement', error)
    return false
  }
  
  return Boolean(data)
}

// Get daily challenge for the pod
export async function getPodDailyChallenge(podId: string): Promise<PodDailyChallenge | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_pod_daily_challenge', { p_pod_id: podId })
  if (error || !data) {
    logError('getPodDailyChallenge', error || 'No data')
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  return {
    challengeType: row.challenge_type,
    challengeTitle: row.challenge_title,
    challengeDescription: row.challenge_description,
    challengeTarget: row.challenge_target || 0,
    currentProgress: row.current_progress || 0,
    isCompleted: Boolean(row.is_completed)
  }
}

// Cohort stats operations
export async function getCohortStats(exam: string, date: string): Promise<CohortStats | null> {
  if (!supabase) return null
  
  const { data, error } = await supabase
    .from('cohort_stats')
    .select('*')
    .eq('exam', exam)
    .eq('date', date)
    .single()

  if (error || !data) return null

  return {
    exam: data.exam,
    date: data.date,
    medianStudyMinutes: data.median_study_minutes,
    participantCount: data.participant_count,
    updatedAt: new Date(data.updated_at)
  }
}

// Leave a pod (remove membership)
export async function leavePod(podId: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('leave_pod', { p_pod_id: podId })
  
  if (error) {
    logError('leavePod', error)
    return false
  }
  
  return Boolean(data)
}

// Gaming detection operations
export async function createGamingDetection(detection: GamingDetection): Promise<void> {
  if (!supabase) return
  
  await supabase
    .from('gaming_detections')
    .insert({
      user_id: detection.userId,
      detected_at: detection.detectedAt.toISOString(),
      same_minutes_daily: detection.patterns.sameMinutesDaily || false,
      always_yes_recall: detection.patterns.alwaysYesRecall || false,
      no_variance: detection.patterns.noVariance || false,
      prompted: detection.prompted
    })
}

export async function hasRecentGamingDetection(userId: string, daysAgo: number = 7): Promise<boolean> {
  if (!supabase) return false
  
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

  const { data, error } = await supabase
    .from('gaming_detections')
    .select('id')
    .eq('user_id', userId)
    .gte('detected_at', cutoffDate.toISOString())
    .limit(1)

  return !error && data && data.length > 0
}

// Get pod info including admin details
export async function getPodInfo(podId: string): Promise<{
  podId: string
  podName: string | null
  ownerId: string
  inviteCode: string
  weeklyGoalMinutes: number
  createdAt: Date
  isOwner: boolean
  memberCount: number
  pendingCount: number
} | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_pod_info', { p_pod_id: podId })
  
  if (error || !data || data.length === 0) {
    // Fallback to direct query if function doesn't exist
    const { data: podData, error: podError } = await supabase
      .from('pods')
      .select('*')
      .eq('id', podId)
      .single()
    
    if (podError || !podData) return null
    
    const { data: { user } } = await supabase.auth.getUser()
    
    return {
      podId: podData.id,
      podName: podData.name || null,
      ownerId: podData.owner_id,
      inviteCode: podData.invite_code,
      weeklyGoalMinutes: podData.weekly_goal_minutes || 600,
      createdAt: new Date(podData.created_at),
      isOwner: user?.id === podData.owner_id,
      memberCount: 0,
      pendingCount: 0
    }
  }
  
  const row = data[0]
  return {
    podId: row.pod_id,
    podName: row.pod_name,
    ownerId: row.owner_id,
    inviteCode: row.invite_code,
    weeklyGoalMinutes: row.weekly_goal_minutes,
    createdAt: new Date(row.created_at),
    isOwner: row.is_owner,
    memberCount: row.member_count,
    pendingCount: row.pending_count
  }
}

// Approve a pending pod member (admin only)
export async function approvePodMember(podId: string, userId: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('approve_pod_member', { 
    p_pod_id: podId, 
    p_user_id: userId 
  })
  
  if (error) {
    logError('approvePodMember', error)
    return false
  }
  
  return Boolean(data)
}

// Reject a pending pod member (admin only)
export async function rejectPodMember(podId: string, userId: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('reject_pod_member', { 
    p_pod_id: podId, 
    p_user_id: userId 
  })
  
  if (error) {
    logError('rejectPodMember', error)
    return false
  }
  
  return Boolean(data)
}

// Remove an approved pod member (admin only)
export async function removePodMember(podId: string, userId: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase.rpc('remove_pod_member', { 
    p_pod_id: podId, 
    p_user_id: userId 
  })
  
  if (error) {
    logError('removePodMember', error)
    return false
  }
  
  return Boolean(data)
}
