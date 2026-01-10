/**
 * Offline Sync Manager
 * Handles offline detection, background sync queue, and automatic sync when online
 */

import { db } from './dexieClient'
import { syncLocalToSupabase } from './sync'

export interface SyncQueueItem {
  id: string
  type: 'session' | 'metadata' | 'planned'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retryCount: number
}

class OfflineSyncManager {
  private isOnline: boolean = true
  private syncInProgress: boolean = false
  private listeners: Set<(online: boolean) => void> = new Set()
  private syncQueue: SyncQueueItem[] = []
  private syncRetryTimeout: NodeJS.Timeout | null = null
  private readonly MAX_RETRIES = 5
  private readonly RETRY_DELAY_MS = 5000

  constructor() {
    if (typeof window !== 'undefined') {
      this.init()
    }
  }

  private init() {
    // Set initial online status
    this.isOnline = navigator.onLine

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Also check connectivity periodically (navigator.onLine can be unreliable)
    this.startConnectivityCheck()

    // Load any pending sync items from storage
    this.loadSyncQueue()
  }

  private handleOnline = async () => {
    console.log('[OfflineSync] Network online detected')
    this.isOnline = true
    this.notifyListeners(true)
    
    // Attempt to sync when back online
    await this.processSyncQueue()
  }

  private handleOffline = () => {
    console.log('[OfflineSync] Network offline detected')
    this.isOnline = false
    this.notifyListeners(false)
  }

  private startConnectivityCheck() {
    // Check connectivity every 30 seconds as a fallback
    setInterval(async () => {
      const wasOnline = this.isOnline
      
      try {
        // Try to fetch a small resource to verify connectivity
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        await fetch('/manifest.json', { 
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        this.isOnline = true
      } catch {
        // If fetch fails, check navigator.onLine as fallback
        this.isOnline = navigator.onLine
      }
      
      // Only notify if status changed
      if (wasOnline !== this.isOnline) {
        this.notifyListeners(this.isOnline)
        
        if (this.isOnline) {
          await this.processSyncQueue()
        }
      }
    }, 30000)
  }

  private async loadSyncQueue() {
    try {
      const stored = localStorage.getItem('focusflow_sync_queue')
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to load sync queue:', error)
      this.syncQueue = []
    }
  }

  private saveSyncQueue() {
    try {
      localStorage.setItem('focusflow_sync_queue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('[OfflineSync] Failed to save sync queue:', error)
    }
  }

  /**
   * Add an item to the sync queue
   */
  addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0
    }
    
    this.syncQueue.push(queueItem)
    this.saveSyncQueue()
    
    // If online, try to sync immediately
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue()
    }
  }

  /**
   * Process the sync queue when online
   */
  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true

    try {
      // Get user and device info
      const configs = await db.config.toArray()
      if (configs.length === 0) {
        this.syncInProgress = false
        return
      }

      const deviceId = configs[0].deviceId

      // Try to get userId from any synced session
      const syncedSession = await db.sessions
        .where('syncStatus')
        .equals('synced')
        .first()
      
      const userId = syncedSession?.userId

      if (userId) {
        // Perform full sync
        const result = await syncLocalToSupabase(userId, deviceId)
        
        if (result.success) {
          // Clear successfully synced items
          this.syncQueue = []
          this.saveSyncQueue()
          console.log('[OfflineSync] Sync completed successfully')
        } else {
          console.warn('[OfflineSync] Sync partially failed:', result.errors)
          this.scheduleRetry()
        }
      } else {
        // No user signed in, just mark queue as pending
        console.log('[OfflineSync] No user signed in, data saved locally')
      }
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error)
      this.scheduleRetry()
    } finally {
      this.syncInProgress = false
    }
  }

  private scheduleRetry() {
    if (this.syncRetryTimeout) {
      clearTimeout(this.syncRetryTimeout)
    }

    this.syncRetryTimeout = setTimeout(() => {
      if (this.isOnline) {
        this.processSyncQueue()
      }
    }, this.RETRY_DELAY_MS)
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Get pending sync count
   */
  getPendingSyncCount(): number {
    return this.syncQueue.length
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(callback => {
      try {
        callback(online)
      } catch (error) {
        console.error('[OfflineSync] Listener error:', error)
      }
    })
  }

  /**
   * Force a sync attempt
   */
  async forceSync(): Promise<boolean> {
    if (!this.isOnline) {
      return false
    }

    await this.processSyncQueue()
    
    // Also sync any pending sessions
    try {
      const configs = await db.config.toArray()
      if (configs.length === 0) return false

      const deviceId = configs[0].deviceId
      const syncedSession = await db.sessions
        .where('syncStatus')
        .equals('synced')
        .first()
      
      const userId = syncedSession?.userId

      if (userId) {
        const result = await syncLocalToSupabase(userId, deviceId)
        return result.success
      }
    } catch (error) {
      console.error('[OfflineSync] Force sync failed:', error)
    }

    return false
  }

  /**
   * Cleanup
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    
    if (this.syncRetryTimeout) {
      clearTimeout(this.syncRetryTimeout)
    }
    
    this.listeners.clear()
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager()

/**
 * React hook for offline status
 */
export function useOfflineStatus() {
  if (typeof window === 'undefined') {
    return { isOnline: true, pendingSyncCount: 0 }
  }

  return {
    isOnline: offlineSyncManager.getOnlineStatus(),
    pendingSyncCount: offlineSyncManager.getPendingSyncCount()
  }
}
