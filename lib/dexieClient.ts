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
    reduceMotion: boolean
    highContrast: boolean
    dyslexiaFont: boolean
  }
}

export class FocusFlowDB extends Dexie {
  sessions!: Table<LocalSession>
  sessionMetadata!: Table<SessionMetadata>
  plannedSessions!: Table<PlannedSession>
  config!: Table<DeviceConfig>

  constructor() {
    super('FocusFlowDB')
    
    this.version(1).stores({
      sessions: 'id, deviceId, userId, startTs, endTs, syncStatus, running',
      sessionMetadata: 'id, sessionId, syncStatus, subject',
      plannedSessions: 'id, deviceId, userId, plannedDate, syncStatus',
      config: 'deviceId'
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
