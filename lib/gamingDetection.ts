import { DailyCheckIn, GamingDetection } from './types'

/**
 * Detect if user is gaming the system with fake data
 */
export function detectGamingPatterns(recentCheckIns: DailyCheckIn[]): GamingDetection['patterns'] {
  if (recentCheckIns.length < 5) {
    return {} // Not enough data
  }

  const patterns: GamingDetection['patterns'] = {}

  // Pattern 1: Same minutes every day
  const minutes = recentCheckIns.map(c => c.minutesStudied)
  const uniqueMinutes = new Set(minutes)
  const sameMinutes = uniqueMinutes.size === 1 && recentCheckIns.length >= 5
  
  if (sameMinutes) {
    patterns.sameMinutesDaily = true
  }

  // Pattern 2: Always answering "Yes" to recall
  const allYes = recentCheckIns.every(c => c.couldRevise)
  if (allYes && recentCheckIns.length >= 7) {
    patterns.alwaysYesRecall = true
  }

  // Pattern 3: No variance in study patterns
  const minutesVariance = calculateVariance(minutes)
  if (minutesVariance < 100 && recentCheckIns.length >= 7) {
    // Very low variance (less than 10 min standard deviation)
    patterns.noVariance = true
  }

  return patterns
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
  const squareDiffs = numbers.map(n => Math.pow(n - mean, 2))
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / numbers.length
  
  return variance
}

/**
 * Generate honesty prompt message based on detected patterns
 */
export function getHonestyPrompt(patterns: GamingDetection['patterns']): string {
  const messages = []

  if (patterns.sameMinutesDaily) {
    messages.push('We noticed identical study times each day.')
  }
  if (patterns.alwaysYesRecall) {
    messages.push('Every topic marked as perfect recall.')
  }
  if (patterns.noVariance) {
    messages.push('Your patterns show unusual consistency.')
  }

  if (messages.length === 0) {
    return 'Be honest — accuracy matters more than streaks.'
  }

  return `${messages[0]} Be honest — accuracy matters more than streaks.`
}

/**
 * Check if gaming detection should trigger
 */
export function shouldPromptHonesty(
  patterns: GamingDetection['patterns'],
  hasRecentPrompt: boolean
): boolean {
  // Don't prompt if already prompted recently
  if (hasRecentPrompt) return false

  // Trigger if any concerning pattern detected
  return Object.values(patterns).some(p => p === true)
}

/**
 * Detect unrealistic study sessions
 */
export function isUnrealisticSession(minutes: number, subject: string): boolean {
  // Flag sessions over 8 hours
  if (minutes > 480) return true

  // Flag suspiciously perfect round numbers for long sessions
  if (minutes >= 300 && minutes % 60 === 0) {
    return true
  }

  return false
}
