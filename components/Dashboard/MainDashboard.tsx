'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppNav from '@/components/Navigation/AppNav'
import { supabase } from '@/lib/supabaseClient'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import {
  getStudyUser,
  createStudyUser,
  getDailyCheckIn,
  createDailyCheckIn,
  getTodayVerdict,
  createVerdict,
  getTodayMicroAction,
  createMicroAction,
  getMicroActionForDate,
  recordLockedMicroActionOutcome,
  getRecentCheckIns,
  getRecentVerdicts,
  updateStudyUser,
  getWeeklyReality,
  createWeeklyReality,
  getLatestEmotionalCheckIn,
  createEmotionalCheckIn,
  getLatestExamTomorrowCheck,
  createExamTomorrowCheck,
  getMonthlySnapshot,
  createMonthlySnapshot,
  createGamingDetection,
  hasRecentGamingDetection
} from '@/lib/supabaseStudyTrack'
import { calculateVerdict } from '@/lib/verdictEngine'
import { generateMicroAction } from '@/lib/microActionGenerator'
import { calculateRealityScore, generateTrajectoryMessage } from '@/lib/realityCheck'
import { detectGamingPatterns, getHonestyPrompt, shouldPromptHonesty } from '@/lib/gamingDetection'
import { User, DailyCheckIn, Verdict, MicroAction, WeeklyReality, EmotionalFeeling, ExamTomorrowResponse, MonthlySnapshot } from '@/lib/types'
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow'
import DailyCheckInCard from '@/components/CheckIn/DailyCheckInCard'
import VerdictCard from '@/components/Verdict/VerdictCard'
import MicroActionCard from '@/components/Actions/MicroActionCard'
import WeeklyRealityCheck from '@/components/Reality/WeeklyRealityCheck'
import PeerComparison from '@/components/Peer/PeerComparison'
import ShareSnapshot from '@/components/Share/ShareSnapshot'
import SafetyPrompt from '@/components/Safety/SafetyPrompt'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [setupError, setSetupError] = useState<{ title: string; message: string; steps?: string[] } | null>(null)
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [microAction, setMicroAction] = useState<MicroAction | null>(null)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showRealityCheck, setShowRealityCheck] = useState(false)
  const [recentVerdicts, setRecentVerdicts] = useState<Verdict[]>([])
  const [honestyPrompt, setHonestyPrompt] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [lockedFollowUpAction, setLockedFollowUpAction] = useState<MicroAction | null>(null)
  const [weakSubjectNudge, setWeakSubjectNudge] = useState<string | null>(null)
  const [revisionDebtLevel, setRevisionDebtLevel] = useState<'low' | 'medium' | 'high' | null>(null)
  const [fakeBusyMessage, setFakeBusyMessage] = useState<string | null>(null)
  const [showEmotionalCheckIn, setShowEmotionalCheckIn] = useState(false)
  const [showExamTomorrow, setShowExamTomorrow] = useState(false)
  const [recentExamTomorrowResponse, setRecentExamTomorrowResponse] = useState<ExamTomorrowResponse | null>(null)
  const [showResetPrompt, setShowResetPrompt] = useState(false)
  const [monthlySnapshot, setMonthlySnapshot] = useState<MonthlySnapshot | null>(null)
  const [peopleLikeYouInsight, setPeopleLikeYouInsight] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // Auth listener
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      if (!supabase) {
        console.error('Supabase not configured')
        if (mounted) {
          setSetupError({
            title: 'Missing Supabase configuration',
            message: 'This app needs Supabase environment variables to run.',
            steps: [
              'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment (e.g., Vercel).',
              'Redeploy after saving env vars.'
            ]
          })
          setLoading(false)
        }
        return
      }
      
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          // Sign in anonymously
          const { error } = await supabase.auth.signInAnonymously()
          if (error) {
            console.error('Auth error:', error)
            if (mounted) {
              const message = typeof error?.message === 'string' ? error.message : 'Anonymous sign-in failed.'
              setSetupError({
                title: 'Anonymous sign-in unavailable',
                message,
                steps: [
                  'In Supabase Dashboard → Authentication → Providers, enable Anonymous sign-ins.',
                  'Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set for this deployment.',
                  'Refresh /track after enabling.'
                ]
              })
              setLoading(false)
            }
            return
          }
          if (!mounted) return
          
          // New anonymous user - show onboarding
          setShowOnboarding(true)
          setLoading(false)
          return
        }

        const supabaseUser = session.user
        
        // Load user data
        const userData = await getStudyUser(supabaseUser.id)
        if (!userData) {
          // User exists in auth but not in study_users - show onboarding
          if (mounted) {
            setShowOnboarding(true)
            setLoading(false)
          }
          return
        }

        if (!mounted) return
        setUser(userData)

        // Load today's data
        const checkIn = await getDailyCheckIn(supabaseUser.id, today)
        if (mounted) setTodayCheckIn(checkIn)

        // Load broader check-in history for lightweight insights
        const recentCheckInsForInsights = await getRecentCheckIns(supabaseUser.id, 30)

        // Reset without guilt: prompt after inactivity
        const mostRecentDate = recentCheckInsForInsights[0]?.date
        if (mostRecentDate) {
          const mostRecent = new Date(mostRecentDate)
          const diffDays = Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays >= 7) {
            if (mounted) setShowResetPrompt(true)
          }
        }

        // Weak-subject detection (silent, once a week)
        try {
          const lastNudgeDays = userData.lastWeakSubjectNudgeAt
            ? Math.floor((Date.now() - userData.lastWeakSubjectNudgeAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999

          if (lastNudgeDays >= 7 && recentCheckInsForInsights.length >= 6) {
            const lastSeenBySubject = new Map<string, string>()
            const noCounts = new Map<string, number>()
            const totalCounts = new Map<string, number>()

            for (const c of recentCheckInsForInsights) {
              totalCounts.set(c.subject, (totalCounts.get(c.subject) || 0) + 1)
              if (!c.couldRevise) noCounts.set(c.subject, (noCounts.get(c.subject) || 0) + 1)
              if (!lastSeenBySubject.has(c.subject)) lastSeenBySubject.set(c.subject, c.date)
            }

            // Longest time since last studied
            let bestSubject: string | null = null
            let bestDays = 0
            for (const [subject, lastDate] of lastSeenBySubject.entries()) {
              const dt = new Date(lastDate)
              const days = Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24))
              if (days > bestDays) {
                bestDays = days
                bestSubject = subject
              }
            }

            // Highest "No" frequency (if enough samples)
            let worstRecallSubject: string | null = null
            let worstRecallRate = 0
            for (const [subject, total] of totalCounts.entries()) {
              if (total < 3) continue
              const no = noCounts.get(subject) || 0
              const rate = no / total
              if (rate > worstRecallRate) {
                worstRecallRate = rate
                worstRecallSubject = subject
              }
            }

            if (bestSubject && bestDays >= 7) {
              if (mounted) setWeakSubjectNudge(`You haven't touched ${bestSubject} in ${bestDays} days.`)
              await updateStudyUser(supabaseUser.id, { lastWeakSubjectNudgeAt: new Date() })
            } else if (worstRecallSubject && worstRecallRate >= 0.6) {
              if (mounted) setWeakSubjectNudge(`Recall is often "No" for ${worstRecallSubject}. Consider a quick revision.`)
              await updateStudyUser(supabaseUser.id, { lastWeakSubjectNudgeAt: new Date() })
            }
          }
        } catch (e) {
          console.warn('Weak-subject detection skipped:', e)
        }

        // Revision debt meter (simple, no schedules)
        try {
          const last14 = recentCheckInsForInsights.slice(0, 14)
          const debt = Math.max(
            0,
            last14.filter((c) => !c.couldRevise).length - last14.filter((c) => c.couldRevise).length
          )
          const level = debt >= 6 ? 'high' : debt >= 3 ? 'medium' : 'low'
          if (mounted) setRevisionDebtLevel(level)
        } catch (e) {
          console.warn('Revision debt skipped:', e)
        }

        if (checkIn) {
          // Load verdict
          const todayVerdict = await getTodayVerdict(supabaseUser.id, today)
          if (mounted) setVerdict(todayVerdict)

          // Load micro action
          const action = await getTodayMicroAction(supabaseUser.id, today)
          if (mounted) setMicroAction(action)

          // Tomorrow Lock follow-up: ask about yesterday's locked action
          const yesterdayDate = (() => {
            const d = new Date()
            d.setDate(d.getDate() - 1)
            return d.toISOString().split('T')[0]
          })()
          const yAction = await getMicroActionForDate(supabaseUser.id, yesterdayDate)
          if (yAction?.locked && !yAction.lockCheckedAt) {
            if (mounted) setLockedFollowUpAction(yAction)
          }

          // Fake busy detector (lightweight heuristic)
          try {
            const last3 = recentCheckInsForInsights.slice(0, 3)
            const avgMinutes = last3.length > 0 ? last3.reduce((s, c) => s + c.minutesStudied, 0) / last3.length : 0
            const yesRate = last3.length > 0 ? last3.filter((c) => c.couldRevise).length / last3.length : 1
            if (todayVerdict && avgMinutes >= userData.dailyTargetMinutes * 1.1 && yesRate < 0.35) {
              if (mounted) setFakeBusyMessage("You're spending time, but retention is low. Reduce hours tomorrow.")
            }
          } catch (e) {
            console.warn('Fake busy detector skipped:', e)
          }

          // Emotional check-in (every 3–4 days)
          try {
            const lastEmotion = await getLatestEmotionalCheckIn(supabaseUser.id)
            if (!lastEmotion) {
              if (mounted) setShowEmotionalCheckIn(true)
            } else {
              const lastDt = new Date(lastEmotion.date)
              const diffDays = Math.floor((Date.now() - lastDt.getTime()) / (1000 * 60 * 60 * 24))
              if (diffDays >= 3) {
                if (mounted) setShowEmotionalCheckIn(true)
              }
            }
          } catch (e) {
            console.warn('Emotional check-in skipped:', e)
          }

          // If exam were tomorrow (every ~2 weeks)
          try {
            const lastExamTomorrow = await getLatestExamTomorrowCheck(supabaseUser.id)
            if (!lastExamTomorrow) {
              if (mounted) setShowExamTomorrow(true)
            } else {
              if (mounted) setRecentExamTomorrowResponse(lastExamTomorrow.response)
              const lastDt = new Date(lastExamTomorrow.date)
              const diffDays = Math.floor((Date.now() - lastDt.getTime()) / (1000 * 60 * 60 * 24))
              if (diffDays >= 14) {
                if (mounted) setShowExamTomorrow(true)
              }
            }
          } catch (e) {
            console.warn('Exam tomorrow skipped:', e)
          }

          // Monthly snapshot (generate once per month on first visit)
          try {
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const monthStartStr = monthStart.toISOString().split('T')[0]
            const existing = await getMonthlySnapshot(supabaseUser.id, monthStartStr)
            if (existing) {
              if (mounted) setMonthlySnapshot(existing)
            } else {
              // Generate a simple snapshot from the recent data we already have.
              const monthCheckIns = recentCheckInsForInsights.filter((c) => new Date(c.date) >= monthStart)
              const total = monthCheckIns.reduce((s, c) => s + c.minutesStudied, 0)
              const uniqueDays = new Set(monthCheckIns.map((c) => c.date)).size
              const daysElapsed = Math.max(1, Math.floor((Date.now() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
              const avgDaily = Math.round(total / daysElapsed)

              const biggestImprovement = monthCheckIns.length === 0
                ? 'Showing up'
                : monthCheckIns.filter((c) => c.couldRevise).length >= monthCheckIns.filter((c) => !c.couldRevise).length
                  ? 'Recall'
                  : 'Consistency'

              const reflection = uniqueDays >= 10
                ? 'You are building a real habit. Keep it honest.'
                : 'Small wins count. One honest check-in at a time.'

              const created = await createMonthlySnapshot(supabaseUser.id, {
                monthStartDate: monthStartStr,
                avgDailyMinutes: avgDaily,
                consistencyDays: uniqueDays,
                biggestImprovement,
                reflection
              })
              if (created && mounted) setMonthlySnapshot(created)
            }
          } catch (e) {
            console.warn('Monthly snapshot skipped:', e)
          }
        } else {
          // Show check-in modal
          if (mounted) setShowCheckIn(true)
        }

        // Load recent verdicts for safety check
        const verdicts = await getRecentVerdicts(supabaseUser.id, 7)
        if (mounted) setRecentVerdicts(verdicts)

        // Check if weekly reality check is due
        const weekStart = getWeekStartDate(new Date())
        const reality = await getWeeklyReality(supabaseUser.id, weekStart)
        const daysSinceLastCheck = userData.lastWeeklyRealityCheck
          ? Math.floor((Date.now() - userData.lastWeeklyRealityCheck.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        if (!reality && daysSinceLastCheck >= 7) {
          if (mounted) setShowRealityCheck(true)
        }

        // Check for gaming patterns
        if (checkIn) {
          const recentCheckIns = await getRecentCheckIns(supabaseUser.id, 10)
          const patterns = detectGamingPatterns(recentCheckIns)
          const hasRecent = await hasRecentGamingDetection(supabaseUser.id, 7)

          if (shouldPromptHonesty(patterns, hasRecent)) {
            if (mounted) setHonestyPrompt(getHonestyPrompt(patterns))
            await createGamingDetection({
              userId: supabaseUser.id,
              detectedAt: new Date(),
              patterns,
              prompted: true
            })
          }
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
        if (mounted) {
          const message = error instanceof Error ? error.message : 'Unexpected error while loading.'
          const isSchemaMissing = message.toLowerCase().includes('database tables are not available')
          setSetupError({
            title: 'Unable to load StudyTrack',
            message,
            steps: [
              'Verify Supabase env vars are set for this deployment.',
              ...(isSchemaMissing
                ? [
                    'Run supabase/migrations/002_studytrack_schema.sql in Supabase SQL Editor (creates study_users and related tables).',
                    'In Supabase Settings → API, ensure exposed schemas include public.',
                  ]
                : ['Ensure the StudyTrack SQL migration has been run in Supabase (tables + RLS).']),
              'Try reloading /track.'
            ]
          })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth changes
    if (!supabase) {
      return () => { mounted = false }
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && mounted) {
        initAuth()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [today])

  // People-like-you insight (occasional, non-competitive)
  useEffect(() => {
    if (!verdict) return

    try {
      const key = 'ff_studytrack_people_like_you_last_shown'
      const last = localStorage.getItem(key)
      const lastTs = last ? Number(last) : 0
      const daysSince = lastTs ? Math.floor((Date.now() - lastTs) / (1000 * 60 * 60 * 24)) : 999

      if (daysSince < 7) return

      let message: string | null = null
      if (verdict.streak >= 7) {
        message = 'People with a solid streak often improve fastest by keeping revision short and frequent.'
      } else if (verdict.recallRatio < 0.5) {
        message = 'People with similar recall signals often benefit from reducing volume and increasing revision.'
      } else if (verdict.studyMinutes < verdict.targetMinutes * 0.7) {
        message = 'People who are slightly under target usually stabilize by protecting one small daily session.'
      }

      if (!message) return

      setPeopleLikeYouInsight(message)
      localStorage.setItem(key, String(Date.now()))
    } catch {
      // ignore localStorage failures
    }
  }, [verdict])

  const handleOnboardingComplete = async (data: Omit<User, 'id' | 'createdAt'>) => {
    if (!supabase) return
    
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (!supabaseUser) return

      const newUser = (await getStudyUser(supabaseUser.id)) || (await createStudyUser(supabaseUser.id, data))
      if (newUser) {
        setUser(newUser)
        setShowOnboarding(false)
        setShowCheckIn(true)
        setSetupError(null)
      } else {
        setSetupError({
          title: 'Account setup failed',
          message: "We couldn't create your profile in the database.",
          steps: [
            'Run the StudyTrack migration SQL in Supabase (creates tables + policies).',
            'Verify Row Level Security policies allow the current user to insert into study_users.',
            'Refresh /track and try onboarding again.'
          ]
        })
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setSetupError({
        title: 'Account setup failed',
        message: error instanceof Error ? error.message : 'Unexpected error during onboarding.',
        steps: [
          'Verify Supabase is reachable from the browser (env vars set).',
          'Ensure database tables exist (migration applied).'
        ]
      })
    }
  }

  const handleCheckInSubmit = async (data: Omit<DailyCheckIn, 'id' | 'userId' | 'createdAt' | 'date'>) => {
    if (!user) return

    try {
      // Create check-in
      const checkIn = await createDailyCheckIn(user.id, {
        ...data,
        date: today
      })
      if (!checkIn) return

      setTodayCheckIn(checkIn)
      setShowCheckIn(false)

      // Calculate verdict
      const recentCheckIns = await getRecentCheckIns(user.id, 7)
      const verdictResult = await calculateVerdict({
        userId: user.id,
        date: today,
        user,
        todayCheckIn: checkIn,
        recentCheckIns: [checkIn, ...recentCheckIns]
      })

      const newVerdict = await createVerdict(user.id, {
        ...verdictResult,
        date: today
      })
      if (!newVerdict) return

      setVerdict(newVerdict)

      // Generate micro action
      const action = await generateMicroAction([checkIn, ...recentCheckIns], newVerdict)
      const newMicroAction = await createMicroAction(user.id, {
        verdictId: newVerdict.id,
        date: today,
        task: action.task,
        durationMinutes: action.durationMinutes,
        relatedSubjects: action.relatedSubjects,
        completed: false
      })
      setMicroAction(newMicroAction)

      // Check for gaming patterns
      const allCheckIns = [checkIn, ...recentCheckIns]
      const patterns = detectGamingPatterns(allCheckIns)
      const hasRecent = await hasRecentGamingDetection(user.id, 7)

      if (shouldPromptHonesty(patterns, hasRecent)) {
        setHonestyPrompt(getHonestyPrompt(patterns))
        await createGamingDetection({
          userId: user.id,
          detectedAt: new Date(),
          patterns,
          prompted: true
        })
      }
    } catch (error) {
      console.error('Error submitting check-in:', error)
    }
  }

  const handleRealityCheckSubmit = async (payload: { answers: WeeklyReality['answers']; confidenceScore: number }) => {
    if (!user) {
      throw new Error('User not loaded')
    }

    const { answers, confidenceScore } = payload

    const score = calculateRealityScore(answers)
    const message = generateTrajectoryMessage(score)
    const weekStart = getWeekStartDate(new Date())

    await createWeeklyReality(user.id, {
      weekStartDate: weekStart,
      confidenceScore,
      answers,
      realityScore: score,
      trajectoryMessage: message
    })

    await updateStudyUser(user.id, {
      lastWeeklyRealityCheck: new Date()
    })

    const diff = confidenceScore - score
    const gap: 'aligned' | 'overconfidence' | 'underconfidence' =
      Math.abs(diff) < 15 ? 'aligned' : diff > 0 ? 'overconfidence' : 'underconfidence'
    return { realityScore: score, confidenceScore, gap }
  }

  const handleCompleteMicroAction = async () => {
    if (!microAction) return
    // This would update the micro action as complete in the database
    setMicroAction({ ...microAction, completed: true })
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />
  }

  if (setupError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white border rounded-2xl p-6">
          <h1 className="text-lg font-semibold text-gray-900">{setupError.title}</h1>
          <p className="mt-2 text-sm text-gray-700">{setupError.message}</p>
          {setupError.steps && setupError.steps.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc pl-5">
              {setupError.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setSetupError(null)
                setLoading(true)
                router.refresh()
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                setSetupError(null)
                setShowOnboarding(true)
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-800 font-medium hover:bg-gray-50"
            >
              Onboarding
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // No user state (shouldn't happen with anonymous auth)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Session not available. Please refresh.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppNav user={{ email: user.email, isAnonymous: user.isAnonymous }} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* User info header */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">StudyTrack</h2>
              <p className="text-sm text-gray-600">Preparing for {user.exam}</p>
              {user.examDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days to exam
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit profile"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {verdict && (
                <div className="text-right">
                  <div className="text-2xl">{verdict.streak > 0 ? '🔥' : '📚'}</div>
                  <div className="text-xs text-gray-500">{verdict.streak} day streak</div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Daily Check-in Modal */}
        {showCheckIn && (
          <DailyCheckInCard
            onSubmit={handleCheckInSubmit}
            onClose={() => setShowCheckIn(false)}
          />
        )}

        {/* Weekly Reality Check Modal */}
        {showRealityCheck && (
          <WeeklyRealityCheck 
            onSubmit={handleRealityCheckSubmit}
            onSkip={() => setShowRealityCheck(false)}
          />
        )}

        {/* Reset without guilt */}
        {showResetPrompt && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">Reset without guilt</div>
            <div className="text-sm text-gray-700 mt-1">Want to reset today? Past days won't count against you.</div>
            <button
              onClick={async () => {
                if (!user) return
                await updateStudyUser(user.id, { resetAt: new Date() })
                setUser({ ...user, resetAt: new Date() })
                setShowResetPrompt(false)
              }}
              className="mt-3 w-full py-2 px-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              Reset today
            </button>
          </div>
        )}

        {/* Tomorrow Lock follow-up */}
        {lockedFollowUpAction && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">Tomorrow Lock</div>
            <div className="text-sm text-gray-700 mt-1">Did you do what you locked yesterday?</div>
            <div className="mt-2 text-sm text-gray-600">{lockedFollowUpAction.task}</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  await recordLockedMicroActionOutcome(lockedFollowUpAction.id, true)
                  setLockedFollowUpAction(null)
                }}
                className="py-2 px-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
              >
                Yes
              </button>
              <button
                onClick={async () => {
                  await recordLockedMicroActionOutcome(lockedFollowUpAction.id, false)
                  setLockedFollowUpAction(null)
                }}
                className="py-2 px-3 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200"
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Weak-subject detection */}
        {weakSubjectNudge && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">Quiet nudge</div>
            <div className="text-sm text-gray-700 mt-1">{weakSubjectNudge}</div>
          </div>
        )}

        {/* Revision debt meter */}
        {revisionDebtLevel && (
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">Revision debt</div>
              <div className="text-sm font-medium text-gray-700">
                {revisionDebtLevel === 'low' ? 'Low' : revisionDebtLevel === 'medium' ? 'Medium' : 'High'}
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-1">No schedules — just a simple signal.</div>
          </div>
        )}

        {/* Fake busy detector */}
        {fakeBusyMessage && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">Reality check</div>
            <div className="text-sm text-gray-700 mt-1">{fakeBusyMessage}</div>
          </div>
        )}

        {/* People like you */}
        {peopleLikeYouInsight && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">People like you</div>
            <div className="text-sm text-gray-700 mt-1">{peopleLikeYouInsight}</div>
          </div>
        )}

        {/* Emotional check-in */}
        {showEmotionalCheckIn && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">How did studying feel today?</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([
                { key: 'calm', label: 'Calm' },
                { key: 'neutral', label: 'Neutral' },
                { key: 'draining', label: 'Draining' }
              ] as { key: EmotionalFeeling; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={async () => {
                    if (!user) return
                    await createEmotionalCheckIn(user.id, today, opt.key)
                    setShowEmotionalCheckIn(false)
                  }}
                  className="py-2 px-3 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* If exam were tomorrow */}
        {showExamTomorrow && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">If exam were tomorrow…</div>
            <div className="text-sm text-gray-700 mt-1">Could you clear the basics?</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([
                { key: 'yes', label: 'Yes' },
                { key: 'maybe', label: 'Maybe' },
                { key: 'no', label: 'No' }
              ] as { key: ExamTomorrowResponse; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={async () => {
                    if (!user) return
                    await createExamTomorrowCheck(user.id, today, opt.key)
                    setRecentExamTomorrowResponse(opt.key)
                    setShowExamTomorrow(false)
                  }}
                  className="py-2 px-3 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {recentExamTomorrowResponse && !showExamTomorrow && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">Exam tomorrow (last answer)</div>
            <div className="text-sm text-gray-700 mt-1">
              {recentExamTomorrowResponse === 'yes' ? 'Yes' : recentExamTomorrowResponse === 'maybe' ? 'Maybe' : 'No'}
            </div>
          </div>
        )}

        {/* Monthly snapshot */}
        {monthlySnapshot && (
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold text-gray-900">Memory snapshot</div>
            <div className="text-sm text-gray-700 mt-2">Average daily minutes: {monthlySnapshot.avgDailyMinutes}</div>
            <div className="text-sm text-gray-700">Consistency: {monthlySnapshot.consistencyDays} day(s) this month</div>
            <div className="text-sm text-gray-700">Biggest improvement: {monthlySnapshot.biggestImprovement}</div>
            <div className="text-sm text-gray-600 mt-2">{monthlySnapshot.reflection}</div>
          </div>
        )}

        {/* Honesty Prompt */}
        {honestyPrompt && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-center">
            <p className="text-amber-900 font-medium">{honestyPrompt}</p>
            <button
              onClick={() => setHonestyPrompt(null)}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              I understand
            </button>
          </div>
        )}

        {/* Today's Verdict */}
        {verdict && (
          <VerdictCard verdict={verdict} tone="neutral" />
        )}

        {/* Micro Action */}
        {microAction && (
          <MicroActionCard
            action={microAction}
            onComplete={handleCompleteMicroAction}
          />
        )}

        {/* Peer Comparison */}
        {user.peerComparisonEnabled && verdict && (
          <PeerComparison
            exam={user.exam}
            todayMinutes={verdict.studyMinutes}
            enabled={user.peerComparisonEnabled}
            onToggle={async () => {
              await updateStudyUser(user.id, {
                peerComparisonEnabled: !user.peerComparisonEnabled
              })
              setUser({ ...user, peerComparisonEnabled: !user.peerComparisonEnabled })
            }}
          />
        )}

        {/* Share Snapshot */}
        {verdict && (
          <ShareSnapshot
            status={verdict.status}
            hoursStudied={Math.round(verdict.studyMinutes / 60 * 10) / 10}
            exam={user.exam}
            streak={verdict.streak}
          />
        )}

        {/* Safety Check */}
        {recentVerdicts.filter(v => v.status === 'falling-behind').length >= 3 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
            <p className="text-red-900 font-medium">
              We've noticed consistent struggles. Remember: Your worth isn't measured by study hours. 
              Consider reaching out to someone you trust or taking a mental health break. 
              Your wellbeing matters more than any exam.
            </p>
            <button
              onClick={() => setRecentVerdicts([])}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              I understand
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function getWeekStartDate(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  const weekStart = new Date(d.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}
