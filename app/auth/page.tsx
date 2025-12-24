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
      const { data, error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: {
            email: email.trim()
          }
        }
      })
      
      console.log('OTP Response:', { data, error: otpError })

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/50 to-accent-200/50 dark:from-primary-900/30 dark:to-accent-900/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-200/50 to-primary-200/50 dark:from-accent-900/30 dark:to-primary-900/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary-100/30 to-transparent dark:from-primary-900/10 rounded-full" />
      </div>
      
      <div className="w-full max-w-md relative">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse-slow" />
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl">
                <FocusStudyLogo size={56} color="#6366F1" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent mb-3">
            FocusStudy
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-lg">
            Your calm study companion
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-gray-700/50">
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
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl 
                         bg-white dark:bg-gray-900 text-text-primary dark:text-white
                         focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none
                         transition-all text-base placeholder:text-gray-400"
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Helper Text */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl p-4 border border-primary-100/50 dark:border-primary-800/50">
              <p className="text-sm text-text-secondary dark:text-gray-300">
                ✨ We'll send a 6-digit code to your email.
                <br />
                <strong className="text-primary dark:text-primary-300">No passwords required.</strong>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isValidEmail(email)}
              className="w-full min-h-touch py-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 
                       disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25
                       transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending code...
                </span>
              ) : (
                'Continue →'
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary dark:text-gray-400">
            🔐 Secure authentication with one-time codes
            <br />
            <span className="text-xs">Your data syncs automatically across all devices</span>
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
