// Notification service for break reminders and progress updates

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{ action: string; title: string; icon?: string }>
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null

  async init() {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Notifications not supported in this browser')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error('Failed to initialize notification service:', error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  async showNotification(options: NotificationOptions) {
    if (!this.registration) {
      await this.init()
    }

    if (!this.registration || Notification.permission !== 'granted') {
      return
    }

    try {
      const notificationOptions: any = {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        actions: options.actions,
        vibrate: [200, 100, 200],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      }
      
      await this.registration.showNotification(options.title, notificationOptions)
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  async showBreakReminder(minutesElapsed: number) {
    await this.showNotification({
      title: '🌟 Time for a Break!',
      body: `You've been focusing for ${minutesElapsed} minutes. Take a 5-minute break to recharge.`,
      tag: 'break-reminder',
      requireInteraction: false,
      actions: [
        { action: 'dismiss', title: 'Dismiss' },
        { action: 'extend', title: 'Keep Going' }
      ]
    })
  }

  async showSessionComplete(durationMinutes: number) {
    await this.showNotification({
      title: '✨ Session Complete!',
      body: `Great work! You focused for ${durationMinutes} minutes. Take a moment to reflect on what you learned.`,
      tag: 'session-complete',
      requireInteraction: true
    })
  }

  async showDailyGoalAchieved(goalMinutes: number) {
    await this.showNotification({
      title: '🎉 Daily Goal Achieved!',
      body: `Congratulations! You've reached your ${goalMinutes} minute goal for today!`,
      tag: 'goal-achieved',
      requireInteraction: false
    })
  }

  async showStreakMilestone(days: number) {
    await this.showNotification({
      title: `🔥 ${days} Day Streak!`,
      body: `You're on fire! Keep up the amazing consistency.`,
      tag: 'streak-milestone',
      requireInteraction: false
    })
  }

  async scheduleBreakReminder(delayMs: number, minutesElapsed: number) {
    if (!this.registration) {
      await this.init()
    }

    // For now, use setTimeout since scheduled notifications aren't widely supported
    // In production, you'd want to use the Notifications API with service workers
    setTimeout(() => {
      this.showBreakReminder(minutesElapsed)
    }, delayMs)
  }
}

export const notificationService = new NotificationService()
