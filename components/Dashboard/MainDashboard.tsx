'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  getRecentCheckIns,
  getRecentVerdicts,
  updateStudyUser,
  getWeeklyReality,
  createWeeklyReality,
  createGamingDetection,
  hasRecentGamingDetection
} from '@/lib/supabaseStudyTrack'
import { calculateVerdict } from '@/lib/verdictEngine'
import { generateMicroAction } from '@/lib/microActionGenerator'
import { calculateRealityScore, generateTrajectoryMessage } from '@/lib/realityCheck'
import { detectGamingPatterns, getHonestyPrompt, shouldPromptHonesty } from '@/lib/gamingDetection'
import { User, DailyCheckIn, Verdict, MicroAction, WeeklyReality } from '@/lib/types'
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

        if (checkIn) {
          // Load verdict
          const todayVerdict = await getTodayVerdict(supabaseUser.id, today)
          if (mounted) setVerdict(todayVerdict)

          // Load micro action
          const action = await getTodayMicroAction(supabaseUser.id, today)
          if (mounted) setMicroAction(action)
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
          setSetupError({
            title: 'Unable to load StudyTrack',
            message,
            steps: [
              'Verify Supabase env vars are set for this deployment.',
              'Ensure the StudyTrack SQL migration has been run in Supabase (tables + RLS).',
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

  const handleRealityCheckComplete = async (answers: WeeklyReality['answers']) => {
    if (!user) return

    try {
      const score = calculateRealityScore(answers)
      const message = generateTrajectoryMessage(score)
      const weekStart = getWeekStartDate(new Date())

      await createWeeklyReality(user.id, {
        weekStartDate: weekStart,
        answers,
        realityScore: score,
        trajectoryMessage: message
      })

      await updateStudyUser(user.id, {
        lastWeeklyRealityCheck: new Date()
      })

      setShowRealityCheck(false)
    } catch (error) {
      console.error('Error completing reality check:', error)
    }
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
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">StudyTrack</h1>
          <p className="text-sm text-gray-600">Preparing for {user.exam}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
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
            onSubmit={handleRealityCheckComplete}
            onSkip={() => setShowRealityCheck(false)}
          />
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
