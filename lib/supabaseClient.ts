import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create Supabase client if environment variables are configured
// This allows the app to work in local-only mode
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
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

// Auth helpers
export async function signInWithMagicLink(email: string) {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  return { data, error }
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  return { data, error }
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getSession() {
  if (!supabase) throw new Error('Supabase not configured')
  
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
