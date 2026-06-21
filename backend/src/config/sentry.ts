import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { env } from './env.js'

export function initSentry() {
  // Only initialize if DSN is configured
  if (!env.SENTRY_DSN) {
    console.log('[Sentry] DSN not configured — skipping initialization')
    return
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,

    integrations: [
      nodeProfilingIntegration(),
    ],

    // Performance monitoring
    tracesSampleRate: env.SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    profilesSampleRate: env.SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Don't send errors in development unless DSN explicitly set
    enabled: !!env.SENTRY_DSN,

    // Filter out noisy errors
    ignoreErrors: [
      'SCAN_LIMIT_REACHED',
      'UNAUTHORIZED',
      'NOT_FOUND',
      'VALIDATION_ERROR',
    ],

    beforeSend(event) {
      // Scrub sensitive data before sending to Sentry
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
      return event
    },
  })

  console.log(`[Sentry] Initialized for environment: ${env.SENTRY_ENVIRONMENT}`)
}

// Capture exception helper — never throws
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
) {
  try {
    if (env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context) scope.setExtras(context)
        Sentry.captureException(error)
      })
    }
  } catch {
    // Monitoring must never crash the app
  }
}

// Capture message helper
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>,
) {
  try {
    if (env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context) scope.setExtras(context)
        Sentry.captureMessage(message, level)
      })
    }
  } catch {
    // Never throw from monitoring
  }
}
