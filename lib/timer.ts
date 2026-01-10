import { db, LocalSession, getOrCreateDeviceId } from './dexieClient'
import { offlineSyncManager } from './offlineSync'

export interface TimerState {
  sessionId: string | null
  running: boolean
  startTs: number | null
  currentPauseStart: number | null
  totalPausedMs: number
  mode: string
  elapsedMs: number // Computed value
  isBackgrounded: boolean // Whether app is in background
}

export interface PauseInterval {
  start: number
  end?: number
}

/**
 * Core timer class with timestamp-based tracking
 * Resilient to backgrounding, network loss, and OS pausing
 * 
 * Key features:
 * - Uses absolute timestamps instead of intervals for accurate time tracking
 * - Persists state to IndexedDB for crash recovery
 * - Reconciles time when app returns from background
 * - Works completely offline with sync when online
 */
export class Timer {
  private currentSession: LocalSession | null = null
  private intervalId: NodeJS.Timeout | null = null
  private onTickCallback?: (state: TimerState) => void
  private isBackgrounded: boolean = false
  private lastTickTime: number = 0
  private persistInterval: NodeJS.Timeout | null = null
  private wakeLock: WakeLockSentinel | null = null

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
    this.lastTickTime = now
    
    // Try to acquire wake lock to keep screen on (best effort)
    await this.acquireWakeLock()
    
    // Start UI update interval (every second)
    this.startInterval()
    
    // Start periodic persistence (every 5 seconds)
    this.startPersistInterval()
    
    // Add to offline sync queue
    offlineSyncManager.addToQueue({
      type: 'session',
      action: 'create',
      data: newSession
    })
    
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
    
    // Add to sync queue
    offlineSyncManager.addToQueue({
      type: 'session',
      action: 'update',
      data: { id: this.currentSession.id, endTs: now }
    })
    
    const sessionId = this.currentSession.id
    this.currentSession = null
    this.stopInterval()
    this.stopPersistInterval()
    await this.releaseWakeLock()
    
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
        elapsedMs: 0,
        isBackgrounded: this.isBackgrounded
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
      elapsedMs: Math.max(0, elapsedMs),
      isBackgrounded: this.isBackgrounded
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
    
    // Update last tick time
    this.lastTickTime = Date.now()
    
    // Re-acquire wake lock if we had an active session
    if (session.running) {
      await this.acquireWakeLock()
    }
    
    return adjustment
  }

  /**
   * Handle visibility change (app going to background/foreground)
   */
  async handleVisibilityChange(isVisible: boolean): Promise<number> {
    this.isBackgrounded = !isVisible
    
    if (isVisible) {
      // Coming back to foreground - reconcile time
      return this.reconcile()
    } else {
      // Going to background - persist current state
      await this.persistState()
      return 0
    }
  }

  /**
   * Persist current state to IndexedDB
   */
  private async persistState(): Promise<void> {
    if (!this.currentSession) return
    
    try {
      await db.sessions.update(this.currentSession.id, {
        pauses: this.currentSession.pauses,
        pausedMs: this.currentSession.pausedMs,
        running: this.currentSession.running
      })
    } catch (error) {
      console.error('[Timer] Failed to persist state:', error)
    }
  }

  /**
   * Start periodic persistence interval
   */
  private startPersistInterval(): void {
    if (this.persistInterval) {
      clearInterval(this.persistInterval)
    }
    
    // Persist state every 5 seconds for crash recovery
    this.persistInterval = setInterval(() => {
      this.persistState()
    }, 5000)
  }

  /**
   * Stop periodic persistence interval
   */
  private stopPersistInterval(): void {
    if (this.persistInterval) {
      clearInterval(this.persistInterval)
      this.persistInterval = null
    }
  }

  /**
   * Try to acquire a screen wake lock (prevents screen from sleeping)
   */
  private async acquireWakeLock(): Promise<void> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return
    }
    
    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen')
      
      // Re-acquire wake lock when visibility changes
      if (this.wakeLock) {
        this.wakeLock.addEventListener('release', () => {
          console.log('[Timer] Wake lock released')
          this.wakeLock = null
        })
      }
      
      console.log('[Timer] Wake lock acquired')
    } catch (error) {
      // Wake lock can fail due to low battery, etc. - that's OK
      console.log('[Timer] Could not acquire wake lock:', error)
    }
  }

  /**
   * Release the screen wake lock
   */
  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release()
        this.wakeLock = null
        console.log('[Timer] Wake lock released')
      } catch (error) {
        console.error('[Timer] Failed to release wake lock:', error)
      }
    }
  }

  /**
   * Check if there's an active session that needs to be restored
   */
  async checkForActiveSession(): Promise<LocalSession | null> {
    try {
      // Look for any running session
      const activeSession = await db.sessions
        .where('running')
        .equals(1) // Dexie uses 1 for true
        .first()
      
      if (activeSession && !activeSession.endTs) {
        return activeSession
      }
      
      // Also check for sessions without endTs (might not have running indexed properly)
      const sessions = await db.sessions.toArray()
      const runningSession = sessions.find(s => s.running && !s.endTs)
      
      return runningSession || null
    } catch (error) {
      console.error('[Timer] Error checking for active session:', error)
      return null
    }
  }

  /**
   * Restore an active session (e.g., after page refresh or app restart)
   */
  async restoreSession(onTick?: (state: TimerState) => void): Promise<boolean> {
    const activeSession = await this.checkForActiveSession()
    
    if (!activeSession) {
      return false
    }
    
    this.currentSession = activeSession
    this.onTickCallback = onTick
    this.lastTickTime = Date.now()
    
    if (activeSession.running) {
      await this.acquireWakeLock()
      this.startInterval()
      this.startPersistInterval()
    }
    
    // Notify with current state
    if (this.onTickCallback) {
      this.onTickCallback(this.getState())
    }
    
    return true
  }

  /**
   * Start the UI update interval
   */
  private startInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    
    this.intervalId = setInterval(() => {
      const now = Date.now()
      
      // Detect large time jumps (device was sleeping or backgrounded)
      const timeSinceLastTick = now - this.lastTickTime
      if (timeSinceLastTick > 5000) {
        console.log(`[Timer] Large time jump detected: ${timeSinceLastTick}ms - reconciling`)
        this.reconcile()
      }
      
      this.lastTickTime = now
      
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
    this.stopPersistInterval()
    this.releaseWakeLock()
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
