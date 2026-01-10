'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer, TimerState } from '@/lib/timer'
import { incrementSessionCount } from '@/lib/dexieClient'
import { offlineSyncManager } from '@/lib/offlineSync'

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    sessionId: null,
    running: false,
    startTs: null,
    currentPauseStart: null,
    totalPausedMs: 0,
    mode: 'flow',
    elapsedMs: 0,
    isBackgrounded: false
  })
  
  const [reconciliationMessage, setReconciliationMessage] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const timerRef = useRef<Timer | null>(null)
  const visibilityRef = useRef<boolean>(true)
  const lastVisibleTimeRef = useRef<number>(Date.now())

  // Initialize timer and restore any active session
  useEffect(() => {
    timerRef.current = new Timer()
    
    // Check for and restore any active session (e.g., after page refresh)
    const restoreSession = async () => {
      if (timerRef.current) {
        const restored = await timerRef.current.restoreSession((newState) => {
          setState(newState)
        })
        
        if (restored) {
          const state = timerRef.current.getState()
          setState(state)
          
          // Show message that session was restored
          const elapsedMinutes = Math.round(state.elapsedMs / 60000)
          if (elapsedMinutes > 0) {
            setReconciliationMessage(
              `Session restored! You've been focusing for ${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''}.`
            )
            setTimeout(() => setReconciliationMessage(null), 5000)
          }
        }
      }
    }
    
    restoreSession()
    
    // Handle page visibility changes (app going to background/foreground)
    const handleVisibilityChange = async () => {
      const isVisible = !document.hidden
      visibilityRef.current = isVisible
      
      if (isVisible && timerRef.current) {
        // Page became visible again - calculate time away
        const timeAway = Date.now() - lastVisibleTimeRef.current
        
        // Reconcile timer with actual time passed
        const adjustment = await timerRef.current.handleVisibilityChange(true)
        
        // Show message if significant time passed while backgrounded
        if (timeAway > 10000) { // More than 10 seconds
          const secondsAway = Math.round(timeAway / 1000)
          const minutesAway = Math.floor(secondsAway / 60)
          
          if (minutesAway > 0) {
            setReconciliationMessage(
              `Welcome back! ${minutesAway} minute${minutesAway !== 1 ? 's' : ''} passed while you were away.`
            )
          } else if (secondsAway > 30) {
            setReconciliationMessage(
              `Timer synchronized after ${secondsAway} seconds.`
            )
          }
          
          setTimeout(() => setReconciliationMessage(null), 5000)
        }
        
        // Update state after reconciliation
        setState(timerRef.current.getState())
      } else if (!isVisible && timerRef.current) {
        // Going to background - record time and persist state
        lastVisibleTimeRef.current = Date.now()
        await timerRef.current.handleVisibilityChange(false)
      }
    }
    
    // Handle page freeze/resume events (more reliable on mobile)
    const handleFreeze = () => {
      if (timerRef.current) {
        timerRef.current.handleVisibilityChange(false)
      }
    }
    
    const handleResume = async () => {
      if (timerRef.current) {
        await timerRef.current.handleVisibilityChange(true)
        setState(timerRef.current.getState())
      }
    }
    
    // Subscribe to online/offline status
    const unsubscribeOffline = offlineSyncManager.subscribe((online) => {
      setIsOnline(online)
      
      if (online) {
        // Try to sync when coming back online
        offlineSyncManager.forceSync()
      }
    })
    
    // Set initial online status
    setIsOnline(offlineSyncManager.getOnlineStatus())
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('freeze', handleFreeze)
    document.addEventListener('resume', handleResume)
    
    // Also handle focus/blur for additional reliability
    window.addEventListener('focus', handleResume)
    window.addEventListener('blur', handleFreeze)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('freeze', handleFreeze)
      document.removeEventListener('resume', handleResume)
      window.removeEventListener('focus', handleResume)
      window.removeEventListener('blur', handleFreeze)
      unsubscribeOffline()
      
      if (timerRef.current) {
        timerRef.current.destroy()
      }
    }
  }, [])

  const start = useCallback(async (mode: string = 'flow') => {
    if (!timerRef.current) return
    
    const sessionId = await timerRef.current.start(mode, (newState) => {
      setState(newState)
    })
    
    setState(timerRef.current.getState())
    await incrementSessionCount(false)
  }, [])

  const pause = useCallback(async () => {
    if (!timerRef.current) return
    await timerRef.current.pause()
    setState(timerRef.current.getState())
  }, [])

  const resume = useCallback(async () => {
    if (!timerRef.current) return
    await timerRef.current.resume()
    setState(timerRef.current.getState())
  }, [])

  const stop = useCallback(async () => {
    if (!timerRef.current) return
    const sessionId = await timerRef.current.stop()
    setState(timerRef.current.getState())
    return sessionId
  }, [])
  
  const logDistraction = useCallback(async () => {
    if (!timerRef.current) return
    await timerRef.current.logDistraction()
  }, [])
  
  const getDistractionCount = useCallback(() => {
    if (!timerRef.current) return 0
    return timerRef.current.getDistractionCount()
  }, [])

  const dismissReconciliationMessage = useCallback(() => {
    setReconciliationMessage(null)
  }, [])

  return {
    state,
    start,
    pause,
    resume,
    stop,
    logDistraction,
    getDistractionCount,
    reconciliationMessage,
    dismissReconciliationMessage,
    isOnline
  }
}
