'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function UserMenu() {
  const { user, signOut, syncInProgress } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  if (!user) return null

  const getInitials = () => {
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const handleSignOut = async () => {
    await signOut()
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold flex items-center justify-center transition-colors"
        aria-label="User menu"
      >
        {getInitials()}
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-40 overflow-hidden">
            {/* User info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.user_metadata?.display_name || user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>

            {/* Sync status */}
            {syncInProgress && (
              <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    Syncing data...
                  </span>
                </div>
              </div>
            )}

            {/* Menu items */}
            <div className="py-2">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your local data remains on this device
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
