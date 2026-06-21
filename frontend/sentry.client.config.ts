import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.1 : 1.0,

  // Session replay (optional but useful for debugging)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive inputs
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],

  // Filter out expected errors
  ignoreErrors: [
    'SCAN_LIMIT_REACHED',
    'UNAUTHORIZED',
    'ResizeObserver loop limit exceeded',
    'Network request failed',
  ],

  beforeSend(event) {
    // Don't send errors in development
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      console.error('[Sentry would capture]:', event)
      return null  // Don't actually send in dev
    }
    return event
  },
})
