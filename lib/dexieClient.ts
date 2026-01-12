import Dexie, { Table } from 'dexie'

// Types matching the DB schema
export interface LocalSession {
  id: string // UUID
  deviceId: string
  userId?: string | null // Populated after sign-in
  startTs: number // timestamp in ms
  endTs?: number | null
  pausedMs: number // total paused time in ms
  mode: string // 'pomodoro', 'flow', etc.
  pauses: Array<{ start: number; end?: number }> // pause intervals
  distractions?: number[] // timestamps of distraction logs
  running: boolean
  createdAt: number
  syncStatus: 'pending' | 'synced' | 'conflict'
  serverVersion?: number // version from server for conflict resolution
}

export interface SessionMetadata {
  id: string
  sessionId: string
  subject?: string | null
  planned: boolean
  focusRating?: number | null // 1-5
  note?: string | null
  labeledAt?: number | null
  syncStatus: 'pending' | 'synced' | 'conflict'
}

export interface PlannedSession {
  id: string
  deviceId: string
  userId?: string | null
  subject: string
  plannedDate: string // ISO date string
  goal?: string | null
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled'
  completedSessionId?: string | null // Links to actual session if completed
  rescheduledTo?: string | null // New date if rescheduled (ISO date string)
  createdAt: number
  syncStatus: 'pending' | 'synced' | 'conflict'
}

export interface DeviceConfig {
  deviceId: string
  lastSyncedAt?: number | null
  sessionCount: number
  labeledSessionCount: number
  hasPromptedForAccount: boolean
  notificationsEnabled?: boolean
  breakReminderInterval?: number
  dailyGoalMinutes?: number
  showStreaks?: boolean
  currentStreak?: number
  longestStreak?: number
  lastSessionDate?: string
  settings: {
    notificationsEnabled: boolean
    smartNotificationsEnabled: boolean
    hapticsEnabled: boolean
    reduceMotion: boolean
    highContrast: boolean
    dyslexiaFont: boolean
  }
  studyPatterns?: {
    commonStudyTimes: number[] // Array of hours (0-23) when user typically studies
    lastNotificationShown?: number
  }
}

export class FocusFlowDB extends Dexie {
  sessions!: Table<LocalSession>
  sessionMetadata!: Table<SessionMetadata>
  plannedSessions!: Table<PlannedSession>
  config!: Table<DeviceConfig>

  constructor() {
    super('FocusFlowDB')
    
    // Version 2: Fixed endTs indexing for goal/streak calculations
    this.version(2).stores({
      sessions: 'id, deviceId, userId, startTs, endTs, syncStatus, running',
      sessionMetadata: 'id, sessionId, syncStatus, subject',
      plannedSessions: 'id, deviceId, userId, plannedDate, syncStatus',
      config: 'deviceId'
    })
    
    // Version 3: Add status tracking to planned sessions
    this.version(3).stores({
      sessions: 'id, deviceId, userId, startTs, endTs, syncStatus, running',
      sessionMetadata: 'id, sessionId, syncStatus, subject',
      plannedSessions: 'id, deviceId, userId, plannedDate, syncStatus, status',
      config: 'deviceId'
    }).upgrade(tx => {
      // Add default status to existing planned sessions
      return tx.table('plannedSessions').toCollection().modify(session => {
        if (!session.status) {
          session.status = 'pending'
        }
      })
    })
    
    // Version 4: Add distraction tracking and enhanced settings
    this.version(4).stores({
      sessions: 'id, deviceId, userId, startTs, endTs, syncStatus, running',
      sessionMetadata: 'id, sessionId, syncStatus, subject',
      plannedSessions: 'id, deviceId, userId, plannedDate, syncStatus, status',
      config: 'deviceId'
    }).upgrade(tx => {
      // Add distraction arrays to existing sessions
      tx.table('sessions').toCollection().modify(session => {
        if (!session.distractions) {
          session.distractions = []
        }
      })
      
      // Add new settings to config
      return tx.table('config').toCollection().modify(config => {
        if (config.settings) {
          config.settings.smartNotificationsEnabled = false
          config.settings.hapticsEnabled = true // Enable by default for better UX
        }
      })
    })
  }
}

export const db = new FocusFlowDB()

// Helper to generate device ID on first use
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await db.config.toArray()
  
  if (existing.length > 0) {
    return existing[0].deviceId
  }
  
  // Generate new device ID
  const deviceId = crypto.randomUUID()
  
  await db.config.add({
    deviceId,
    sessionCount: 0,
    labeledSessionCount: 0,
    hasPromptedForAccount: false,
    settings: {
      notificationsEnabled: false,
      smartNotificationsEnabled: false,
      hapticsEnabled: true,
      reduceMotion: false,
      highContrast: false,
      dyslexiaFont: false
    }
  })
  
  return deviceId
}

// Helper to check if account prompt should be shown
export async function shouldPromptForAccount(): Promise<boolean> {
  const config = await db.config.toArray()
  
  if (config.length === 0) return false
  
  const { sessionCount, labeledSessionCount, hasPromptedForAccount } = config[0]
  
  // Prompt after 5 labeled sessions OR 10 total sessions
  return !hasPromptedForAccount && (labeledSessionCount >= 5 || sessionCount >= 10)
}

// Helper to update config after creating session
export async function incrementSessionCount(labeled: boolean = false): Promise<void> {
  const configs = await db.config.toArray()
  
  if (configs.length === 0) return
  
  const config = configs[0]
  
  await db.config.update(config.deviceId, {
    sessionCount: config.sessionCount + 1,
    labeledSessionCount: labeled ? config.labeledSessionCount + 1 : config.labeledSessionCount
  })
}

/**
 * Force stop all running sessions - call from browser console: FocusFlowDB.forceStopAllSessions()
 * This is useful when the timer gets stuck and won't stop normally
 */
export async function forceStopAllSessions(): Promise<number> {
  const now = Date.now()
  let stoppedCount = 0
  
  try {
    const sessions = await db.sessions.toArray()
    const runningSessions = sessions.filter(s => !s.endTs || s.running)
    
    for (const session of runningSessions) {
      console.log(`[FocusFlowDB] Force stopping session ${session.id} (started: ${new Date(session.startTs).toISOString()})`)
      
      // Close any open pause
      let pausedMs = session.pausedMs
      if (session.pauses && session.pauses.length > 0) {
        const lastPause = session.pauses[session.pauses.length - 1]
        if (!lastPause.end) {
          lastPause.end = now
          pausedMs += (lastPause.end - lastPause.start)
        }
      }
      
      await db.sessions.update(session.id, {
        endTs: now,
        running: false,
        pauses: session.pauses || [],
        pausedMs
      })
      
      stoppedCount++
    }
    
    console.log(`[FocusFlowDB] Force stopped ${stoppedCount} sessions`)
    return stoppedCount
  } catch (error) {
    console.error('[FocusFlowDB] Error force stopping sessions:', error)
    return 0
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).FocusFlowDB = {
    db,
    forceStopAllSessions
  }
}
