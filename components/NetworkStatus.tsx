'use client'

import { useState, useEffect } from 'react'
import { offlineSyncManager } from '@/lib/offlineSync'

interface NetworkStatusProps {
  className?: string
}

/**
 * Network status indicator component
 * Shows offline/online status with sync indicator
 */
export default function NetworkStatus({ className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => {
    // Set initial status
    setIsOnline(offlineSyncManager.getOnlineStatus())
    setPendingSync(offlineSyncManager.getPendingSyncCount())

    // Subscribe to status changes
    const unsubscribe = offlineSyncManager.subscribe((online) => {
      const wasOffline = !isOnline
      setIsOnline(online)
      setPendingSync(offlineSyncManager.getPendingSyncCount())

      // Show reconnected message briefly
      if (online && wasOffline) {
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      }
    })

    // Also listen to native events as backup
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  // Don't show anything if online and no recent reconnection
  if (isOnline && !showReconnected && pendingSync === 0) {
    return null
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-full shadow-lg border border-amber-200 dark:border-amber-700 animate-in slide-in-from-bottom-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-sm font-medium">Offline - Timer still running</span>
        </div>
      )}

      {showReconnected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full shadow-lg border border-green-200 dark:border-green-700 animate-in slide-in-from-bottom-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium">
            Back online{pendingSync > 0 ? ` - Syncing ${pendingSync} items...` : ' - Synced!'}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for inline use
 */
export function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(offlineSyncManager.getOnlineStatus())
    
    const unsubscribe = offlineSyncManager.subscribe(setIsOnline)
    
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    return () => {
      unsubscribe()
    }
  }, [])

  if (isOnline) return null

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs rounded-full">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
      Offline
    </span>
  )
}
