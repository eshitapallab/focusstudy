// Rate limiting utility for API calls and user actions
// Prevents abuse and ensures fair usage

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()

  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const entry = this.limits.get(key)

    // No previous entry or window expired
    if (!entry || now > entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + config.windowMs
      })
      return true
    }

    // Within window, check count
    if (entry.count >= config.maxAttempts) {
      return false // Rate limit exceeded
    }

    // Increment count
    entry.count++
    return true
  }

  reset(key: string) {
    this.limits.delete(key)
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup()
  }, 5 * 60 * 1000)
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  CHECK_IN: { maxAttempts: 5, windowMs: 60 * 1000 }, // 5 attempts per minute
  VERDICT: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 per minute
  REALITY_CHECK: { maxAttempts: 3, windowMs: 60 * 1000 }, // 3 per minute
  AUTH: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
} as const
