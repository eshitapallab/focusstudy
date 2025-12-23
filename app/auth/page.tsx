'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import FocusStudyLogo from '@/components/FocusStudyLogo'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const redirectTo = searchParams.get('redirectTo') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setError('Authentication is not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        }
      })

      if (otpError) {
        if (otpError.message.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.')
        } else {
          setError(otpError.message)
        }
        return
      }

      // Success - redirect to verification page with redirect URL
      const params = new URLSearchParams({
        email: email.trim(),
        redirectTo
      })
      router.push(`/auth/verify?${params.toString()}`)
    } catch (err) {
      console.error('Auth error:', err)
      setError('Failed to send code. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FocusStudyLogo size={64} color="#4F7CAC" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">
            Sign In to FocusStudy
          </h1>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-text-primary dark:text-white mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg 
                         bg-white dark:bg-gray-900 text-text-primary dark:text-white
                         focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none
                         transition-all text-base"
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Helper Text */}
            <div className="bg-accent-50 dark:bg-accent-900/20 rounded-lg p-4">
              <p className="text-sm text-text-secondary dark:text-gray-300">
                We'll send a one-time code to your email.
                <br />
                <strong className="text-text-primary dark:text-white">No passwords required.</strong>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isValidEmail(email)}
              className="w-full min-h-touch py-4 bg-primary hover:bg-primary-600 
                       disabled:bg-gray-300 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending code...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary dark:text-gray-400">
            Secure authentication with one-time codes.
            <br />
            Your data syncs automatically across all devices.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
