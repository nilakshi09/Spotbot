// Lightweight product analytics wrapper
// Uses PostHog if configured, no-ops otherwise

import type { PostHog } from 'posthog-js'

const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production'
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

let posthog: PostHog | null = null

export async function initAnalytics() {
  if (!posthogKey || !isProd) return

  const { default: PostHog } = await import('posthog-js')
  PostHog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false,  // We'll track manually
    persistence: 'localStorage',
  })
  posthog = PostHog
}

export const analytics = {
  // Page views
  page: (pageName: string) => {
    try {
      posthog?.capture('$pageview', { page: pageName })
    } catch {}
  },

  // User identification
  identify: (userId: string, traits: Record<string, unknown>) => {
    try {
      posthog?.identify(userId, traits)
    } catch {}
  },

  // Key events
  scanStarted: (platform: string) => {
    try {
      posthog?.capture('scan_started', { platform })
    } catch {}
  },

  scanCompleted: (fraudScore: number, riskLevel: string) => {
    try {
      posthog?.capture('scan_completed', { fraudScore, riskLevel })
    } catch {}
  },

  pdfDownloaded: () => {
    try {
      posthog?.capture('pdf_downloaded')
    } catch {}
  },

  reportShared: () => {
    try {
      posthog?.capture('report_shared')
    } catch {}
  },

  upgradeClicked: (fromPlan: string, toPlan: string) => {
    try {
      posthog?.capture('upgrade_clicked', { fromPlan, toPlan })
    } catch {}
  },

  upgradeCompleted: (plan: string) => {
    try {
      posthog?.capture('upgrade_completed', { plan })
    } catch {}
  },

  // Reset on logout
  reset: () => {
    try {
      posthog?.reset()
    } catch {}
  },
}
