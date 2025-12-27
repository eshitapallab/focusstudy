'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AppNav from '@/components/Navigation/AppNav'
import StudyTrackSettings from '@/components/StudyTrack/StudyTrackSettings'
import { db, getOrCreateDeviceId } from '@/lib/dexieClient'
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

  useEffect(() => {
    loadSettings()
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    setHapticsSupported(isHapticsSupported())
  }, [])

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
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 pb-44 md:pb-20">
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

        {/* Micro Accountability Pod - Link to dedicated page */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🤝 Micro Accountability Pod</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Stay accountable with 3–5 study partners. Track progress, streaks, and send kudos!
          </p>
          <a 
            href="/pod"
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
          >
            Open Pod Dashboard →
          </a>
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
