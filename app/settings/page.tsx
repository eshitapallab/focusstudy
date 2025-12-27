'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AppNav from '@/components/Navigation/AppNav'
import StudyTrackSettings from '@/components/StudyTrack/StudyTrackSettings'
import { db, getOrCreateDeviceId } from '@/lib/dexieClient'
import { supabase } from '@/lib/supabaseClient'
import { createPod, joinPod, getPodStatus, updatePodDisplayName } from '@/lib/supabaseStudyTrack'
import { getHapticsEnabled, setHapticsEnabled, isHapticsSupported, triggerHaptic } from '@/lib/haptics'
import { 
  getSmartNotificationsEnabled, 
  setSmartNotificationsEnabled as setSmartNotificationsEnabledLib,
  requestNotificationPermission as requestSmartNotificationPermission
} from '@/lib/smartNotifications'

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
  const [podStatus, setPodStatus] = useState<{ userId: string; displayName: string; checkedIn: boolean; verdictStatus: string | null }[]>([])
  const [podUserId, setPodUserId] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
    loadPod()
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    setHapticsSupported(isHapticsSupported())
  }, [])

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
        const today = new Date().toISOString().split('T')[0]
        const status = await getPodStatus(stored, today)
        setPodStatus(status)
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
        const today = new Date().toISOString().split('T')[0]
        const status = await getPodStatus(firstPod, today)
        setPodStatus(status)
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
    const status = await getPodStatus(id, today)
    setPodStatus(status)
  }

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
            See who checked in today and their study status (🟢 on-track, 🟡 at-risk, 🔴 falling-behind).
            <br />
            <em>Just knowing others can see if you studied is a powerful motivator!</em>
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
            <div className="text-sm text-gray-700 dark:text-gray-300">Loading pod…</div>
          ) : podId ? (
            <div className="space-y-4">
              {podInviteCode && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
                  <div className="text-xs text-primary-600 dark:text-primary-400 font-semibold mb-1">
                    📤 Share this invite code with your study partners:
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Pod members today:</span>
                </div>
                <button
                  onClick={() => refreshPodStatus()}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className="space-y-2">
                {podStatus.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    No members yet. Share your invite code!
                  </div>
                ) : (
                  podStatus.map((row, idx) => {
                    const status = row.verdictStatus
                    const color =
                      status === 'on-track'
                        ? 'bg-green-500'
                        : status === 'at-risk'
                          ? 'bg-yellow-500'
                          : status === 'falling-behind'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                    const statusEmoji = status === 'on-track' ? '🟢' : status === 'at-risk' ? '🟡' : status === 'falling-behind' ? '🔴' : '⚪'

                    return (
                      <div
                        key={row.userId}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3"
                      >
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                          {row.userId === podUserId ? `👤 ${row.displayName} (You)` : `👤 ${row.displayName}`}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {row.checkedIn ? '✅ Checked in' : '⏳ Not yet'}
                          </div>
                          <div className="text-lg" title={status || 'No verdict'}>
                            {statusEmoji}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <button
                onClick={() => {
                  setPodId(null)
                  setPodInviteCode(null)
                  setPodStatus([])
                  setPodDisplayName('')
                  localStorage.removeItem('ff_active_pod_id')
                }}
                className="w-full py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Leave pod view
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
