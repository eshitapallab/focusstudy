import { supabase } from './supabaseClient'
import { logError } from './errorLogger'
import type {
  User,
  DailyCheckIn,
  WeeklyReality,
  Verdict,
  MicroAction,
  CohortStats,
  GamingDetection
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

  if (error || !data) return null

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
    createdAt: new Date(data.created_at)
  }
}

export async function updateStudyUser(userId: string, updates: Partial<User>): Promise<void> {
  if (!supabase) return
  
  const updateData: any = {}
  if (updates.examDate !== undefined) updateData.exam_date = updates.examDate?.toISOString()
  if (updates.dailyTargetMinutes !== undefined) updateData.daily_target_minutes = updates.dailyTargetMinutes
  if (updates.peerComparisonEnabled !== undefined) updateData.peer_comparison_enabled = updates.peerComparisonEnabled
  if (updates.notificationsEnabled !== undefined) updateData.notifications_enabled = updates.notificationsEnabled
  if (updates.lastWeeklyRealityCheck !== undefined) updateData.last_weekly_reality_check = updates.lastWeeklyRealityCheck?.toISOString()

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
      completed: actionData.completed
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
