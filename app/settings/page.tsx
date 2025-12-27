'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AppNav from '@/components/Navigation/AppNav'
import StudyTrackSettings from '@/components/StudyTrack/StudyTrackSettings'
import { db, getOrCreateDeviceId } from '@/lib/dexieClient'
import { supabase } from '@/lib/supabaseClient'
import { createPod, joinPod, getPodStatus, updatePodDisplayName, getPodStatusEnhanced, getPodWeeklySummary, sendPodKudos, getPodKudosToday, getPodStudyingNow, getPodDailyChallenge, getPodMessagesRecent, sendPodMessage, startPodStudySession, endPodStudySession, leavePod } from '@/lib/supabaseStudyTrack'
import type { PodStatusEnhanced, PodWeeklySummary, PodKudos, PodStudySession, PodDailyChallenge, PodMessage } from '@/lib/types'
import { getHapticsEnabled, setHapticsEnabled, isHapticsSupported, triggerHaptic } from '@/lib/haptics'
import { 
  getSmartNotificationsEnabled, 
  setSmartNotificationsEnabled as setSmartNotificationsEnabledLib,
  requestNotificationPermission as requestSmartNotificationPermission
} from '@/lib/smartNotifications'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function SettingsPage() {
  const { user } = useAuth()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [smartNotificationsEnabled, setSmartNotificationsEnabledState] = useState(false)
  const [hapticsEnabled, setHapticsEnabledState] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [breakReminderInterval, setBreakReminderInterval] = useState(25)
  const [dailyGoal, setDailyGoal] = useState(120)
  const [showStreaks, setShowStreaks] = useState(true)
  const [deviceId, setDeviceId] = useState('')
  const [saving, setSaving] = useState(false)
  const [hapticsSupported, setHapticsSupported] = useState(false)

  const [podLoading, setPodLoading] = useState(false)
  const [podError, setPodError] = useState<string | null>(null)
  const [podId, setPodId] = useState<string | null>(null)
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
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    loadSettings()
    loadPod()
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    setHapticsSupported(isHapticsSupported())
  }, [])

  // Realtime subscription for pod updates
  useEffect(() => {
    if (!podId || !supabase) return

    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current)
    }

    // Create realtime channel for pod updates
    const channel = supabase
      .channel(`pod-${podId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pod_study_sessions', filter: `pod_id=eq.${podId}` },
        (payload) => {
          console.log('📚 Study session change:', payload)
          refreshPodStatus()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pod_messages', filter: `pod_id=eq.${podId}` },
        (payload) => {
          console.log('💬 Pod message:', payload)
          refreshPodStatus()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pod_kudos', filter: `pod_id=eq.${podId}` },
        (payload) => {
          console.log('👏 Kudos update:', payload)
          refreshPodStatus()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_check_ins' },
        (payload) => {
          console.log('✅ Check-in update:', payload)
          // Refresh to update member status
          refreshPodStatus()
        }
      )
      .subscribe((status) => {
        console.log('🔴 Realtime subscription status:', status)
      })

    realtimeChannelRef.current = channel

    // Also poll every 30 seconds as a backup
    const pollInterval = setInterval(() => {
      refreshPodStatus()
    }, 30000)

    return () => {
      if (realtimeChannelRef.current && supabase) {
        supabase.removeChannel(realtimeChannelRef.current)
      }
      clearInterval(pollInterval)
    }
  }, [podId])

  const loadPod = async () => {
    if (!supabase) return

    try {
      setPodLoading(true)
      setPodError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      let userId = sessionData?.session?.user?.id
      if (!userId) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) throw error
        const { data: sessionData2 } = await supabase.auth.getSession()
        userId = sessionData2?.session?.user?.id
      }
      if (!userId) return
      setPodUserId(userId)

      // Use last selected pod if available
      const stored = typeof window !== 'undefined' ? localStorage.getItem('ff_active_pod_id') : null
      if (stored) {
        setPodId(stored)
        await refreshPodStatus(stored)
        setPodLoading(false)
        return
      }

      // Otherwise find any pod membership
      const { data: memberships, error: memErr } = await supabase
        .from('pod_members')
        .select('pod_id')
        .eq('user_id', userId)
        .limit(1)

      if (memErr) throw memErr
      const firstPod = memberships && memberships.length > 0 ? memberships[0].pod_id : null
      if (firstPod) {
        setPodId(firstPod)
        localStorage.setItem('ff_active_pod_id', firstPod)
        await refreshPodStatus(firstPod)
      }
    } catch (e: any) {
      setPodError(typeof e?.message === 'string' ? e.message : 'Failed to load pod')
    } finally {
      setPodLoading(false)
    }
  }

  const refreshPodStatus = async (explicitPodId?: string) => {
    const id = explicitPodId || podId
    if (!id) return
    const today = new Date().toISOString().split('T')[0]
    
    // Try enhanced status first, fallback to basic if not available
    try {
      const status = await getPodStatusEnhanced(id, today)
      if (status && status.length > 0) {
        setPodStatus(status)
      } else {
        throw new Error('No enhanced data')
      }
    } catch {
      // Fallback to basic status if enhanced fails (404 or 400)
      try {
        const basicStatus = await getPodStatus(id, today)
        setPodStatus(basicStatus.map(s => ({
          ...s,
          currentStreak: 0,
          bestStreak: 0,
          totalKudos: 0,
          checkInTime: null,
          isFirstToday: false,
          weekMinutes: 0,
          kudosFromMe: false
        })))
      } catch {
        // Even basic failed, keep existing status
      }
    }
    
    // Try to load weekly summary (ignore if not available)
    try {
      const summary = await getPodWeeklySummary(id)
      if (summary && summary.totalMinutes !== undefined) {
        setPodWeeklySummary(summary)
      } else {
        setPodWeeklySummary(null)
      }
    } catch {
      setPodWeeklySummary(null)
    }
    
    // Try to load today's kudos (ignore if not available)
    try {
      const kudos = await getPodKudosToday(id)
      setPodKudosToday(kudos || [])
    } catch {
      setPodKudosToday([])
    }

    // Try to load who's studying now (new feature, may not exist)
    try {
      const studying = await getPodStudyingNow(id)
      setStudyingNow(studying || [])
    } catch {
      setStudyingNow([])
    }

    // Try to load daily challenge (new feature, may not exist)
    try {
      const challenge = await getPodDailyChallenge(id)
      setDailyChallenge(challenge)
    } catch {
      setDailyChallenge(null)
    }

    // Try to load recent messages (new feature, may not exist)
    try {
      const messages = await getPodMessagesRecent(id)
      setRecentMessages(messages || [])
    } catch {
      setRecentMessages([])
    }

    // Update last refresh time
    setLastUpdate(new Date())
  }

  const handleSendKudos = async (toUserId: string) => {
    if (!podId) return
    setSendingKudos(toUserId)
    try {
      const success = await sendPodKudos(podId, toUserId, kudosEmoji)
      if (success) {
        await refreshPodStatus()
      } else {
        setPodError('Kudos feature not available yet. Please apply the latest database migration.')
      }
    } catch (e: any) {
      // Gracefully handle if function doesn't exist
      setPodError('Kudos feature not available yet')
    } finally {
      setSendingKudos(null)
    }
  }

  const QUICK_MESSAGES = {
    motivation: [
      { key: 'you_got_this', emoji: '💪', text: 'You got this!' },
      { key: 'keep_going', emoji: '🚀', text: 'Keep going!' },
      { key: 'proud_of_you', emoji: '🌟', text: 'Proud of you!' },
      { key: 'almost_there', emoji: '🏁', text: 'Almost there!' },
    ],
    nudge: [
      { key: 'miss_you', emoji: '👋', text: 'We miss you!' },
      { key: 'join_us', emoji: '📚', text: 'Join us!' },
      { key: 'check_in', emoji: '✅', text: 'Check in?' },
    ],
    celebration: [
      { key: 'amazing', emoji: '🎉', text: 'Amazing!' },
      { key: 'crushed_it', emoji: '💥', text: 'Crushed it!' },
      { key: 'on_fire', emoji: '🔥', text: 'On fire!' },
    ]
  }

  const handleSendMessage = async (toUserId: string | null, messageType: string, messageKey: string) => {
    if (!podId) return
    try {
      const success = await sendPodMessage(podId, toUserId, messageType, messageKey)
      if (success) {
        await refreshPodStatus()
      }
    } catch {
      // Silently fail if not available - feature requires migration
    }
  }

  const handleToggleStudying = async () => {
    if (!podId) return
    try {
      if (isStudying) {
        await endPodStudySession(podId)
        setIsStudying(false)
      } else {
        await startPodStudySession(podId, studySubject || undefined)
        setIsStudying(true)
        // Trigger celebration for starting
        triggerCelebration('📚 Let\'s study!')
      }
      await refreshPodStatus()
    } catch {
      // Silently fail if not available
    }
  }

  const triggerCelebration = (message: string) => {
    setCelebrationMessage(message)
    setShowConfetti(true)
    setTimeout(() => {
      setShowConfetti(false)
      setCelebrationMessage(null)
    }, 3000)
  }

  // Check if current user is studying
  useEffect(() => {
    if (podUserId && studyingNow.length > 0) {
      const mySession = studyingNow.find(s => s.userId === podUserId)
      setIsStudying(!!mySession)
    }
  }, [studyingNow, podUserId])

  // Celebrate when daily challenge is completed
  useEffect(() => {
    if (dailyChallenge?.isCompleted) {
      triggerCelebration('🎉 Challenge Completed!')
    }
  }, [dailyChallenge?.isCompleted])

  const loadSettings = async () => {
    const devId = await getOrCreateDeviceId()
    setDeviceId(devId)

    const config = await db.config.toArray()
    if (config.length > 0) {
      const settings = config[0]
      setNotificationsEnabled(settings.notificationsEnabled ?? false)
      setBreakReminderInterval(settings.breakReminderInterval ?? 25)
      setDailyGoal(settings.dailyGoalMinutes ?? 120)
      setShowStreaks(settings.showStreaks ?? true)
      setSmartNotificationsEnabledState(settings.settings?.smartNotificationsEnabled ?? false)
      setHapticsEnabledState(settings.settings?.hapticsEnabled ?? true)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications')
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true)
      await saveSettings({ notificationsEnabled: true })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)

      if (permission === 'granted') {
        setNotificationsEnabled(true)
        await saveSettings({ notificationsEnabled: true })
        
        // Show test notification
        new Notification('FocusFlow Notifications Enabled! 🎉', {
          body: 'You\'ll now receive break reminders to help maintain healthy focus habits.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  const saveSettings = async (updates: any = {}) => {
    setSaving(true)
    try {
      const configs = await db.config.toArray()
      if (configs.length > 0) {
        await db.config.update(deviceId, {
          notificationsEnabled: updates.notificationsEnabled ?? notificationsEnabled,
          breakReminderInterval: updates.breakReminderInterval ?? breakReminderInterval,
          dailyGoalMinutes: updates.dailyGoal ?? dailyGoal,
          showStreaks: updates.showStreaks ?? showStreaks
        })
      } else {
        await db.config.add({
          deviceId,
          sessionCount: 0,
          labeledSessionCount: 0,
          notificationsEnabled: updates.notificationsEnabled ?? notificationsEnabled,
          breakReminderInterval: updates.breakReminderInterval ?? breakReminderInterval,
          dailyGoalMinutes: updates.dailyGoal ?? dailyGoal,
          showStreaks: updates.showStreaks ?? showStreaks,
          hasPromptedForAccount: false,
          settings: {
            notificationsEnabled: updates.notificationsEnabled ?? notificationsEnabled,
            smartNotificationsEnabled: false,
            hapticsEnabled: true,
            reduceMotion: false,
            highContrast: false,
            dyslexiaFont: false
          }
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    await saveSettings()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Confetti & Celebration Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
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
          {/* Celebration message */}
          {celebrationMessage && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl px-8 py-6 text-center animate-bounce-in">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{celebrationMessage}</div>
            </div>
          )}
        </div>
      )}
      
      <AppNav user={user} showAuthButton={true} />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize your FocusStudy experience
          </p>
        </div>

        {/* StudyTrack Settings */}
        <section className="mb-6">
          <StudyTrackSettings />
        </section>

        {/* Notifications Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Notifications
          </h2>

          <div className="space-y-4">
            {/* Enable Notifications */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Break Reminders
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get gentle reminders to take breaks and maintain healthy focus habits
                </p>
              </div>
              <button
                onClick={() => {
                  if (notificationsEnabled) {
                    setNotificationsEnabled(false)
                    saveSettings({ notificationsEnabled: false })
                  } else {
                    requestNotificationPermission()
                  }
                }}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reminder Interval */}
            {notificationsEnabled && (
              <div>
                <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                  Reminder Interval
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="15"
                    max="90"
                    step="5"
                    value={breakReminderInterval}
                    onChange={(e) => setBreakReminderInterval(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[60px]">
                    {breakReminderInterval} min
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  You'll receive a reminder every {breakReminderInterval} minutes during active sessions
                </p>
              </div>
            )}
          </div>
        </section>
        
        {/* Smart Notifications Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Smart Suggestions
          </h2>

          <div className="space-y-4">
            {/* Smart Notifications */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Smart Study Reminders
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get personalized suggestions based on your study patterns
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!smartNotificationsEnabled) {
                    const granted = await requestSmartNotificationPermission()
                    if (granted) {
                      await setSmartNotificationsEnabledLib(true)
                      setSmartNotificationsEnabledState(true)
                    }
                  } else {
                    await setSmartNotificationsEnabledLib(false)
                    setSmartNotificationsEnabledState(false)
                  }
                }}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  smartNotificationsEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    smartNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {smartNotificationsEnabled && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  ✨ FocusStudy learns when you typically study and suggests sessions at those times
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Micro Accountability Pod */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🤝 Micro Accountability Pod</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Stay accountable with 3–5 study partners. No chat, no distractions.
          </p>
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

          {podLoading ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
              Loading pod…
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
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, podWeeklySummary.goalProgressPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                      <div className="text-xl font-bold text-orange-500">🔥 {podWeeklySummary.podStreak}</div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">Pod Streak</div>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                      <div className="text-sm font-bold text-primary-600 dark:text-primary-400 truncate">
                        {podWeeklySummary.topPerformerName || '—'}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">🏆 Top This Week</div>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                      <div className="text-xl font-bold text-green-500">{podWeeklySummary.avgDailyCheckIns.toFixed(1)}</div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">Avg Check-ins</div>
                    </div>
                  </div>
                </div>
              )}

              {podInviteCode && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
                  <div className="text-xs text-primary-600 dark:text-primary-400 font-semibold mb-1">
                    📤 Invite your study partners:
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-2xl font-bold tracking-widest text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-center">
                      {podInviteCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(podInviteCode)
                        alert('Invite code copied!')
                      }}
                      className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-600 text-white font-semibold transition-colors"
                      title="Copy invite code"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pod members today:</span>
                  {/* Live indicator */}
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Kudos emoji selector */}
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {['👏', '🔥', '💪', '⭐', '🎯', '🚀'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setKudosEmoji(emoji)}
                        className={`text-lg px-1 rounded transition-all ${
                          kudosEmoji === emoji 
                            ? 'bg-white dark:bg-gray-600 shadow-sm scale-110' 
                            : 'hover:bg-white/50 dark:hover:bg-gray-600/50'
                        }`}
                        title={`Send ${emoji} kudos`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => refreshPodStatus()}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    🔄
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {podStatus.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    No members yet. Share your invite code!
                  </div>
                ) : (
                  podStatus
                    .sort((a, b) => b.weekMinutes - a.weekMinutes) // Sort by weekly minutes
                    .map((row, idx) => {
                      const status = row.verdictStatus
                      const statusEmoji = status === 'on-track' ? '🟢' : status === 'at-risk' ? '🟡' : status === 'falling-behind' ? '🔴' : '⚪'
                      const isMe = row.userId === podUserId
                      const kudosForMember = podKudosToday.filter(k => k.toUserId === row.userId)
                      const isCurrentlyStudying = studyingNow.some(s => s.userId === row.userId)
                      
                      // Streak milestone badges
                      const streakBadge = row.currentStreak >= 30 ? '🔥👑' : 
                                          row.currentStreak >= 14 ? '🔥🔥' : 
                                          row.currentStreak >= 7 ? '🔥' : 
                                          row.currentStreak >= 3 ? '✨' : null

                      return (
                        <div
                          key={row.userId}
                          className={`rounded-xl p-3 transition-all ${
                            isMe 
                              ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                              : 'bg-gray-50 dark:bg-gray-700/40'
                          } ${row.isFirstToday ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''} ${
                            isCurrentlyStudying ? 'ring-2 ring-green-400 dark:ring-green-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                  {isMe ? `👤 ${row.displayName} (You)` : `👤 ${row.displayName}`}
                                </span>
                                {isCurrentlyStudying && (
                                  <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                    </span>
                                    Studying
                                  </span>
                                )}
                                {row.isFirstToday && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
                                    🌅 First!
                                  </span>
                                )}
                                {idx === 0 && podStatus.length > 1 && (
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full">
                                    🏆 Leader
                                  </span>
                                )}
                                {streakBadge && (
                                  <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full" title={`${row.currentStreak} day streak!`}>
                                    {streakBadge}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <span title="Current streak">🔥 {row.currentStreak} day{row.currentStreak !== 1 ? 's' : ''}</span>
                                <span title="Best streak">⭐ Best: {row.bestStreak}</span>
                                <span title="This week">{Math.floor(row.weekMinutes / 60)}h {row.weekMinutes % 60}m this week</span>
                              </div>
                              {/* Kudos received today */}
                              {kudosForMember.length > 0 && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  {kudosForMember.map((k, i) => (
                                    <span 
                                      key={i} 
                                      className="text-sm" 
                                      title={`${k.emoji} from ${k.fromDisplayName}`}
                                    >
                                      {k.emoji}
                                    </span>
                                  ))}
                                  <span className="text-[10px] text-gray-400 ml-1">today</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                  {row.checkedIn ? '✅' : '⏳'}
                                </div>
                                <div className="text-lg" title={status || 'No verdict'}>
                                  {statusEmoji}
                                </div>
                              </div>
                              {/* Send kudos button */}
                              {!isMe && (
                                <button
                                  onClick={() => handleSendKudos(row.userId)}
                                  disabled={sendingKudos === row.userId || row.kudosFromMe}
                                  className={`text-xs px-2 py-1 rounded-lg transition-all ${
                                    row.kudosFromMe
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                                      : sendingKudos === row.userId
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-wait'
                                        : 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 hover:bg-accent-200 dark:hover:bg-accent-900/50'
                                  }`}
                                >
                                  {row.kudosFromMe ? '✓ Sent' : sendingKudos === row.userId ? '...' : `${kudosEmoji} Send`}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>

              {/* Total kudos received indicator */}
              {podStatus.some(m => m.totalKudos > 0) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                  <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                    🏅 Kudos Leaderboard
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {podStatus
                      .filter(m => m.totalKudos > 0)
                      .sort((a, b) => b.totalKudos - a.totalKudos)
                      .slice(0, 3)
                      .map((m, i) => (
                        <div key={m.userId} className="text-center">
                          <div className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[60px]">{m.displayName}</div>
                          <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{m.totalKudos}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Motivational Messages */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                <button
                  onClick={() => setShowMessagePanel(!showMessagePanel)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-purple-700 dark:text-purple-400"
                >
                  <span>💬 Quick Messages</span>
                  <span className="text-lg">{showMessagePanel ? '−' : '+'}</span>
                </button>
                
                {showMessagePanel && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Motivate someone:</div>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_MESSAGES.motivation.map(msg => (
                          <button
                            key={msg.key}
                            onClick={() => {
                              const notMe = podStatus.find(m => m.userId !== podUserId)
                              if (notMe) handleSendMessage(notMe.userId, 'motivation', msg.key)
                            }}
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                          >
                            {msg.emoji} {msg.text}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Celebrate:</div>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_MESSAGES.celebration.map(msg => (
                          <button
                            key={msg.key}
                            onClick={() => handleSendMessage(null, 'celebration', msg.key)}
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                          >
                            {msg.emoji} {msg.text}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nudge inactive member:</div>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_MESSAGES.nudge.map(msg => (
                          <button
                            key={msg.key}
                            onClick={() => {
                              const notCheckedIn = podStatus.find(m => !m.checkedIn && m.userId !== podUserId)
                              if (notCheckedIn) handleSendMessage(notCheckedIn.userId, 'nudge', msg.key)
                            }}
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                          >
                            {msg.emoji} {msg.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity Feed */}
              {recentMessages.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">📢 Recent Activity</div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {recentMessages.slice(0, 5).map((msg, idx) => {
                      const msgData = Object.values(QUICK_MESSAGES).flat().find(m => m.key === msg.messageKey)
                      return (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{msg.fromDisplayName}</span>
                          {msg.toDisplayName ? (
                            <> → <span className="font-medium">{msg.toDisplayName}</span>: </>
                          ) : (
                            <>: </>
                          )}
                          {msgData ? `${msgData.emoji} ${msgData.text}` : msg.messageKey}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to leave this pod? This cannot be undone.')) {
                    return
                  }
                  try {
                    setPodLoading(true)
                    if (podId) {
                      await leavePod(podId)
                    }
                    setPodId(null)
                    setPodInviteCode(null)
                    setPodStatus([])
                    setPodDisplayName('')
                    setPodWeeklySummary(null)
                    setPodKudosToday([])
                    setStudyingNow([])
                    setDailyChallenge(null)
                    setRecentMessages([])
                    localStorage.removeItem('ff_active_pod_id')
                  } catch (e) {
                    console.error('Failed to leave pod:', e)
                    setPodError('Failed to leave pod')
                  } finally {
                    setPodLoading(false)
                  }
                }}
                className="w-full py-2 rounded-lg border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                🚪 Leave Pod
              </button>
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
                    localStorage.setItem('ff_active_pod_id', result.pod.id)
                    await refreshPodStatus(result.pod.id)
                  } catch (e: any) {
                    setPodError(typeof e?.message === 'string' ? e.message : 'Failed to create pod')
                  } finally {
                    setPodLoading(false)
                  }
                }}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-600 text-white font-semibold"
              >
                Create a pod
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Join with invite code</label>
                <div className="flex gap-2">
                  <input
                    value={podJoinCode}
                    onChange={(e) => setPodJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A1B2C3D4"
                    maxLength={8}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono tracking-wider uppercase"
                  />
                  <button
                    onClick={async () => {
                      try {
                        if (!podDisplayName.trim()) {
                          setPodError('Please enter a display name first')
                          return
                        }
                        if (!podJoinCode.trim()) {
                          setPodError('Please enter an invite code')
                          return
                        }
                        setPodLoading(true)
                        setPodError(null)
                        const id = await joinPod(podJoinCode.trim(), podDisplayName.trim())
                        if (!id) throw new Error('Could not join pod')
                        setPodId(id)
                        localStorage.setItem('ff_active_pod_id', id)
                        await refreshPodStatus(id)
                      } catch (e: any) {
                        setPodError(typeof e?.message === 'string' ? e.message : 'Failed to join pod')
                      } finally {
                        setPodLoading(false)
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
        
        {/* Haptic Feedback Section */}
        {hapticsSupported && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Haptic Feedback
            </h2>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Vibration Feedback
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gentle vibrations for timer events and interactions
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !hapticsEnabled
                    await setHapticsEnabled(newValue)
                    setHapticsEnabledState(newValue)
                    
                    // Test haptic on enable
                    if (newValue) {
                      await triggerHaptic('success', true)
                    }
                  }}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    hapticsEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {hapticsEnabled && (
                <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    📱 Haptics provide tactile confirmation for actions like starting, pausing, and completing sessions
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Goals Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Daily Goals
          </h2>

          <div className="space-y-4">
            {/* Daily Goal */}
            <div>
              <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                Daily Focus Goal
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="30"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[80px]">
                  {dailyGoal} min
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {Math.floor(dailyGoal / 60)} hours {dailyGoal % 60} minutes per day
              </p>
            </div>

            {/* Show Streaks */}
            <div className="flex items-start justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Show Streaks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Display your daily streak and goal progress
                </p>
              </div>
              <button
                onClick={() => setShowStreaks(!showStreaks)}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showStreaks ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showStreaks ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Device Info */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Device
          </h2>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Device ID</p>
            <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
              {deviceId}
            </p>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-touch py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors shadow-lg"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </main>
  )
}
