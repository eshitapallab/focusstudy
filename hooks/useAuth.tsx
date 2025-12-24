'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { fullSync } from '@/lib/sync'
import { getOrCreateDeviceId } from '@/lib/dexieClient'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  syncInProgress: boolean
  syncError: string | null
  isSupabaseConfigured: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  syncInProgress: false,
  syncError: null,
  isSupabaseConfigured: false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const supabaseConfigured = isSupabaseConfigured()
  const syncInProgressRef = useRef(false)

  useEffect(() => {
    // Skip auth setup if Supabase is not configured
    if (!supabase || !supabaseConfigured) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Trigger sync if user is signed in
      if (session?.user) {
        triggerSync(session.user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        // Trigger sync on sign in
        await triggerSync(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabaseConfigured])

  const triggerSync = async (userId: string) => {
    // Prevent multiple syncs from running simultaneously
    if (syncInProgressRef.current) {
      console.log('Sync already in progress, skipping')
      return
    }

    syncInProgressRef.current = true
    setSyncInProgress(true)
    setSyncError(null)

    try {
      const deviceId = await getOrCreateDeviceId()
      
      // Add timeout to prevent sync from hanging indefinitely
      const syncPromise = fullSync(userId, deviceId)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 30000)
      )
      
      const result = await Promise.race([syncPromise, timeoutPromise])

      if (!result.upload.success || !result.download.success) {
        const errors = [
          ...result.upload.errors,
          ...result.download.errors
        ]
        setSyncError(errors.join(', '))
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncError(error instanceof Error ? error.message : 'Failed to sync data. Please try again.')
    } finally {
      // Always clear sync progress, even on error
      syncInProgressRef.current = false
      setSyncInProgress(false)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut: handleSignOut,
        syncInProgress,
        syncError,
        isSupabaseConfigured: supabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
