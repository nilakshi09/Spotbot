import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});

export const businessLogger = {
  // User events
  userSignedUp: (userId: string, email: string, plan: string) =>
    logger.info({ event: 'user.signed_up', userId, email, plan }, 'User signed up'),

  userLoggedIn: (userId: string) =>
    logger.info({ event: 'user.logged_in', userId }, 'User logged in'),

  // Scan events
  scanCreated: (scanId: string, userId: string, platform: string, handle: string) =>
    logger.info({ event: 'scan.created', scanId, userId, platform, handle }, 'Scan created'),

  scanCompleted: (scanId: string, fraudScore: number, durationMs: number) =>
    logger.info({ event: 'scan.completed', scanId, fraudScore, durationMs }, 'Scan completed'),

  scanFailed: (scanId: string, error: string, attempt: number) =>
    logger.warn({ event: 'scan.failed', scanId, error, attempt }, 'Scan failed'),

  scanCacheHit: (platform: string, handle: string) =>
    logger.info({ event: 'scan.cache_hit', platform, handle }, 'Scan cache hit'),

  // Billing events
  planUpgraded: (orgId: string, fromPlan: string, toPlan: string) =>
    logger.info({ event: 'billing.plan_upgraded', orgId, fromPlan, toPlan }, 'Plan upgraded'),

  planDowngraded: (orgId: string, fromPlan: string, toPlan: string) =>
    logger.warn({ event: 'billing.plan_downgraded', orgId, fromPlan, toPlan }, 'Plan downgraded'),

  quotaExceeded: (orgId: string, plan: string, limit: number) =>
    logger.warn({ event: 'billing.quota_exceeded', orgId, plan, limit }, 'Quota exceeded'),

  paymentFailed: (orgId: string, plan: string) =>
    logger.error({ event: 'billing.payment_failed', orgId, plan }, 'Payment failed'),

  // Report events
  pdfGenerated: (scanId: string, durationMs: number) =>
    logger.info({ event: 'report.pdf_generated', scanId, durationMs }, 'PDF generated'),

  reportShared: (scanId: string, expiresInDays: number) =>
    logger.info({ event: 'report.shared', scanId, expiresInDays }, 'Report shared'),
}
