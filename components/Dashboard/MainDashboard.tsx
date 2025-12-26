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
  updateMicroAction,
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
  hasRecentGamingDetection,
  getTopMarkLeaks,
  getRisingMistakeSignals
} from '@/lib/supabaseStudyTrack'
import { calculateVerdict } from '@/lib/verdictEngine'
import { generateMicroAction } from '@/lib/microActionGenerator'
import { calculateRealityScore, generateTrajectoryMessage } from '@/lib/realityCheck'
import { detectGamingPatterns, getHonestyPrompt, shouldPromptHonesty } from '@/lib/gamingDetection'
import { getSubjectMarks, getSubjectPercentage, getExamSubjects } from '@/lib/examSyllabi'
import { User, DailyCheckIn, Verdict, MicroAction, WeeklyReality, EmotionalFeeling, ExamTomorrowResponse, MonthlySnapshot, MarkLeakEstimate, MistakeTrendSignal } from '@/lib/types'
import OnboardingFlow from '@/components/Onboarding/OnboardingFlow'
import DailyCheckInCard from '@/components/CheckIn/DailyCheckInCard'
import VerdictCard from '@/components/Verdict/VerdictCard'
import MicroActionCard from '@/components/Actions/MicroActionCard'
import WeeklyRealityCheck from '@/components/Reality/WeeklyRealityCheck'
import PeerComparison from '@/components/Peer/PeerComparison'
import ShareSnapshot from '@/components/Share/ShareSnapshot'
import SafetyPrompt from '@/components/Safety/SafetyPrompt'
import LogTestMistakesModal from '@/components/MIS/LogTestMistakesModal'
import MarkLeaksCard from '@/components/MIS/MarkLeaksCard'
import MistakeTrendsCard from '@/components/MIS/MistakeTrendsCard'
import { getMISPrescription } from '@/lib/misPrescriptions'

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
  const [showMISLog, setShowMISLog] = useState(false)
  const [markLeaks, setMarkLeaks] = useState<MarkLeakEstimate[]>([])
  const [risingSignals, setRisingSignals] = useState<MistakeTrendSignal[]>([])

  const today = new Date().toISOString().split('T')[0]

  const refreshMarkLeaks = async (userId: string) => {
    try {
      const leaks = await getTopMarkLeaks(userId, 5)
      setMarkLeaks(leaks)
    } catch {
      // keep silent; dashboard should still work without MIS
    }
  }

  const refreshRisingSignals = async (userId: string) => {
    try {
      const signals = await getRisingMistakeSignals(userId, 3)
      setRisingSignals(signals)
    } catch {
      // silent
    }
  }

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

        if (mounted) {
          refreshMarkLeaks(supabaseUser.id)
          refreshRisingSignals(supabaseUser.id)
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

          // Load micro action and validate it matches current exam
          let action = await getTodayMicroAction(supabaseUser.id, today)
          
          // If no action exists and we have a verdict, generate one
          if (!action && todayVerdict) {
            console.log('Generating micro-action - none exists for today')
            const recentCheckInsForAction = await getRecentCheckIns(supabaseUser.id, 7)
            const newAction = generateMicroAction(recentCheckInsForAction, todayVerdict, userData.exam)
            
            action = await createMicroAction(supabaseUser.id, {
              verdictId: todayVerdict.id,
              date: today,
              task: newAction.task,
              durationMinutes: newAction.durationMinutes,
              relatedSubjects: newAction.relatedSubjects,
              completed: false
            })
          }
          
          // Check if action's subjects are valid for current exam
          if (action && todayVerdict) {
            const validSubjects = getExamSubjects(userData.exam)
            const actionSubjects = action.relatedSubjects || []
            
            // If action has subjects that don't match current exam, regenerate
            const hasInvalidSubjects = actionSubjects.some(subj => 
              subj !== 'Other' && !validSubjects.includes(subj)
            )
            
            if (hasInvalidSubjects) {
              console.log('Regenerating micro-action - subjects invalid for current exam')
              const recentCheckInsForAction = await getRecentCheckIns(supabaseUser.id, 7)
              const newAction = generateMicroAction(recentCheckInsForAction, todayVerdict, userData.exam)
              
              // Update the existing action in database (avoid duplicates)
              action = (await updateMicroAction(action.id, {
                verdictId: todayVerdict.id,
                task: newAction.task,
                durationMinutes: newAction.durationMinutes,
                relatedSubjects: newAction.relatedSubjects,
                completed: action.completed
              })) || action
            }
          }
          
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

      // Generate micro action using real exam data
      const action = await generateMicroAction([checkIn, ...recentCheckIns], newVerdict, user.exam)
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
                onClick={() => setShowMISLog(true)}
                className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                title="Log test mistakes"
              >
                + Log mistakes
              </button>
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
            userExam={user.exam}
          />
        )}

        {/* Weekly Reality Check Modal */}
        {showRealityCheck && (
          <WeeklyRealityCheck 
            onSubmit={handleRealityCheckSubmit}
            onSkip={() => setShowRealityCheck(false)}
          />
        )}

        {/* ============================================================================
             TOP SECTION: TODAY'S DIRECTIVE (Action-first hierarchy)
             ============================================================================ */}
        
        {/* Micro Action - PRIMARY CARD (Biggest, first, most actionable) */}
        {microAction && (
          <div className="bg-white border-2 border-indigo-200 rounded-2xl p-7 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
                🎯
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Next Best Use of 20 Minutes</h2>
                <p className="text-sm text-gray-600 mt-0.5">Based on exam weight, recall stability, and time remaining</p>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <p className="text-base font-semibold text-indigo-900">
                {(() => {
                  const subject = microAction.relatedSubjects && microAction.relatedSubjects.length > 0
                    ? microAction.relatedSubjects[0]
                    : null
                  const exam = (user.exam || '').toLowerCase()
                  const focusPhrase = exam.includes('upsc')
                    ? 'core facts & frameworks'
                    : (exam.includes('ssc') || exam.includes('bank') || exam.includes('cat') || exam.includes('gate') || exam.includes('jee') || exam.includes('neet'))
                    ? 'core formulas & patterns'
                    : 'core concepts & patterns'
                  return subject ? `Revise ${subject} — ${focusPhrase}` : microAction.task
                })()}
              </p>
              <p className="text-sm text-indigo-700 mt-1">{microAction.durationMinutes || 20} min</p>
              <p className="text-xs text-indigo-800 mt-2">
                {(() => {
                  if (!user.examDate) return 'Depth > breadth right now.'
                  const daysRemaining = Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const safeDays = Number.isFinite(daysRemaining) ? Math.max(0, daysRemaining) : 0
                  return `Given ${safeDays} days left, depth > breadth right now.`
                })()}
              </p>
            </div>
            
            <div className="mb-4 text-sm text-gray-700 space-y-1">
              <p className="font-medium text-gray-900">Why this matters:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                {microAction.relatedSubjects && microAction.relatedSubjects.length > 0 && (() => {
                  const subject = microAction.relatedSubjects[0]
                  const marks = getSubjectMarks(user.exam, subject)
                  const percentage = getSubjectPercentage(user.exam, subject)
                  return (
                    <li>
                      {subject} contributes {marks > 0 ? `${marks} marks` : '~15–20 marks'}
                      {percentage > 0 && ` (${percentage}% of total)`}
                    </li>
                  )
                })()}
                {todayCheckIn && !todayCheckIn.couldRevise && (
                  <li>This topic shows weak retention</li>
                )}
                {revisionDebtLevel && revisionDebtLevel !== 'low' ? (
                  <li>{microAction.durationMinutes || 20} minutes here has high return right now</li>
                ) : user.examDate && Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 5 ? (
                  <li>Prevents last-minute revision overload in the final {Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</li>
                ) : (
                  <li>Prevents last-minute revision overload</li>
                )}
              </ul>
            </div>
            
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleCompleteMicroAction}
                disabled={microAction.completed}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {microAction.completed ? '✓ Completed — this directly improves exam readiness' : `Start ${microAction.durationMinutes || 20}-min Revision`}
              </button>
              <button
                onClick={async () => {
                  if (!user || !microAction) return
                  await createMicroAction(user.id, {
                    verdictId: microAction.verdictId,
                    date: (() => {
                      const tomorrow = new Date()
                      tomorrow.setDate(tomorrow.getDate() + 1)
                      return tomorrow.toISOString().split('T')[0]
                    })(),
                    task: microAction.task,
                    durationMinutes: microAction.durationMinutes,
                    relatedSubjects: microAction.relatedSubjects,
                    locked: true,
                    completed: false
                  })
                  alert('Locked for tomorrow')
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Lock for Tomorrow
              </button>
            </div>
            
            <button
              onClick={() => {
                const subject = microAction.relatedSubjects && microAction.relatedSubjects.length > 0 
                  ? microAction.relatedSubjects[0]
                  : null
                const marks = subject ? getSubjectMarks(user.exam, subject) : 0
                const percentage = subject ? getSubjectPercentage(user.exam, subject) : 0
                
                const explanation = [
                  subject && marks > 0
                    ? `• ${subject} has ${marks} marks (${percentage}% of total) - higher strategic value right now`
                    : subject
                    ? `• ${subject} shows higher strategic value based on your recent performance`
                    : '• This topic shows higher strategic value',
                  '• Other subjects show better retention or recent coverage',
                  '• Time left favors quick high-return revisions'
                ].join('\n')
                alert(`Why ${microAction.task}?\n\n${explanation}`)
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline"
            >
              Why not another subject?
            </button>

            <details className="mt-3">
              <summary className="text-xs text-gray-600 cursor-pointer select-none">
                What happens if you do this daily?
              </summary>
              <div className="mt-2 text-xs text-gray-600">
                If you repeat similar high-return sessions daily:
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Coverage stabilizes</li>
                  <li>Revision debt stays low</li>
                  <li>Final week panic reduces</li>
                </ul>
              </div>
            </details>
          </div>
        )}

        {markLeaks.length > 0 && (
          <MarkLeaksCard
            leaks={markLeaks}
            onUseAsFocus={async (leak) => {
              if (!user) return
              const p = getMISPrescription(leak)

              if (microAction) {
                const updated = await updateMicroAction(microAction.id, {
                  task: p.microActionTask,
                  durationMinutes: p.suggestedMinutes,
                  relatedSubjects: [p.relatedSubject]
                })

                if (updated) setMicroAction(updated)
              } else if (verdict) {
                const created = await createMicroAction(user.id, {
                  verdictId: verdict.id,
                  date: today,
                  task: p.microActionTask,
                  durationMinutes: p.suggestedMinutes,
                  relatedSubjects: [p.relatedSubject],
                  completed: false
                })

                if (created) setMicroAction(created)
              }
            }}
            onLockForTomorrow={async (leak) => {
              if (!user || !verdict) return
              const p = getMISPrescription(leak)
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)

              await createMicroAction(user.id, {
                verdictId: verdict.id,
                date: tomorrow.toISOString().split('T')[0],
                task: p.microActionTask,
                durationMinutes: p.suggestedMinutes,
                relatedSubjects: [p.relatedSubject],
                locked: true,
                completed: false
              })

              alert('Locked for tomorrow')
            }}
          />
        )}

        {risingSignals.length > 0 && (
          <MistakeTrendsCard
            signals={risingSignals}
            onUseAsFocus={async (signal) => {
              if (!user) return
              const p = getMISPrescription(signal)

              if (microAction) {
                const updated = await updateMicroAction(microAction.id, {
                  task: p.microActionTask,
                  durationMinutes: p.suggestedMinutes,
                  relatedSubjects: [p.relatedSubject]
                })

                if (updated) setMicroAction(updated)
              } else if (verdict) {
                const created = await createMicroAction(user.id, {
                  verdictId: verdict.id,
                  date: today,
                  task: p.microActionTask,
                  durationMinutes: p.suggestedMinutes,
                  relatedSubjects: [p.relatedSubject],
                  completed: false
                })

                if (created) setMicroAction(created)
              }
            }}
          />
        )}

        {/* Tomorrow Lock follow-up (if exists) */}
        {lockedFollowUpAction && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="font-semibold text-amber-900 mb-2">Yesterday's locked action</div>
            <div className="text-sm text-amber-800 mb-3">{lockedFollowUpAction.task}</div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await recordLockedMicroActionOutcome(lockedFollowUpAction.id, true)
                  setLockedFollowUpAction(null)
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                Done
              </button>
              <button
                onClick={async () => {
                  await recordLockedMicroActionOutcome(lockedFollowUpAction.id, false)
                  setLockedFollowUpAction(null)
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
              >
                Skipped
              </button>
            </div>
          </div>
        )}

        {/* ============================================================================
             MARKS AT RISK (Small but powerful outcome linkage)
             ============================================================================ */}
        
        {(revisionDebtLevel === 'high' || recentExamTomorrowResponse === 'no' || (todayCheckIn && !todayCheckIn.couldRevise)) && microAction && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-lg">🎯</div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">Marks at Risk Right Now</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  {microAction.relatedSubjects && microAction.relatedSubjects.length > 0 
                    ? `${microAction.relatedSubjects[0]} (revision gap)` 
                    : 'Weak retention areas'}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  If left unaddressed, this topic often costs 1–2 questions.
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  This risk increases sharply in the final 3–4 days.
                </p>
                <p className="text-xs text-amber-800 font-medium">
                  {(() => {
                    if (microAction.relatedSubjects && microAction.relatedSubjects.length > 0) {
                      const marks = getSubjectMarks(user.exam, microAction.relatedSubjects[0])
                      if (marks > 0) {
                        const atRisk = Math.floor(marks * 0.3) // Assume 30% at risk
                        return `Fixing it now could protect ~${atRisk}–${atRisk + 5} marks.`
                      }
                    }
                    return 'Fixing it now could protect ~10–15 marks.'
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================
             BIGGEST RISK (Fake busy indicator)
             ============================================================================ */}
        
        {fakeBusyMessage && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧯</div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">Biggest Risk Right Now</h3>
                <p className="text-sm text-orange-800 mb-2">{fakeBusyMessage}</p>
                <p className="text-sm text-orange-700 font-medium">Fix: Reduce hours, focus on recall quality</p>
              </div>
            </div>
          </div>
        )}

        {/* Divider between Action Zone and Context Zone */}
        <div className="border-t border-gray-200 my-1"></div>

        {/* ============================================================================
             SECONDARY: STATUS (Small, calm, informational)
             ============================================================================ */}
        
        {verdict && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`text-sm font-semibold ${
                    verdict.status === 'on-track' ? 'text-green-700' :
                    verdict.status === 'at-risk' ? 'text-amber-700' :
                    'text-orange-700'
                  }`}>
                    {verdict.status === 'falling-behind' ? '⚠ Adjust Course' :
                     verdict.status === 'at-risk' ? '→ At Risk' :
                     '✓ On Track'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{verdict.reasons.join('. ')}</p>
                {verdict.status !== 'on-track' && todayCheckIn && todayCheckIn.couldRevise && (
                  <p className="text-xs text-gray-500 mt-1.5 italic">
                    You're retaining what you study,<br />but the remaining syllabus needs targeted coverage.
                  </p>
                )}
                {verdict.status !== 'on-track' && (!todayCheckIn || !todayCheckIn.couldRevise) && (
                  <p className="text-xs text-gray-500 mt-1.5 italic">
                    Retention is weakening — prioritize revision over new topics.
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">{verdict.studyMinutes} min</div>
                <div className="text-xs text-gray-500">today</div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================
             PREP STATE (Merged signals)
             ============================================================================ */}
        
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Preparation Diagnosis</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium min-w-[80px]">Strength:</span>
              <span className="text-gray-800 font-medium">
                {todayCheckIn && todayCheckIn.couldRevise ? 'Recall stability' :
                 monthlySnapshot && monthlySnapshot.consistencyDays >= 20 ? 'High consistency' :
                 verdict && verdict.streak >= 7 ? `${verdict.streak}-day streak` :
                 'Building momentum'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium min-w-[80px]">Risk:</span>
              <span className="text-gray-800 font-medium">
                {revisionDebtLevel === 'high' ? 'Insufficient coverage' :
                 recentExamTomorrowResponse === 'no' ? 'Exam readiness gap' :
                 todayCheckIn && !todayCheckIn.couldRevise ? 'Retention weakening' :
                 'Routine drift'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium min-w-[80px]">Constraint:</span>
              <span className="text-gray-800 font-medium">
                {user.examDate 
                  ? `${Math.ceil((user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining`
                  : monthlySnapshot
                  ? `${monthlySnapshot.consistencyDays}/30 days used this month`
                  : 'Time management critical'}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================================
             OPTIONAL INTERACTIONS (Collapsed/minimal)
             ============================================================================ */}
        
        {/* Reset prompt */}
        {showResetPrompt && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-700 mb-2">Been away for a bit? No judgment. Start fresh today.</p>
            <button
              onClick={async () => {
                if (!user) return
                await updateStudyUser(user.id, { resetAt: new Date() })
                setUser({ ...user, resetAt: new Date() })
                setShowResetPrompt(false)
              }}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Reset today
            </button>
          </div>
        )}

        {/* Emotional check-in */}
        {showEmotionalCheckIn && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">How did studying feel today?</p>
            <div className="flex gap-2">
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
                  className="flex-1 py-2 px-3 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* If exam were tomorrow */}
        {showExamTomorrow && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">If exam were tomorrow, could you clear the basics?</p>
            <div className="flex gap-2">
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
                  className="flex-1 py-2 px-3 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Honesty Prompt */}
        {honestyPrompt && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <p className="text-sm text-amber-900 font-medium mb-2">{honestyPrompt}</p>
            <button
              onClick={() => setHonestyPrompt(null)}
              className="w-full py-2 px-3 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
            >
              I understand
            </button>
          </div>
        )}

        {showMISLog && (
          <LogTestMistakesModal
            user={user}
            onClose={() => setShowMISLog(false)}
            onLogged={async () => {
              await refreshMarkLeaks(user.id)
              await refreshRisingSignals(user.id)
            }}
          />
        )}

        {/* Peer Comparison - Hidden until meaningful data */}
        {user.peerComparisonEnabled && verdict && monthlySnapshot && monthlySnapshot.consistencyDays >= 7 ? (
          <details className="bg-white border border-gray-200 rounded-xl">
            <summary className="p-4 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Peer comparison
            </summary>
            <div className="px-4 pb-4">
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
            </div>
          </details>
        ) : user.peerComparisonEnabled && monthlySnapshot && monthlySnapshot.consistencyDays < 7 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">
              Peer benchmarks unlock after 7 honest check-ins
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {monthlySnapshot.consistencyDays}/7 completed
            </p>
          </div>
        ) : null}

        {/* People like you insight */}
        {peopleLikeYouInsight && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-700">People like you:</span> {peopleLikeYouInsight}
            </p>
          </div>
        )}

        {/* Share Snapshot - Optional, secondary */}
        {verdict && (
          <details className="bg-gray-50 border border-gray-200 rounded-lg">
            <summary className="p-3 cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
              Optional: Share a snapshot for accountability
            </summary>
            <div className="px-3 pb-3">
              <ShareSnapshot
                status={verdict.status}
                hoursStudied={Math.round(verdict.studyMinutes / 60 * 10) / 10}
                exam={user.exam}
                streak={verdict.streak}
              />
            </div>
          </details>
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
