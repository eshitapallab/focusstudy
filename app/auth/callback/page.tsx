'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

/**
 * Auth Callback Handler
 * Handles authentication redirects (primarily for OAuth if ever enabled)
 * For OTP flow, verification happens directly in /auth/verify
 */
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          console.error('Supabase not configured')
          router.push('/')
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=auth_failed')
          return
        }

        if (session) {
          // Successful authentication - redirect to home with success flag
          router.push('/?auth=success')
        } else {
          // No session - redirect to auth
          router.push('/auth')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        router.push('/auth')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary dark:text-gray-400">Signing you in...</p>
      </div>
    </div>
  )
}
