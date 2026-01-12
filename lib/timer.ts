import { db, LocalSession, getOrCreateDeviceId } from './dexieClient'
import { offlineSyncManager } from './offlineSync'

// Maximum session duration before auto-ending (24 hours in ms)
const MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000

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
    // Stop intervals immediately to prevent further ticks
    this.stopInterval()
    this.stopPersistInterval()
    
    if (!this.currentSession) {
      // Try to find and clean up any orphaned running sessions
      await this.cleanupOrphanedSessions()
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
   * Auto-ends sessions that are older than MAX_SESSION_DURATION_MS
   */
  async checkForActiveSession(): Promise<LocalSession | null> {
    try {
      const now = Date.now()
      
      // Find all sessions that appear to be running (no endTs)
      const sessions = await db.sessions.toArray()
      const runningSessions = sessions.filter(s => s.running && !s.endTs)
      
      if (runningSessions.length === 0) {
        return null
      }
      
      // Check each running session for staleness
      for (const session of runningSessions) {
        const sessionAge = now - session.startTs
        
        // If session is older than max duration, auto-end it
        if (sessionAge > MAX_SESSION_DURATION_MS) {
          console.log(`[Timer] Auto-ending stale session ${session.id} (age: ${Math.round(sessionAge / 1000 / 60)} minutes)`)
          
          // Calculate reasonable end time (start + max duration or last pause end)
          let endTs = session.startTs + MAX_SESSION_DURATION_MS
          if (session.pauses.length > 0) {
            const lastPause = session.pauses[session.pauses.length - 1]
            if (lastPause.end) {
              endTs = Math.min(endTs, lastPause.end + 60000) // 1 min after last pause
            }
          }
          
          // Close any open pause
          let pausedMs = session.pausedMs
          if (session.pauses.length > 0) {
            const lastPause = session.pauses[session.pauses.length - 1]
            if (!lastPause.end) {
              lastPause.end = endTs
              pausedMs += (lastPause.end - lastPause.start)
            }
          }
          
          await db.sessions.update(session.id, {
            endTs,
            running: false,
            pauses: session.pauses,
            pausedMs
          })
          
          continue // Skip this session, it's now ended
        }
        
        // Return the first valid (non-stale) session
        return session
      }
      
      return null
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
   * Clean up any orphaned sessions that might be stuck in running state
   */
  async cleanupOrphanedSessions(): Promise<void> {
    try {
      const now = Date.now()
      const sessions = await db.sessions.toArray()
      const orphanedSessions = sessions.filter(s => s.running && !s.endTs)
      
      for (const session of orphanedSessions) {
        console.log(`[Timer] Cleaning up orphaned session ${session.id}`)
        
        // Calculate end time based on last activity or max duration
        let endTs = now
        const sessionAge = now - session.startTs
        
        if (sessionAge > MAX_SESSION_DURATION_MS) {
          endTs = session.startTs + MAX_SESSION_DURATION_MS
        }
        
        // Close any open pause
        let pausedMs = session.pausedMs
        if (session.pauses.length > 0) {
          const lastPause = session.pauses[session.pauses.length - 1]
          if (!lastPause.end) {
            lastPause.end = endTs
            pausedMs += (lastPause.end - lastPause.start)
          }
        }
        
        await db.sessions.update(session.id, {
          endTs,
          running: false,
          pauses: session.pauses,
          pausedMs
        })
      }
    } catch (error) {
      console.error('[Timer] Error cleaning up orphaned sessions:', error)
    }
  }

  /**
   * Force stop all running sessions - use when timer appears stuck
   */
  async forceStopAll(): Promise<number> {
    // Stop any active intervals
    this.stopInterval()
    this.stopPersistInterval()
    await this.releaseWakeLock()
    
    const now = Date.now()
    let stoppedCount = 0
    
    try {
      const sessions = await db.sessions.toArray()
      const runningSessions = sessions.filter(s => !s.endTs || s.running)
      
      for (const session of runningSessions) {
        console.log(`[Timer] Force stopping session ${session.id}`)
        
        // Close any open pause
        let pausedMs = session.pausedMs
        if (session.pauses.length > 0) {
          const lastPause = session.pauses[session.pauses.length - 1]
          if (!lastPause.end) {
            lastPause.end = now
            pausedMs += (lastPause.end - lastPause.start)
          }
        }
        
        await db.sessions.update(session.id, {
          endTs: now,
          running: false,
          pauses: session.pauses,
          pausedMs
        })
        
        stoppedCount++
      }
      
      this.currentSession = null
      console.log(`[Timer] Force stopped ${stoppedCount} sessions`)
      
      return stoppedCount
    } catch (error) {
      console.error('[Timer] Error force stopping sessions:', error)
      return 0
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
