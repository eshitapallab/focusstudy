'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { db, getOrCreateDeviceId } from '@/lib/dexieClient'

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [breakReminderInterval, setBreakReminderInterval] = useState(25)
  const [dailyGoal, setDailyGoal] = useState(120)
  const [showStreaks, setShowStreaks] = useState(true)
  const [deviceId, setDeviceId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
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
          notificationsEnabled: updates.notificationsEnabled ?? notificationsEnabled,
          breakReminderInterval: updates.breakReminderInterval ?? breakReminderInterval,
          dailyGoalMinutes: updates.dailyGoal ?? dailyGoal,
          showStreaks: updates.showStreaks ?? showStreaks,
          hasPromptedForAccount: false
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
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Back to Home"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
        </header>

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
