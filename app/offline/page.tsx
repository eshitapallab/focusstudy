'use client'

import { useEffect, useState } from 'react'
import FocusStudyLogo from '@/components/FocusStudyLogo'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      // Redirect back to focus page when online
      setTimeout(() => {
        window.location.href = '/focus'
      }, 1000)
    }
    
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 rounded-full mb-6">
            <FocusStudyLogo size={48} color="#6366F1" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You're Offline
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Don't worry! Your timer continues to run in the background and all your data is saved locally.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            {isOnline ? (
              <>
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Connection restored!
                </span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Waiting for connection...
                </span>
              </>
            )}
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isOnline 
              ? 'Redirecting you back to your session...'
              : 'When you reconnect, your data will automatically sync to the cloud.'
            }
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-left bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200 text-sm">
                Timer Still Running
              </p>
              <p className="text-green-600 dark:text-green-400 text-xs">
                Your focus time is being tracked accurately
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <span className="text-xl">💾</span>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                Data Saved Locally
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                All sessions stored on your device
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <span className="text-xl">🔄</span>
            <div>
              <p className="font-medium text-purple-800 dark:text-purple-200 text-sm">
                Auto-Sync Ready
              </p>
              <p className="text-purple-600 dark:text-purple-400 text-xs">
                Will sync when connection returns
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
        >
          Try Again
        </button>
      </div>
    </main>
  )
}
