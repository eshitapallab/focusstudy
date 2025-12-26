import { supabase } from './supabaseClient'
import { logError } from './errorLogger'
import type {
  User,
  DailyCheckIn,
  WeeklyReality,
  Verdict,
  MicroAction,
  CohortStats,
  GamingDetection,
  EmotionalCheckIn,
  EmotionalFeeling,
  ExamTomorrowCheck,
  ExamTomorrowResponse,
  MonthlySnapshot,
  Pod,
  PodStatusRow
} from './types'

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
    .single()

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
    .single()

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

export async function completeMicroAction(actionId: string): Promise<void> {
  if (!supabase) return
  
  await supabase
    .from('micro_actions')
    .update({ completed: true })
    .eq('id', actionId)
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
    .single()

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
export async function createPod(): Promise<{ pod: Pod; joined: boolean } | null> {
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const ownerId = authData?.user?.id
  if (!ownerId) {
    logError('createPod', 'No authenticated user')
    return null
  }

  const { data, error } = await supabase.rpc('create_pod')
  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    logError('createPod', error || 'No data')
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  const pod: Pod = {
    id: row.pod_id,
    ownerId,
    inviteCode: row.invite_code,
    createdAt: new Date()
  }

  return { pod, joined: true }
}

export async function joinPod(inviteCode: string): Promise<string | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('join_pod', { p_invite_code: inviteCode })
  if (error || !data) {
    logError('joinPod', error || 'No data')
    return null
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
    checkedIn: Boolean(row.checked_in),
    verdictStatus: (row.verdict_status as any) ?? null
  }))
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
