import { logger } from './logger.js'

interface Metrics {
  scansCreated: number
  scansCompleted: number
  scansFailed: number
  scansCacheHit: number
  totalScanDurationMs: number
  pdfsGenerated: number
  checkoutsInitiated: number
  planUpgrades: number
  quotaExceeded: number
  apiErrors: number
  apiRequests: number
}

const metrics: Metrics = {
  scansCreated: 0,
  scansCompleted: 0,
  scansFailed: 0,
  scansCacheHit: 0,
  totalScanDurationMs: 0,
  pdfsGenerated: 0,
  checkoutsInitiated: 0,
  planUpgrades: 0,
  quotaExceeded: 0,
  apiErrors: 0,
  apiRequests: 0,
}

export const track = {
  scanCreated: () => { metrics.scansCreated++ },
  scanCompleted: (durationMs: number) => {
    metrics.scansCompleted++
    metrics.totalScanDurationMs += durationMs
  },
  scanFailed: () => { metrics.scansFailed++ },
  scanCacheHit: () => { metrics.scansCacheHit++ },
  pdfGenerated: () => { metrics.pdfsGenerated++ },
  checkoutInitiated: () => { metrics.checkoutsInitiated++ },
  planUpgraded: () => { metrics.planUpgrades++ },
  quotaExceeded: () => { metrics.quotaExceeded++ },
  apiError: () => { metrics.apiErrors++ },
  apiRequest: () => { metrics.apiRequests++ },
}

export function getMetrics() {
  const avgScanDurationMs = metrics.scansCompleted > 0
    ? Math.round(metrics.totalScanDurationMs / metrics.scansCompleted)
    : 0

  const scanSuccessRate = (metrics.scansCreated > 0)
    ? Math.round((metrics.scansCompleted / metrics.scansCreated) * 100)
    : 100

  const cacheHitRate = (metrics.scansCreated > 0)
    ? Math.round((metrics.scansCacheHit / metrics.scansCreated) * 100)
    : 0

  const errorRate = (metrics.apiRequests > 0)
    ? Math.round((metrics.apiErrors / metrics.apiRequests) * 100)
    : 0

  return {
    ...metrics,
    avgScanDurationMs,
    scanSuccessRate,
    cacheHitRate,
    errorRate,
  }
}

// Log metrics every 5 minutes
export function startMetricsLogging() {
  setInterval(() => {
    const snapshot = getMetrics()
    logger.info({ event: 'metrics.snapshot', ...snapshot }, 'Metrics snapshot')
  }, 5 * 60 * 1000)
}
