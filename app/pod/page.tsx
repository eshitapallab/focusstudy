'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AppNav from '@/components/Navigation/AppNav'
import MemberAvatar from '@/components/MemberAvatar'
import { supabase } from '@/lib/supabaseClient'
import { createPod, joinPod, getPodStatus, updatePodDisplayName, getPodStatusEnhanced, getPodWeeklySummary, sendPodKudos, getPodKudosToday, getPodStudyingNow, getPodDailyChallenge, getPodMessagesRecent, sendPodMessage, startPodStudySession, endPodStudySession, leavePod, getPodInfo, approvePodMember, rejectPodMember, removePodMember } from '@/lib/supabaseStudyTrack'
import type { PodStatusEnhanced, PodWeeklySummary, PodKudos, PodStudySession, PodDailyChallenge, PodMessage, PodInfo } from '@/lib/types'
import { triggerHaptic } from '@/lib/haptics'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function PodPage() {
  const { user } = useAuth()

  const [podLoading, setPodLoading] = useState(false)
  const [podError, setPodError] = useState<string | null>(null)
  const [podId, setPodId] = useState<string | null>(null)
  const [podInfo, setPodInfo] = useState<PodInfo | null>(null)
  const [podInviteCode, setPodInviteCode] = useState<string | null>(null)
  const [podJoinCode, setPodJoinCode] = useState('')
  const [podDisplayName, setPodDisplayName] = useState('')
  const [podStatus, setPodStatus] = useState<PodStatusEnhanced[]>([])
  const [podUserId, setPodUserId] = useState<string | null>(null)
  const [podWeeklySummary, setPodWeeklySummary] = useState<PodWeeklySummary | null>(null)
  const [podKudosToday, setPodKudosToday] = useState<PodKudos[]>([])
  const [kudosEmoji, setKudosEmoji] = useState('👏')
  const [sendingKudos, setSendingKudos] = useState<string | null>(null)
  const [studyingNow, setStudyingNow] = useState<PodStudySession[]>([])
  const [dailyChallenge, setDailyChallenge] = useState<PodDailyChallenge | null>(null)
  const [recentMessages, setRecentMessages] = useState<PodMessage[]>([])
  const [showMessagePanel, setShowMessagePanel] = useState(false)
  const [isStudying, setIsStudying] = useState(false)
  const [studySubject, setStudySubject] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [codeCopied, setCodeCopied] = useState(false)
  const [processingMember, setProcessingMember] = useState<string | null>(null)
  const [myMemberStatus, setMyMemberStatus] = useState<'approved' | 'pending' | 'rejected' | null>(null)
  const [membershipNotification, setMembershipNotification] = useState<string | null>(null)
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  const lastRefreshRef = useRef<number>(0)
  const previousChallengeCompletedRef = useRef<boolean>(false)
  const refreshPodStatusRef = useRef<(id: string, force?: boolean) => Promise<void>>()

  // Predefined quick messages
  const quickMessages = {
    motivation: [
      { key: 'you_got_this', text: "💪 You've got this!" },
      { key: 'keep_going', text: "🚀 Keep going!" },
      { key: 'almost_there', text: "⭐ Almost there!" },
      { key: 'proud_of_you', text: "🏆 Proud of you!" },
    ],
    challenge: [
      { key: 'race_you', text: "🏁 Race you to 30 mins!" },
      { key: 'beat_yesterday', text: "📈 Let's beat yesterday!" },
      { key: 'study_together', text: "📚 Study together?" },
    ],
    celebration: [
      { key: 'amazing_work', text: "🎉 Amazing work!" },
      { key: 'goal_crusher', text: "🔥 Goal crusher!" },
      { key: 'on_fire', text: "✨ You're on fire!" },
    ]
  }

  // Trigger celebration effect
  const triggerCelebration = useCallback((message: string) => {
    setShowConfetti(true)
    setCelebrationMessage(message)
    triggerHaptic('success')
    setTimeout(() => {
      setShowConfetti(false)
      setCelebrationMessage(null)
    }, 3000)
  }, [])

  // Refresh pod status (with throttle to prevent flickering)
  const refreshPodStatus = useCallback(async (id: string, force: boolean = false) => {
    if (!id) return
    
    // Throttle: only refresh if 2 seconds have passed since last refresh
    const now = Date.now()
    if (!force && now - lastRefreshRef.current < 2000) {
      return
    }
    lastRefreshRef.current = now
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const [status, summary, kudos, studying, challenge, messages, info] = await Promise.all([
        getPodStatusEnhanced(id, today),
        getPodWeeklySummary(id),
        getPodKudosToday(id),
        getPodStudyingNow(id),
        getPodDailyChallenge(id),
        getPodMessagesRecent(id),
        getPodInfo(id)
      ])
      setPodStatus(status)
      setPodWeeklySummary(summary)
      setPodKudosToday(kudos)
      setStudyingNow(studying)
      setDailyChallenge(challenge)
      setRecentMessages(messages)
      setPodInfo(info)
      setLastUpdate(new Date())
      
      // Check if current user is studying
      const currentUserId = (await supabase?.auth.getUser())?.data?.user?.id
      if (currentUserId) {
        const amIStudying = studying.some(s => s.userId === currentUserId)
        setIsStudying(amIStudying)
      }
      
      // Check if challenge was just completed (use ref to avoid dependency)
      if (challenge?.isCompleted && !previousChallengeCompletedRef.current) {
        triggerCelebration('🎯 Challenge Completed!')
      }
      previousChallengeCompletedRef.current = challenge?.isCompleted || false
    } catch (e) {
      console.error('Error refreshing pod status:', e)
    }
  }, [triggerCelebration])

  // Keep ref updated
  refreshPodStatusRef.current = refreshPodStatus

  // Set up realtime subscription (only depends on podId)
  useEffect(() => {
    if (!podId || !supabase) return

    // Handler that uses ref to avoid subscription recreation
    const handleRealtimeChange = () => {
      refreshPodStatusRef.current?.(podId, true)
    }

    // Handler for membership changes (joins, leaves, approvals)
    const handleMembershipChange = (payload: any) => {
      console.log('🔔 Membership change received:', payload)
      
      // Check if this change is for our pod
      if (payload.new?.pod_id !== podId && payload.old?.pod_id !== podId) {
        console.log('🔔 Ignoring - different pod')
        return
      }
      
      // Show notification based on event type
      if (payload.eventType === 'INSERT') {
        setMembershipNotification('🆕 New member requested to join!')
        triggerHaptic('notification')
      } else if (payload.eventType === 'DELETE') {
        setMembershipNotification('👋 A member left the pod')
        triggerHaptic('notification')
      } else if (payload.eventType === 'UPDATE' && payload.new?.status === 'approved') {
        // Check if it's our own approval
        if (payload.new?.user_id === podUserId) {
          setMembershipNotification('🎉 You have been approved!')
          setMyMemberStatus('approved')
          triggerHaptic('success')
        } else {
          setMembershipNotification('✅ New member approved!')
          triggerHaptic('notification')
        }
      }
      
      // Clear notification after 5 seconds
      setTimeout(() => setMembershipNotification(null), 5000)
      
      // Refresh pod status
      refreshPodStatusRef.current?.(podId, true)
    }

    // Subscribe to realtime changes
    // Note: Using separate channel for pod_members without filter for better compatibility
    const channel = supabase
      .channel(`pod-${podId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pod_study_sessions', filter: `pod_id=eq.${podId}` }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pod_messages', filter: `pod_id=eq.${podId}` }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pod_kudos', filter: `pod_id=eq.${podId}` }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pod_members' }, handleMembershipChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_check_ins' }, handleRealtimeChange)
      .subscribe((status, err) => {
        console.log('🔴 Realtime subscription status:', status)
        if (err) console.error('🔴 Realtime subscription error:', err)
      })

    realtimeChannelRef.current = channel

    // Also set up a backup polling interval (60 seconds - less frequent)
    const pollInterval = setInterval(() => {
      refreshPodStatusRef.current?.(podId)
    }, 60000)

    return () => {
      if (realtimeChannelRef.current && supabase) {
        supabase.removeChannel(realtimeChannelRef.current)
      }
      clearInterval(pollInterval)
    }
  }, [podId, podUserId]) // Added podUserId for membership check

  // Load pod on mount
  useEffect(() => {
    const loadPod = async () => {
      if (!supabase) return
      try {
        setPodLoading(true)
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return
        setPodUserId(authUser.id)

        // Check localStorage for active pod
        const savedPodId = localStorage.getItem('ff_active_pod_id')
        
        // Query pod_members to find user's pod (including status)
        const { data: membership, error } = await supabase
          .from('pod_members')
          .select('pod_id, display_name, status, pods(id, invite_code)')
          .eq('user_id', authUser.id)
          .limit(1)
          .maybeSingle()

        if (membership && !error) {
          const memberPodId = membership.pod_id
          const memberStatus = membership.status as 'approved' | 'pending' | 'rejected'
          
          // If rejected, clear and don't show pod
          if (memberStatus === 'rejected') {
            localStorage.removeItem('ff_active_pod_id')
            setMyMemberStatus(null)
            return
          }
          
          setPodId(memberPodId)
          setPodDisplayName(membership.display_name || 'Anonymous')
          setPodInviteCode((membership.pods as any)?.invite_code || null)
          setMyMemberStatus(memberStatus)
          localStorage.setItem('ff_active_pod_id', memberPodId)
          
          // Only load full pod status if approved
          if (memberStatus === 'approved') {
            await refreshPodStatus(memberPodId)
          }
        } else if (savedPodId) {
          // Clear stale saved pod
          localStorage.removeItem('ff_active_pod_id')
          setMyMemberStatus(null)
        }
      } catch (e) {
        console.error('Error loading pod:', e)
      } finally {
        setPodLoading(false)
      }
    }
    loadPod()
  }, [refreshPodStatus])

  // Handle start/stop studying
  const handleToggleStudying = async () => {
    if (!podId) return
    try {
      if (isStudying) {
        await endPodStudySession(podId)
        setIsStudying(false)
      } else {
        await startPodStudySession(podId, studySubject || undefined)
        setIsStudying(true)
        triggerCelebration('📚 Study session started!')
      }
      await refreshPodStatus(podId)
    } catch (e) {
      console.error('Error toggling study session:', e)
    }
  }

  // Handle sending kudos
  const handleSendKudos = async (toUserId: string) => {
    if (!podId || sendingKudos) return
    try {
      setSendingKudos(toUserId)
      await sendPodKudos(podId, toUserId, kudosEmoji)
      triggerHaptic('notification')
      await refreshPodStatus(podId)
    } catch (e) {
      console.error('Error sending kudos:', e)
    } finally {
      setSendingKudos(null)
    }
  }

  // Handle sending message
  const handleSendMessage = async (messageType: string, messageKey: string, toUserId?: string) => {
    if (!podId) return
    try {
      await sendPodMessage(podId, toUserId || null, messageType, messageKey)
      triggerHaptic('notification')
      await refreshPodStatus(podId)
    } catch (e) {
      console.error('Error sending message:', e)
    }
  }

  // Get message text from key
  const getMessageText = (type: string, key: string) => {
    const messages = quickMessages[type as keyof typeof quickMessages] || []
    return messages.find(m => m.key === key)?.text || key
  }

  // Copy invite code
  const copyInviteCode = () => {
    if (podInviteCode) {
      navigator.clipboard.writeText(podInviteCode)
      setCodeCopied(true)
      triggerHaptic('notification')
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  if (!user) {
    return (
      <>
        <AppNav showAuthButton={true} />
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="text-6xl mb-4">🤝</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Study Pods
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Stay accountable with 3–5 study partners. Sign in to create or join a pod!
            </p>
            <a
              href="/auth"
              className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all"
            >
              Sign In to Get Started
            </a>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Confetti celebration overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <span className="text-2xl">
                  {['🎉', '🎊', '✨', '⭐', '🔥', '💪', '🏆'][Math.floor(Math.random() * 7)]}
                </span>
              </div>
            ))}
          </div>
          {celebrationMessage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl px-8 py-6 text-center animate-bounce-in">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{celebrationMessage}</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <AppNav user={user} showAuthButton={true} />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="text-3xl">🤝</span> Study Pod
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Stay accountable with 3–5 study partners. No chat, no distractions.
          </p>
        </div>

        {/* Pod Content */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
            <strong>How it works:</strong> Create or join a pod → Share invite code with friends → 
            Track each other's progress, streaks, and send kudos! 🔥
          </div>

          {!supabase && (
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              Supabase is not configured, so pods are unavailable.
            </div>
          )}

          {podError && (
            <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
              {podError}
            </div>
          )}

          {/* Membership notification toast */}
          {membershipNotification && (
            <div className="fixed top-4 right-4 z-50 bg-primary-500 text-white px-4 py-3 rounded-lg shadow-lg animate-bounce">
              {membershipNotification}
            </div>
          )}

          {podLoading ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 justify-center py-8">
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              Loading pod…
            </div>
          ) : podId && myMemberStatus === 'pending' ? (
            /* Pending Approval Screen */
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                  Waiting for Approval
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                  Your request to join this pod is pending. The pod admin will review your request soon.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  You'll be notified when you're approved!
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your display name:</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{podDisplayName}</div>
              </div>

              {/* Cancel/Leave button for pending members */}
              <button
                onClick={async () => {
                  if (!confirm('Cancel your join request?')) return
                  try {
                    setPodLoading(true)
                    if (podId) await leavePod(podId)
                    setPodId(null)
                    setMyMemberStatus(null)
                    localStorage.removeItem('ff_active_pod_id')
                    window.location.reload()
                  } catch (e) {
                    console.error('Failed to cancel request:', e)
                    setPodError('Failed to cancel request')
                    setPodLoading(false)
                  }
                }}
                className="w-full py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel Request
              </button>
            </div>
          ) : podId ? (
            <div className="space-y-4">
              {/* Daily Challenge Card */}
              {dailyChallenge && (
                <div className={`rounded-xl p-4 border-2 transition-all ${
                  dailyChallenge.isCompleted 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                    : 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {dailyChallenge.challengeTitle}
                    </div>
                    {dailyChallenge.isCompleted && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        ✓ COMPLETED!
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {dailyChallenge.challengeDescription}
                  </div>
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        dailyChallenge.isCompleted 
                          ? 'bg-green-500' 
                          : 'bg-gradient-to-r from-orange-400 to-yellow-400'
                      }`}
                      style={{ width: `${Math.min(100, (dailyChallenge.currentProgress / dailyChallenge.challengeTarget) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                    {dailyChallenge.currentProgress} / {dailyChallenge.challengeTarget}
                  </div>
                </div>
              )}

              {/* Start Studying Button */}
              <div className={`rounded-xl p-4 border-2 transition-all ${
                isStudying 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-green-400 dark:border-green-600' 
                  : 'bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {!isStudying ? (
                      <input
                        type="text"
                        value={studySubject}
                        onChange={(e) => setStudySubject(e.target.value)}
                        placeholder="What are you studying? (optional)"
                        className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          You're studying! Your pod can see you're active 🔥
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleToggleStudying}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                      isStudying 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white shadow-lg'
                    }`}
                  >
                    {isStudying ? '⏹️ Stop' : '📚 Start Studying'}
                  </button>
                </div>
              </div>

              {/* Who's Studying Now */}
              {studyingNow.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    STUDYING NOW
                  </div>
                  <div className="space-y-1">
                    {studyingNow.map(session => (
                      <div key={session.userId} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          📖 {session.displayName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {session.subject && <span className="mr-2">{session.subject}</span>}
                          {session.minutesElapsed}m
                          {session.targetMinutes && ` / ${session.targetMinutes}m`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Summary Card */}
              {podWeeklySummary && (
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                  <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">📊 This Week's Progress</div>
                  
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Pod goal</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {Math.floor(podWeeklySummary.totalMinutes / 60)}h / {Math.floor(podWeeklySummary.weeklyGoal / 60)}h ({podWeeklySummary.goalProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                        style={{ width: `${podWeeklySummary.goalProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-orange-500">🔥 {podWeeklySummary.podStreak}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">Pod Streak</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{podWeeklySummary.topPerformerName}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">🏆 Top This Week</div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-500">{podWeeklySummary.avgDailyCheckIns}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">Avg Check-ins</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pod Info - Creation Date (for owner) */}
              {podInfo && podInfo.isOwner && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">👑</span>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">You are the Pod Admin</span>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Created {new Date(podInfo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}

              {/* Pending Members (Admin Only) */}
              {podInfo && podInfo.isOwner && podInfo.pendingCount > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-3 flex items-center gap-2">
                    <span>⏳</span>
                    Pending Join Requests ({podInfo.pendingCount})
                  </div>
                  <div className="space-y-2">
                    {podStatus.filter(m => m.memberStatus === 'pending').map((member) => (
                      <div 
                        key={member.userId}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-700"
                      >
                        <div className="flex items-center gap-3">
                          <MemberAvatar name={member.displayName} odorId={member.userId} size="md" />
                          <span className="font-medium text-gray-900 dark:text-white">{member.displayName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              setProcessingMember(member.userId)
                              try {
                                await approvePodMember(podId!, member.userId)
                                refreshPodStatusRef.current?.(podId!, true)
                              } catch (e) {
                                console.error('Failed to approve member:', e)
                                setPodError('Failed to approve member')
                              } finally {
                                setProcessingMember(null)
                              }
                            }}
                            disabled={processingMember === member.userId}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50"
                          >
                            {processingMember === member.userId ? '...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={async () => {
                              setProcessingMember(member.userId)
                              try {
                                await rejectPodMember(podId!, member.userId)
                                refreshPodStatusRef.current?.(podId!, true)
                              } catch (e) {
                                console.error('Failed to reject member:', e)
                                setPodError('Failed to reject member')
                              } finally {
                                setProcessingMember(null)
                              }
                            }}
                            disabled={processingMember === member.userId}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50"
                          >
                            {processingMember === member.userId ? '...' : '✗ Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pod Members Today */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Pod members today:
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                      LIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {['👏', '🔥', '💪', '⭐', '🎯', '🚀'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => setKudosEmoji(emoji)}
                        className={`text-lg p-1 rounded transition-all ${kudosEmoji === emoji ? 'bg-primary-100 dark:bg-primary-900/50 scale-110' : 'opacity-60 hover:opacity-100'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {podStatus.filter(m => m.memberStatus !== 'pending').map((member) => {
                    const isMe = member.userId === podUserId
                    const isStudyingNow = studyingNow.some(s => s.userId === member.userId)
                    const receivedKudos = podKudosToday.filter(k => k.toUserId === member.userId)
                    const isOwner = member.isOwner
                    
                    // Streak badge
                    let streakBadge = ''
                    if (member.currentStreak >= 30) streakBadge = '👑'
                    else if (member.currentStreak >= 14) streakBadge = '🔥🔥'
                    else if (member.currentStreak >= 7) streakBadge = '🔥'
                    else if (member.currentStreak >= 3) streakBadge = '✨'
                    
                    return (
                      <div 
                        key={member.userId}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          isMe 
                            ? 'bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 border-2 border-primary-200 dark:border-primary-700' 
                            : isStudyingNow
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <MemberAvatar 
                            name={member.displayName} 
                            odorId={member.userId} 
                            size="md" 
                            isOnline={isStudyingNow}
                            isOwner={isOwner}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                {member.displayName}
                                {isMe && <span className="text-xs text-primary-500 ml-1">(You)</span>}
                              </span>
                              {member.isFirstToday && (
                                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded">
                                  🏅 First!
                                </span>
                              )}
                              {isStudyingNow && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                  </span>
                                  Studying
                                </span>
                              )}
                              {member.userId === (podStatus.filter(m => m.memberStatus !== 'pending').find(m => m.weekMinutes === Math.max(...podStatus.filter(x => x.memberStatus !== 'pending').map(x => x.weekMinutes)))?.userId) && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                  🏆 Leader
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                              <span>🔥 {member.currentStreak} days {streakBadge}</span>
                              <span>⭐ Best: {member.bestStreak}</span>
                              <span>{Math.floor(member.weekMinutes / 60)}h {member.weekMinutes % 60}m this week</span>
                              {member.joinedAt && (
                                <span className="text-gray-400">• Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Check-in status */}
                          {member.checkedIn ? (
                            <span className="text-green-500 text-lg">✅</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-lg">⬜</span>
                          )}
                          {/* Verdict status dot */}
                          <span className={`w-3 h-3 rounded-full ${
                            member.verdictStatus === 'on-track' ? 'bg-green-500' :
                            member.verdictStatus === 'at-risk' ? 'bg-yellow-500' :
                            member.verdictStatus === 'falling-behind' ? 'bg-red-500' :
                            'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          {/* Send kudos button */}
                          {!isMe && (
                            <button
                              onClick={() => handleSendKudos(member.userId)}
                              disabled={sendingKudos === member.userId || member.kudosFromMe}
                              className={`text-sm px-2 py-1 rounded-lg transition-all ${
                                member.kudosFromMe 
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/50'
                              }`}
                            >
                              {sendingKudos === member.userId ? '...' : member.kudosFromMe ? '✓ Sent' : `${kudosEmoji} Send`}
                            </button>
                          )}
                          {/* Remove member button (admin only, not self) */}
                          {podInfo?.isOwner && !isMe && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Remove ${member.displayName} from the pod?`)) return
                                setProcessingMember(member.userId)
                                try {
                                  await removePodMember(podId!, member.userId)
                                  refreshPodStatusRef.current?.(podId!, true)
                                } catch (e) {
                                  console.error('Failed to remove member:', e)
                                  setPodError('Failed to remove member')
                                } finally {
                                  setProcessingMember(null)
                                }
                              }}
                              disabled={processingMember === member.userId}
                              className="text-sm px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-all disabled:opacity-50"
                              title="Remove from pod"
                            >
                              {processingMember === member.userId ? '...' : '✗'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Messages */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => setShowMessagePanel(!showMessagePanel)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <span>💬 Quick Messages</span>
                  <span className="text-lg">{showMessagePanel ? '−' : '+'}</span>
                </button>
                
                {showMessagePanel && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(quickMessages).map(([type, messages]) => (
                      <div key={type}>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 capitalize">
                          {type}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {messages.map(msg => (
                            <button
                              key={msg.key}
                              onClick={() => handleSendMessage(type, msg.key)}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300 rounded-full transition-all"
                            >
                              {msg.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Recent messages */}
                    {recentMessages.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Recent</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {recentMessages.slice(0, 5).map((msg, i) => (
                            <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{msg.fromDisplayName}</span>
                              {msg.toDisplayName && <span> → {msg.toDisplayName}</span>}
                              : {getMessageText(msg.messageType, msg.messageKey)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Invite Code */}
              {podInviteCode && (
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                  <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">📤 Invite Friends</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg text-lg font-mono font-bold text-center tracking-wider">
                      {podInviteCode}
                    </code>
                    <button
                      onClick={copyInviteCode}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold text-sm transition-all"
                    >
                      {codeCopied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Leave Pod Button */}
              <div className="space-y-2">
                {podInfo?.isOwner && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ⚠️ <strong>Warning:</strong> As the pod admin, leaving will permanently destroy this pod and remove all members.
                    </p>
                  </div>
                )}
                <button
                  onClick={async () => {
                    const confirmMsg = podInfo?.isOwner 
                      ? 'Are you sure you want to leave? As the admin, this will PERMANENTLY DESTROY the pod and remove all members. This cannot be undone!'
                      : 'Are you sure you want to leave this pod? This cannot be undone.'
                    if (!confirm(confirmMsg)) {
                      return
                    }
                    try {
                      setPodLoading(true)
                      setPodError(null)
                      if (podId) {
                        const success = await leavePod(podId)
                        if (!success) {
                          throw new Error('Failed to leave pod - server returned false')
                        }
                      }
                      // Clear all state
                      setPodId(null)
                      setPodInviteCode(null)
                      setPodStatus([])
                      setPodDisplayName('')
                      setPodWeeklySummary(null)
                      setPodKudosToday([])
                      setStudyingNow([])
                      setDailyChallenge(null)
                      setRecentMessages([])
                      setPodInfo(null)
                      localStorage.removeItem('ff_active_pod_id')
                      // Force page reload to ensure clean state
                      window.location.reload()
                    } catch (e) {
                      console.error('Failed to leave pod:', e)
                      setPodError('Failed to leave pod. Please try again.')
                      setPodLoading(false)
                    }
                  }}
                  className={`w-full py-2 rounded-lg border font-semibold transition-all ${
                    podInfo?.isOwner 
                      ? 'border-red-500 bg-red-500 hover:bg-red-600 text-white' 
                      : 'border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  {podInfo?.isOwner ? '⚠️ Destroy Pod & Leave' : '🚪 Leave Pod'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Display name input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Your display name (visible to pod members)
                </label>
                <input
                  value={podDisplayName}
                  onChange={(e) => setPodDisplayName(e.target.value)}
                  placeholder="Enter your name (max 20 chars)"
                  maxLength={20}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={async () => {
                  try {
                    if (!podDisplayName.trim()) {
                      setPodError('Please enter a display name')
                      return
                    }
                    setPodLoading(true)
                    setPodError(null)
                    const result = await createPod(podDisplayName.trim())
                    if (!result) throw new Error('Could not create pod')
                    setPodId(result.pod.id)
                    setPodInviteCode(result.pod.inviteCode)
                    setMyMemberStatus('approved') // Creator is auto-approved
                    localStorage.setItem('ff_active_pod_id', result.pod.id)
                    await refreshPodStatus(result.pod.id)
                    triggerCelebration('🎉 Pod created!')
                  } catch (e: any) {
                    setPodError(typeof e?.message === 'string' ? e.message : 'Failed to create pod')
                  } finally {
                    setPodLoading(false)
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold hover:from-primary-600 hover:to-accent-600 shadow-lg transition-all transform hover:scale-[1.02]"
              >
                ✨ Create New Pod
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or join existing</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  value={podJoinCode}
                  onChange={(e) => setPodJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code"
                  maxLength={8}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white uppercase tracking-wider font-mono"
                />
                <button
                  onClick={async () => {
                    try {
                      if (!podJoinCode.trim()) {
                        setPodError('Please enter an invite code')
                        return
                      }
                      if (!podDisplayName.trim()) {
                        setPodError('Please enter a display name first')
                        return
                      }
                      setPodLoading(true)
                      setPodError(null)
                      const joinedPodId = await joinPod(podJoinCode.trim(), podDisplayName.trim())
                      if (!joinedPodId) throw new Error('Could not join pod')
                      setPodId(joinedPodId)
                      setMyMemberStatus('pending') // New members are pending by default
                      localStorage.setItem('ff_active_pod_id', joinedPodId)
                      setPodJoinCode('')
                      // Don't refresh full status - pending members see waiting screen
                    } catch (e: any) {
                      setPodError(typeof e?.message === 'string' ? e.message : 'Failed to join pod')
                    } finally {
                      setPodLoading(false)
                    }
                  }}
                  className="px-6 py-2 rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
