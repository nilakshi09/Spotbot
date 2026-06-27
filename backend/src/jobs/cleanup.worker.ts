// Cleanup expired share tokens periodically
// Run once per day

import { db } from '../db/client.js';
import { reports } from '../db/schema/index.js';
import { lt, isNotNull, and, eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

export async function cleanupExpiredShareTokens(): Promise<void> {
  try {
    // Clear expired share tokens
    // (keep the report record, just null out the share token)
    const result = await db
      .update(reports)
      .set({
        shareToken: null,
        shareExpiresAt: null,
      })
      .where(
        and(
          isNotNull(reports.shareToken),
          lt(reports.shareExpiresAt, new Date()),
        )
      );

    logger.info(
      { cleaned: result.length },
      'Cleaned up expired share tokens',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup expired share tokens');
  }
}

export async function cleanupExpiredInvitations(): Promise<void> {
  try {
    const { invitations } = await import('../db/schema/invitations.js');
    await db
      .update(invitations)
      .set({ revoked: true })
      .where(
        and(
          eq(invitations.revoked, false),
          lt(invitations.expiresAt, new Date()),
        )
      );

    logger.info('Cleaned up expired invitations');
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup expired invitations');
  }
}
