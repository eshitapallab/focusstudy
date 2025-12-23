import { db, LocalSession, getOrCreateDeviceId } from './dexieClient'

export interface TimerState {
  sessionId: string | null
  running: boolean
  startTs: number | null
  currentPauseStart: number | null
  totalPausedMs: number
  mode: string
  elapsedMs: number // Computed value
}

export interface PauseInterval {
  start: number
  end?: number
}

/**
 * Core timer class with timestamp-based tracking
 * Resilient to backgrounding and OS pausing
 */
export class Timer {
  private currentSession: LocalSession | null = null
  private intervalId: NodeJS.Timeout | null = null
  private onTickCallback?: (state: TimerState) => void

  /**
   * Start a new session
   */
  async start(mode: string = 'flow', onTick?: (state: TimerState) => void): Promise<string> {
    const deviceId = await getOrCreateDeviceId()
    const now = Date.now()
    
    const sessionId = crypto.randomUUID()
    
    const newSession: LocalSession = {
      id: sessionId,
      deviceId,
      userId: null,
      startTs: now,
      endTs: null,
      pausedMs: 0,
      mode,
      pauses: [],
      running: true,
      createdAt: now,
      syncStatus: 'pending'
    }
    
    await db.sessions.add(newSession)
    this.currentSession = newSession
    this.onTickCallback = onTick
    
    // Start UI update interval (every second)
    this.startInterval()
    
    return sessionId
  }

  /**
   * Pause the current session
   */
  async pause(): Promise<void> {
    if (!this.currentSession || !this.currentSession.running) {
      throw new Error('No active session to pause')
    }
    
    const now = Date.now()
    
    // Add pause start timestamp
    this.currentSession.pauses.push({ start: now })
    
    await db.sessions.update(this.currentSession.id, {
      pauses: this.currentSession.pauses,
      running: false
    })
    
    this.currentSession.running = false
    this.stopInterval()
  }

  /**
   * Resume the current session
   */
  async resume(): Promise<void> {
    if (!this.currentSession || this.currentSession.running) {
      throw new Error('No paused session to resume')
    }
    
    const now = Date.now()
    
    // Complete the last pause interval
    const lastPause = this.currentSession.pauses[this.currentSession.pauses.length - 1]
    if (lastPause && !lastPause.end) {
      lastPause.end = now
      this.currentSession.pausedMs += (now - lastPause.start)
    }
    
    await db.sessions.update(this.currentSession.id, {
      pauses: this.currentSession.pauses,
      pausedMs: this.currentSession.pausedMs,
      running: true
    })
    
    this.currentSession.running = true
    this.startInterval()
  }

  /**
   * Stop the current session
   */
  async stop(): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active session to stop')
    }
    
    const now = Date.now()
    
    // If currently paused, complete that pause
    if (!this.currentSession.running) {
      const lastPause = this.currentSession.pauses[this.currentSession.pauses.length - 1]
      if (lastPause && !lastPause.end) {
        lastPause.end = now
        this.currentSession.pausedMs += (now - lastPause.start)
      }
    }
    
    await db.sessions.update(this.currentSession.id, {
      endTs: now,
      pauses: this.currentSession.pauses,
      pausedMs: this.currentSession.pausedMs,
      running: false
    })
    
    const sessionId = this.currentSession.id
    this.currentSession = null
    this.stopInterval()
    
    return sessionId
  }
  
  /**
   * Log a distraction during the session
   */
  async logDistraction(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to log distraction')
    }
    
    const now = Date.now()
    const distractions = this.currentSession.distractions || []
    distractions.push(now)
    
    await db.sessions.update(this.currentSession.id, {
      distractions
    })
    
    this.currentSession.distractions = distractions
  }
  
  /**
   * Get distraction count for current session
   */
  getDistractionCount(): number {
    if (!this.currentSession) return 0
    return this.currentSession.distractions?.length || 0
  }

  /**
   * Get current timer state
   */
  getState(): TimerState {
    if (!this.currentSession) {
      return {
        sessionId: null,
        running: false,
        startTs: null,
        currentPauseStart: null,
        totalPausedMs: 0,
        mode: 'flow',
        elapsedMs: 0
      }
    }
    
    const now = Date.now()
    let totalPausedMs = this.currentSession.pausedMs
    let currentPauseStart: number | null = null
    
    // If currently paused, add current pause duration
    if (!this.currentSession.running && this.currentSession.pauses.length > 0) {
      const lastPause = this.currentSession.pauses[this.currentSession.pauses.length - 1]
      if (lastPause && !lastPause.end) {
        currentPauseStart = lastPause.start
        totalPausedMs += (now - lastPause.start)
      }
    }
    
    const elapsedMs = this.currentSession.running 
      ? now - this.currentSession.startTs - totalPausedMs
      : now - this.currentSession.startTs - totalPausedMs
    
    return {
      sessionId: this.currentSession.id,
      running: this.currentSession.running,
      startTs: this.currentSession.startTs,
      currentPauseStart,
      totalPausedMs,
      mode: this.currentSession.mode,
      elapsedMs: Math.max(0, elapsedMs)
    }
  }

  /**
   * Load existing session (e.g., after page refresh)
   */
  async loadSession(sessionId: string): Promise<void> {
    const session = await db.sessions.get(sessionId)
    
    if (!session) {
      throw new Error('Session not found')
    }
    
    if (session.endTs) {
      throw new Error('Session already ended')
    }
    
    this.currentSession = session
    
    if (session.running) {
      this.startInterval()
    }
  }

  /**
   * Reconcile timer after backgrounding
   * Returns adjusted time in ms
   */
  async reconcile(): Promise<number> {
    if (!this.currentSession) return 0
    
    // Reload from DB to get persisted state
    const session = await db.sessions.get(this.currentSession.id)
    if (!session) return 0
    
    const oldElapsed = this.getState().elapsedMs
    this.currentSession = session
    const newElapsed = this.getState().elapsedMs
    
    const adjustment = newElapsed - oldElapsed
    
    return adjustment
  }

  /**
   * Start the UI update interval
   */
  private startInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    
    this.intervalId = setInterval(() => {
      if (this.onTickCallback) {
        this.onTickCallback(this.getState())
      }
    }, 1000)
  }

  /**
   * Stop the UI update interval
   */
  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopInterval()
    this.currentSession = null
  }
}

/**
 * Format milliseconds to HH:MM:SS
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Calculate actual duration from timestamps (for completed sessions)
 */
export function calculateActualDuration(session: LocalSession): number {
  if (!session.endTs) return 0
  
  return session.endTs - session.startTs - session.pausedMs
}
