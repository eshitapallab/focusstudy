import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create Supabase client if environment variables are configured
// This allows the app to work in local-only mode
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!(supabaseUrl && supabaseAnonKey)

// Database types
export interface SupabaseSession {
  id: string
  user_id: string | null
  device_id: string
  start_ts: string
  end_ts: string | null
  paused_ms: number
  mode: string
  created_at: string
}

export interface SupabaseSessionMetadata {
  id: string
  session_id: string
  subject: string | null
  planned: boolean
  focus_rating: number | null
  note: string | null
  labeled_at: string | null
}

export interface SupabasePlannedSession {
  id: string
  user_id: string | null
  device_id: string
  subject: string
  planned_date: string
  goal: string | null
  created_at: string
}

/**
 * Auth Helper Functions
 * OTP-ONLY Authentication System
 */

/**
 * Sign out the current user
 * Note: This does NOT delete local data - user can continue using the app
 */
export async function signOut() {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Get current session
 */
export async function getSession() {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
