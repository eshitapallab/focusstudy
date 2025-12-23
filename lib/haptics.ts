/**
 * Haptic Feedback Utility
 * Provides gentle vibration feedback for timer events
 */

export type HapticPattern = 'success' | 'start' | 'pause' | 'milestone' | 'distraction' | 'notification'

// Vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
const PATTERNS: Record<HapticPattern, number[]> = {
  success: [50, 50, 50], // Double tap
  start: [30], // Single short
  pause: [20, 20, 20], // Triple short
  milestone: [100, 50, 50], // Long then short
  distraction: [10], // Very subtle
  notification: [50, 100, 50] // Attention-grabbing
}

/**
 * Check if haptics are supported
 */
export function isHapticsSupported(): boolean {
  return 'vibrate' in navigator
}

/**
 * Trigger haptic feedback
 */
export async function triggerHaptic(pattern: HapticPattern, enabled: boolean = true): Promise<void> {
  if (!enabled || !isHapticsSupported()) {
    return
  }

  try {
    const vibrationPattern = PATTERNS[pattern]
    navigator.vibrate(vibrationPattern)
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic(): void {
  if (isHapticsSupported()) {
    navigator.vibrate(0)
  }
}

/**
 * Check if user has enabled haptics in settings
 */
export async function getHapticsEnabled(): Promise<boolean> {
  try {
    const { db } = await import('./dexieClient')
    const config = await db.config.toArray()
    
    if (config.length === 0) return true // Default enabled
    
    return config[0].settings?.hapticsEnabled ?? true
  } catch (error) {
    console.warn('Failed to get haptics setting:', error)
    return true
  }
}

/**
 * Update haptics setting
 */
export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  try {
    const { db } = await import('./dexieClient')
    const config = await db.config.toArray()
    
    if (config.length === 0) return
    
    await db.config.update(config[0].deviceId, {
      settings: {
        ...config[0].settings,
        hapticsEnabled: enabled
      }
    })
  } catch (error) {
    console.error('Failed to update haptics setting:', error)
  }
}
