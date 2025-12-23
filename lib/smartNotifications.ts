/**
 * Smart Notifications Service
 * Analyzes study patterns and suggests sessions at optimal times
 */

import { db, DeviceConfig } from './dexieClient'

export interface StudyPattern {
  hour: number // 0-23
  frequency: number // how many times studied at this hour
  avgDuration: number // average session duration in minutes
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Check if smart notifications are enabled
 */
export async function getSmartNotificationsEnabled(): Promise<boolean> {
  const config = await db.config.toArray()
  if (config.length === 0) return false
  
  return config[0].settings?.smartNotificationsEnabled ?? false
}

/**
 * Update smart notifications setting
 */
export async function setSmartNotificationsEnabled(enabled: boolean): Promise<void> {
  const config = await db.config.toArray()
  if (config.length === 0) return
  
  await db.config.update(config[0].deviceId, {
    settings: {
      ...config[0].settings,
      smartNotificationsEnabled: enabled
    }
  })
}

/**
 * Analyze study patterns from past sessions
 */
export async function analyzeStudyPatterns(): Promise<StudyPattern[]> {
  const sessions = await db.sessions.toArray()
  
  // Group by hour of day
  const hourlyData: Record<number, { count: number; totalMinutes: number }> = {}
  
  sessions.forEach(session => {
    if (!session.endTs) return
    
    const hour = new Date(session.startTs).getHours()
    const duration = (session.endTs - session.startTs - session.pausedMs) / 60000
    
    if (!hourlyData[hour]) {
      hourlyData[hour] = { count: 0, totalMinutes: 0 }
    }
    
    hourlyData[hour].count++
    hourlyData[hour].totalMinutes += duration
  })
  
  // Convert to array and sort by frequency
  const patterns: StudyPattern[] = Object.entries(hourlyData)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      frequency: data.count,
      avgDuration: Math.round(data.totalMinutes / data.count)
    }))
    .sort((a, b) => b.frequency - a.frequency)
  
  return patterns
}

/**
 * Store common study times in config
 */
export async function updateStudyPatterns(): Promise<void> {
  const patterns = await analyzeStudyPatterns()
  const config = await db.config.toArray()
  
  if (config.length === 0) return
  
  // Take top 3 most common hours
  const commonHours = patterns.slice(0, 3).map(p => p.hour)
  
  await db.config.update(config[0].deviceId, {
    studyPatterns: {
      commonStudyTimes: commonHours,
      lastNotificationShown: config[0].studyPatterns?.lastNotificationShown
    }
  })
}

/**
 * Check if we should show a smart notification now
 */
export async function shouldShowSmartNotification(): Promise<{ show: boolean; message: string }> {
  const enabled = await getSmartNotificationsEnabled()
  
  if (!enabled || Notification.permission !== 'granted') {
    return { show: false, message: '' }
  }
  
  const config = await db.config.toArray()
  if (config.length === 0) return { show: false, message: '' }
  
  const now = Date.now()
  const currentHour = new Date().getHours()
  const patterns = config[0].studyPatterns
  
  if (!patterns?.commonStudyTimes || patterns.commonStudyTimes.length === 0) {
    return { show: false, message: '' }
  }
  
  // Don't show if we showed one in the last 3 hours
  const lastShown = patterns.lastNotificationShown || 0
  const hoursSinceLastNotification = (now - lastShown) / (1000 * 60 * 60)
  
  if (hoursSinceLastNotification < 3) {
    return { show: false, message: '' }
  }
  
  // Check if current hour matches a common study time
  if (patterns.commonStudyTimes.includes(currentHour)) {
    // Check if there's an active session
    const activeSessions = await db.sessions.filter(s => s.running).toArray()
    
    if (activeSessions.length === 0) {
      const timeStr = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
      
      return {
        show: true,
        message: `You usually study around ${timeStr}. Ready for a session? 📚`
      }
    }
  }
  
  return { show: false, message: '' }
}

/**
 * Show a smart notification
 */
export async function showSmartNotification(message: string): Promise<void> {
  if (Notification.permission !== 'granted') return
  
  const notification = new Notification('FocusStudy', {
    body: message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'smart-suggestion',
    requireInteraction: false,
    silent: false
  })
  
  // Open app when clicked
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
  
  // Update last notification time
  const config = await db.config.toArray()
  if (config.length > 0) {
    await db.config.update(config[0].deviceId, {
      studyPatterns: {
        ...config[0].studyPatterns,
        commonStudyTimes: config[0].studyPatterns?.commonStudyTimes || [],
        lastNotificationShown: Date.now()
      }
    })
  }
}

/**
 * Initialize smart notifications check
 * Call this when app loads to set up periodic checks
 */
export function initSmartNotifications(): void {
  // Check every 30 minutes
  setInterval(async () => {
    const { show, message } = await shouldShowSmartNotification()
    if (show) {
      await showSmartNotification(message)
    }
  }, 30 * 60 * 1000)
  
  // Also check immediately
  setTimeout(async () => {
    const { show, message } = await shouldShowSmartNotification()
    if (show) {
      await showSmartNotification(message)
    }
  }, 5000) // Wait 5 seconds after load
}
