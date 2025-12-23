'use client'

import { useEffect } from 'react'
import { initSmartNotifications } from '@/lib/smartNotifications'

/**
 * Smart Notifications Initializer
 * Sets up periodic checks for smart study suggestions
 */
export default function SmartNotificationsInit() {
  useEffect(() => {
    // Initialize smart notifications service
    initSmartNotifications()
  }, [])

  return null // This component doesn't render anything
}
