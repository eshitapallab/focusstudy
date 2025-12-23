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

      if (verifyError) {
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
        return
      }

      if (data.session) {
        // Success! Redirect to original destination or home
        const targetUrl = `${redirectTo}?auth=success`
        console.log('Redirecting to:', targetUrl)
        
        // Force a hard redirect to ensure middleware picks up the session
        window.location.href = targetUrl
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('Failed to verify code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
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
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FocusStudyLogo size={64} color="#4F7CAC" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">
            Check your email
          </h1>
          <p className="text-text-secondary dark:text-gray-400">
            We sent a 6-digit code to
            <br />
            <strong className="text-text-primary dark:text-white">{email}</strong>
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-semibold text-text-primary dark:text-white mb-4 text-center">
                Enter verification code
              </label>
              <div 
                className="flex gap-2 justify-center"
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
                             border-2 border-gray-200 dark:border-gray-700 rounded-lg
                             bg-white dark:bg-gray-900 text-text-primary dark:text-white
                             focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none
                             transition-all disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => handleVerify(otp.join(''))}
              disabled={isLoading || otp.some(d => !d)}
              className="w-full min-h-touch py-4 bg-primary hover:bg-primary-600 
                       disabled:bg-gray-300 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
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
                         transition-colors"
              >
                {canResend ? (
                  'Resend code'
                ) : (
                  `Resend code in ${resendCountdown}s`
                )}
              </button>
            </div>

            {/* Back to Email */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => router.push('/auth')}
                disabled={isLoading}
                className="text-sm text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 transition-colors"
              >
                ← Use different email
              </button>
            </div>
          </div>
        </div>

        {/* Helper Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary dark:text-gray-400">
            Code expires in 10 minutes
          </p>
        </div>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
