import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { scans } from '../db/schema/scans.js';
import { organizations } from '../db/schema/organizations.js';
import { users } from '../db/schema/users.js';
import { refreshTokens } from '../db/schema/refresh_tokens.js';
import { eq, and, sql, asc, desc, gte, inArray } from 'drizzle-orm';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { UnauthorizedError, AppError } from '../middleware/error-handler.js';
import bcrypt from 'bcrypt';
import { quotaService } from '../services/quota.service.js';
import { billingService } from '../services/billing.service.js';

const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Requires at least 1 uppercase').regex(/[a-z]/, 'Requires at least 1 lowercase').regex(/[0-9]/, 'Requires at least 1 number'),
});

export default async function userRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyAccessToken);

  app.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!userRecord[0]) {
      throw new UnauthorizedError('User not found');
    }

    const user = userRecord[0];
    
    return reply.send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      organizationId: user.organizationId,
      hasGoogleAuth: !!user.googleId,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    });
  });

  app.get('/me/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
    const orgId = (request as FastifyRequest & { user: { orgId: string } }).user.orgId;

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
    const orgId = (request as FastifyRequest & { user: { orgId: string } }).user.orgId;
    const status = await quotaService.getQuotaStatus(orgId);
    return reply.send(status);
  });

  app.post('/me/change-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
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
    const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
    const orgId = (request as FastifyRequest & { user: { orgId: string } }).user.orgId;

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

  app.get('/me/analytics', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['7d', '30d', '90d'], default: '30d' }
        }
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { range } = request.query as { range: '7d' | '30d' | '90d' };
    const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
    const orgId = (request as FastifyRequest & { user: { orgId: string } }).user.orgId;
    const isAdmin = (request as FastifyRequest & { user: { role: string } }).user.role === 'admin';

    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[range];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userIds = isAdmin
      ? (await db.query.users.findMany({
          where: eq(users.organizationId, orgId),
          columns: { id: true },
        })).map(u => u.id)
      : [userId];

    const rangeScans = await db.query.scans.findMany({
      where: and(
        inArray(scans.userId, userIds),
        eq(scans.status, 'completed'),
        gte(scans.createdAt, startDate)
      ),
      columns: {
        id: true,
        handle: true,
        platform: true,
        fraudScore: true,
        riskLevel: true,
        realReach: true,
        profileData: true,
        createdAt: true,
      },
      orderBy: [asc(scans.createdAt)],
    });

    const riskDistribution = {
      low: rangeScans.filter(s => s.riskLevel === 'low').length,
      medium: rangeScans.filter(s => s.riskLevel === 'medium').length,
      high: rangeScans.filter(s => s.riskLevel === 'high').length,
    };

    const platformDistribution = {
      instagram: rangeScans.filter(s => s.platform === 'instagram').length,
      youtube: rangeScans.filter(s => s.platform === 'youtube').length,
    };

    const topFlaggedAccounts = [...rangeScans]
      .sort((a, b) => (b.fraudScore ?? 0) - (a.fraudScore ?? 0))
      .slice(0, 10)
      .map(s => ({
        handle: s.handle,
        platform: s.platform,
        fraudScore: s.fraudScore,
        riskLevel: s.riskLevel,
        followers: (s.profileData as { followers?: number })?.followers ?? 0,
        scanDate: s.createdAt.toISOString(),
      }));

    const trendDays = getDaysInRange(days);
    const scanVolumeTrend = trendDays.map(date => ({
      date,
      count: rangeScans.filter(s =>
        s.createdAt.toISOString().startsWith(date)
      ).length,
    }));

    const avgScoreTrend = trendDays.map(date => {
      const dayScans = rangeScans.filter(s =>
        s.createdAt.toISOString().startsWith(date)
      );
      return {
        date,
        avgScore: dayScans.length > 0
          ? Math.round(
              dayScans.reduce((sum, s) => sum + (s.fraudScore ?? 0), 0)
              / dayScans.length
            )
          : null,
      };
    });

    const scoreDistribution = [
      { range: '0-20', count: rangeScans.filter(s => (s.fraudScore ?? 0) <= 20).length },
      { range: '21-40', count: rangeScans.filter(s => (s.fraudScore ?? 0) > 20 && (s.fraudScore ?? 0) <= 40).length },
      { range: '41-60', count: rangeScans.filter(s => (s.fraudScore ?? 0) > 40 && (s.fraudScore ?? 0) <= 60).length },
      { range: '61-80', count: rangeScans.filter(s => (s.fraudScore ?? 0) > 60 && (s.fraudScore ?? 0) <= 80).length },
      { range: '81-100', count: rangeScans.filter(s => (s.fraudScore ?? 0) > 80).length },
    ];

    const totalReach = rangeScans.reduce(
      (sum, s) => sum + (s.realReach ?? 0), 0
    );
    const avgFraudScore = rangeScans.length > 0
      ? Math.round(
          rangeScans.reduce((sum, s) => sum + (s.fraudScore ?? 0), 0)
          / rangeScans.length
        )
      : 0;
    const highRiskPct = rangeScans.length > 0
      ? Math.round((riskDistribution.high / rangeScans.length) * 100)
      : 0;

    return reply.send({
      range,
      riskDistribution,
      platformDistribution,
      scanVolumeTrend,
      avgScoreTrend,
      scoreDistribution,
      topFlaggedAccounts,
      summary: {
        totalScans: rangeScans.length,
        avgFraudScore,
        highRiskCount: riskDistribution.high,
        highRiskPct,
        totalEstimatedReach: totalReach,
      },
      // Backward compatibility
      scanVolumeByDay: scanVolumeTrend,
      avgScoreByDay: avgScoreTrend,
      totalScansLast30Days: rangeScans.length,
    });
  });

  app.get('/me/analytics/export', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          range: { type: 'string', enum: ['7d', '30d', '90d'], default: '30d' }
        }
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = (request as FastifyRequest & { user: { orgId: string } }).user.orgId;
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: { plan: true },
    });

    if (!org || !['pro', 'enterprise'].includes(org.plan)) {
      throw new AppError(
        402,
        'Analytics export requires Pro or Enterprise plan',
        'PLAN_NOT_SUPPORTED'
      );
    }

    const { range } = request.query as { range: '7d' | '30d' | '90d' };
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[range];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userId = (request as FastifyRequest & { user: { sub: string } }).user.sub;
    const isAdmin = (request as FastifyRequest & { user: { role: string } }).user.role === 'admin';

    const userIds = isAdmin
      ? (await db.query.users.findMany({
          where: eq(users.organizationId, orgId),
          columns: { id: true },
        })).map(u => u.id)
      : [userId];

    const rangeScans = await db.query.scans.findMany({
      where: and(
        inArray(scans.userId, userIds),
        eq(scans.status, 'completed'),
        gte(scans.createdAt, startDate)
      ),
      orderBy: [desc(scans.createdAt)],
    });

    const headers = [
      'handle',
      'platform',
      'fraud_score',
      'risk_level',
      'real_reach',
      'followers',
      'scan_date',
    ];

    const rows = rangeScans.map(s => [
      s.handle,
      s.platform,
      s.fraudScore ?? '',
      s.riskLevel ?? '',
      s.realReach ?? '',
      s.profileData?.followers ?? '',
      s.createdAt.toISOString().split('T')[0],
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell =>
          typeof cell === 'string' && cell.includes(',')
            ? `"${cell}"`
            : cell
        ).join(',')
      ),
    ];

    const csv = csvLines.join('\n');

    return reply
      .header('Content-Type', 'text/csv')
      .header(
        'Content-Disposition',
        `attachment; filename="spotbot-analytics-${range}.csv"`
      )
      .send(csv);
  });
}

function getDaysInRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });
}
