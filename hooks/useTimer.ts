'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer, TimerState } from '@/lib/timer'
import { incrementSessionCount } from '@/lib/dexieClient'

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    sessionId: null,
    running: false,
    startTs: null,
    currentPauseStart: null,
    totalPausedMs: 0,
    mode: 'flow',
    elapsedMs: 0
  })
  
  const [reconciliationMessage, setReconciliationMessage] = useState<string | null>(null)
  const timerRef = useRef<Timer | null>(null)
  const visibilityRef = useRef<boolean>(true)

  // Initialize timer
  useEffect(() => {
    timerRef.current = new Timer()
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      visibilityRef.current = !document.hidden
      
      if (!document.hidden && timerRef.current) {
        // Page became visible again - reconcile timer
        timerRef.current.reconcile().then(adjustment => {
          if (Math.abs(adjustment) > 1000) { // More than 1 second
            const seconds = Math.round(adjustment / 1000)
            setReconciliationMessage(
              `Timer adjusted to reflect time away. (${Math.abs(seconds)}s ${seconds > 0 ? 'added' : 'removed'})`
            )
            
            // Clear message after 5 seconds
            setTimeout(() => setReconciliationMessage(null), 5000)
          }
        })
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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

  const dismissReconciliationMessage = useCallback(() => {
    setReconciliationMessage(null)
  }, [])

  return {
    state,
    start,
    pause,
    resume,
    stop,
    reconciliationMessage,
    dismissReconciliationMessage
  }
}
