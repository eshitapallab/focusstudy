'use client'

import { useRouter } from 'next/navigation'
import FocusStudyLogo from '@/components/FocusStudyLogo'

interface AuthModalProps {
  onClose: () => void
}

/**
 * Simple Auth Modal that redirects to /auth page
 * This maintains backward compatibility with existing code
 */
export default function AuthModal({ onClose }: AuthModalProps) {
  const router = useRouter()

  const handleContinue = () => {
    onClose()
    router.push('/auth')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl p-8 w-full md:max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white">
            Sync Your Progress
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="text-center py-6">
          <div className="flex justify-center mb-6">
            <FocusStudyLogo size={64} color="#4F7CAC" />
          </div>
          
          <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">
            Create a free account
          </h3>
          
          <p className="text-text-secondary dark:text-gray-400 mb-8">
            Keep your study sessions safe and sync across all your devices.
            <br />
            <strong className="text-text-primary dark:text-white">No passwords required.</strong>
          </p>

          <ul className="text-left space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-primary-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-text-secondary dark:text-gray-300">
                Sync sessions across all devices
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-primary-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-text-secondary dark:text-gray-300">
                Never lose your progress
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-primary-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-text-secondary dark:text-gray-300">
                Simple email verification (no passwords!)
              </span>
            </li>
          </ul>

          <button
            onClick={handleContinue}
            className="w-full min-h-touch py-4 bg-primary hover:bg-primary-600 
                     text-white font-semibold rounded-xl transition-colors shadow-sm mb-4"
          >
            Continue with Email
          </button>

          <button
            onClick={onClose}
            className="text-sm text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
