'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if user dismissed before (within 7 days)
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setDismissed(true)
      }
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show iOS prompt after a delay if conditions met
    if (iOS && !standalone && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [dismissed])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              📱
            </div>
            <div>
              <h3 className="font-bold text-lg">Install FocusStudy</h3>
              <p className="text-sm text-white/80">Get the full app experience</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-green-500">✓</span>
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-green-500">✓</span>
            <span>Faster loading</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-green-500">✓</span>
            <span>Home screen access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-green-500">✓</span>
            <span>Push notifications</span>
          </div>
        </div>

        {/* iOS Instructions */}
        {isIOS && (
          <div className="px-4 pb-2">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-sm">
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                To install on iOS:
              </p>
              <ol className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                <li>1. Tap the <span className="font-semibold">Share</span> button <span className="inline-block w-5 h-5 bg-blue-200 dark:bg-blue-800 rounded text-center">↑</span></li>
                <li>2. Scroll and tap <span className="font-semibold">"Add to Home Screen"</span></li>
                <li>3. Tap <span className="font-semibold">"Add"</span></li>
              </ol>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-4 pt-2 flex gap-2">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Maybe later
          </button>
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Install Now
            </button>
          )}
          {isIOS && (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-xl shadow-lg"
            >
              Got it!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
