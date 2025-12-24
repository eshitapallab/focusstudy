'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import FocusStudyLogo from '@/components/FocusStudyLogo'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const redirectTo = searchParams.get('redirectTo') || '/'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canResend, setCanResend] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(30)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Redirect if no email
    if (!email) {
      router.push('/auth')
      return
    }

    // Start resend countdown
    const timer = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace handling
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (otpCode: string) => {
    if (!supabase || !email) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      })

      console.log('Verify OTP response:', { data, error: verifyError })

      if (verifyError) {
        console.error('OTP verification failed:', verifyError)
        if (verifyError.message.includes('expired')) {
          setError('Code expired. Please request a new one.')
        } else if (verifyError.message.includes('invalid')) {
          setError('Invalid code. Please check and try again.')
        } else {
          setError(verifyError.message)
        }
        // Clear OTP on error
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setIsLoading(false)
        return
      }

      // Check if we have a valid session or user
      if (data?.session || data?.user) {
        console.log('Session data:', data.session)
        console.log('User data:', data.user)
        
        // Best-effort: ensure session is set in the client (don't block redirect)
        if (data.session) {
          supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
        }
        
        // Success! Redirect to original destination or home
        const targetUrl = `${redirectTo}?auth=success`
        console.log('Auth successful, redirecting to:', targetUrl)
        
        // Keep loading state on to prevent UI flicker during redirect
        // Don't call setIsLoading(false) here
        
        // Small delay to ensure session is saved
        setTimeout(() => {
          console.log('Executing redirect now...')
          window.location.replace(targetUrl)
        }, 500)
        return
      }

      console.error('No session or user in response:', data)

      // If we got here, something went wrong
      setError('Verification succeeded but no session created. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setIsLoading(false)
    } catch (err) {
      console.error('Verification error:', err)
      setError('Failed to verify code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!supabase || !email || !canResend) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            email: email
          }
        }
      })
      
      console.log('OTP Resend:', { data, error: resendError })

      if (resendError) {
        setError(resendError.message)
        return
      }

      // Reset countdown
      setCanResend(false)
      setResendCountdown(30)
      
      // Start new countdown
      const timer = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Show success feedback
      setError(null)
    } catch (err) {
      console.error('Resend error:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@')
    if (local.length <= 2) return email
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
  }

  if (!email) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/50 to-accent-200/50 dark:from-primary-900/30 dark:to-accent-900/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-200/50 to-primary-200/50 dark:from-accent-900/30 dark:to-primary-900/30 rounded-full blur-3xl animate-pulse-slow" />
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
          <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-3">
            📬 Check your email
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-lg">
            We sent a 6-digit code to
            <br />
            <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{email}</span>
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-gray-700/50">
          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-text-primary dark:text-white mb-4 text-center">
                Enter verification code
              </label>
              <div 
                className="flex gap-3 justify-center"
                onPaste={handlePaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold
                             border-2 border-gray-200 dark:border-gray-700 rounded-xl
                             bg-white dark:bg-gray-900 text-text-primary dark:text-white
                             focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none
                             transition-all disabled:opacity-50 shadow-sm
                             hover:border-primary-300 dark:hover:border-primary-700"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-800 dark:text-red-200 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerify(otp.join(''))}
              disabled={isLoading || otp.some(d => !d)}
              className="w-full min-h-touch py-4 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 
                       disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25
                       transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Verify Code ✓'
              )}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="text-sm text-text-secondary dark:text-gray-400 
                         hover:text-primary dark:hover:text-primary-400 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors font-medium"
              >
                {canResend ? (
                  '🔄 Resend code'
                ) : (
                  `Resend code in ${resendCountdown}s`
                )}
              </button>
            </div>

            {/* Back to Email */}
            <div className="text-center pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={() => router.push('/auth')}
                disabled={isLoading}
                className="text-sm text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 transition-colors font-medium"
              >
                ← Use different email
              </button>
            </div>
          </div>
        </div>

        {/* Helper Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary dark:text-gray-400">
            ⏰ Code expires in 10 minutes
          </p>
        </div>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
