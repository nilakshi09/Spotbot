import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { scans } from '../db/schema/scans.js';
import { organizations } from '../db/schema/organizations.js';
import { users } from '../db/schema/users.js';
import { refreshTokens } from '../db/schema/refresh_tokens.js';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { UnauthorizedError } from '../middleware/error-handler.js';
import bcrypt from 'bcrypt';
import { quotaService } from '../services/quota.service.js';
import { billingService } from '../services/billing.service.js';

const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Requires at least 1 uppercase').regex(/[a-z]/, 'Requires at least 1 lowercase').regex(/[0-9]/, 'Requires at least 1 number'),
});

export default async function userRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyAccessToken);

  app.get('/me/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).sub;
    const orgId = (request.user as any).orgId;

    if (!orgId) {
      throw new UnauthorizedError('No organization found');
    }

    const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org[0]) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    const { scanLimit, scansUsed, plan, billingCycleStart } = org[0];

    const stats = await db.select({
      totalScans: sql<number>`count(case when ${scans.status} = 'completed' then 1 end)::int`,
      avgFraudScore: sql<number>`round(avg(case when ${scans.status} = 'completed' then ${scans.fraudScore} end)::numeric, 1)::float`,
      highRiskCount: sql<number>`count(case when ${scans.status} = 'completed' and ${scans.riskLevel} = 'high' then 1 end)::int`,
      scansThisMonth: sql<number>`count(case when ${scans.createdAt} >= coalesce(${billingCycleStart}, date_trunc('month', current_date)) then 1 end)::int`,
    }).from(scans).where(eq(scans.userId, userId));

    const result = stats[0];

    const trialStatus = await billingService.getTrialStatus(orgId);

    return reply.send({
      totalScans: result.totalScans || 0,
      avgFraudScore: result.avgFraudScore || 0,
      highRiskCount: result.highRiskCount || 0,
      scansThisMonth: result.scansThisMonth || 0,
      scanLimit,
      scansUsed,
      planName: plan,
      trial: trialStatus,
    });
  });

  app.get('/me/quota', async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request.user as any).orgId;
    const status = await quotaService.getQuotaStatus(orgId);
    return reply.send(status);
  });

  app.post('/me/change-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).sub;
    const body = ChangePasswordSchema.parse(request.body);

    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRecord[0]) return reply.status(404).send({ error: 'User not found' });

    const isValid = await bcrypt.compare(body.currentPassword, userRecord[0].passwordHash);
    if (!isValid) {
      return reply.status(400).send({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(body.newPassword, 12);

    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, userId));

    return reply.send({ message: 'Password updated successfully' });
  });

  app.delete('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).sub;
    const orgId = (request.user as any).orgId;

    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRecord[0]) return reply.status(404).send({ error: 'User not found' });

    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, userId));
    
    // Check if user is the only admin
    const orgUsers = await db.select().from(users).where(eq(users.organizationId, orgId));
    const admins = orgUsers.filter(u => u.role === 'admin');

    await db.delete(users).where(eq(users.id, userId));

    if (admins.length === 1 && admins[0].id === userId) {
      await db.delete(scans).where(eq(scans.userId, userId)); // Delete scans before org due to FK? Wait, scans belong to users.
      // There might be other users' scans in the org if they aren't deleted? 
      // The prompt says "delete all scans belonging to the org". Since scans map to user_id, 
      // we need to delete scans of all orgUsers, then all orgUsers, then the org.
      const userIds = orgUsers.map(u => u.id);
      if (userIds.length > 0) {
        for (const uid of userIds) {
          await db.delete(scans).where(eq(scans.userId, uid));
          await db.delete(refreshTokens).where(eq(refreshTokens.userId, uid));
          await db.delete(users).where(eq(users.id, uid));
        }
      }
      await db.delete(organizations).where(eq(organizations.id, orgId));
    }

    return reply.send({ message: 'Account deleted' });
  });
}
