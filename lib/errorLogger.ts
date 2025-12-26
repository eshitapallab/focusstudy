// Centralized error logging utility
// This allows for easy integration with error tracking services like Sentry

type ErrorContext = {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  log(message: string, error: unknown, context?: ErrorContext) {
    if (this.isDevelopment) {
      console.error(`[Error] ${message}`, {
        error,
        context,
        timestamp: new Date().toISOString()
      })
    }

    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { custom: context } })
    
    // You can also log to your own analytics endpoint
    this.sendToAnalytics(message, error, context)
  }

  warn(message: string, context?: ErrorContext) {
    if (this.isDevelopment) {
      console.warn(`[Warning] ${message}`, context)
    }
  }

  private sendToAnalytics(message: string, error: unknown, context?: ErrorContext) {
    // Only send in production and if analytics is enabled
    if (this.isDevelopment || !process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) {
      return
    }

    // Send to your analytics endpoint
    // Example implementation:
    try {
      const errorData = {
        message,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        context,
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      }

      // Send to analytics endpoint (implement based on your needs)
      // fetch('/api/analytics/error', {
      //   method: 'POST',
      //   body: JSON.stringify(errorData)
      // })
    } catch (analyticsError) {
      // Silently fail - don't want analytics to break the app
      if (this.isDevelopment) {
        console.error('Failed to send error analytics:', analyticsError)
      }
    }
  }
}

export const errorLogger = new ErrorLogger()

// Convenience exports
export const logError = (message: string, error: unknown, context?: ErrorContext) => {
  errorLogger.log(message, error, context)
}

export const logWarning = (message: string, context?: ErrorContext) => {
  errorLogger.warn(message, context)
}
