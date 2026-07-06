import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { teamService } from '../services/team.service.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { db } from '../db/client.js';
import { organizations } from '../db/schema/organizations.js';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../middleware/error-handler.js';

export default async function orgRoutes(app: FastifyInstance) {

  // ─── GET MEMBERS ──────────────────────────────────────────────
  // GET /api/org/members
  // Auth: required (admin or member can view)
  app.get('/members', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const result = await teamService.getMembers((req as FastifyRequest & { user: { orgId: string } }).user.orgId);
    return reply.send(result);
  });

  // ─── INVITE MEMBER ────────────────────────────────────────────
  // POST /api/org/invite
  // Auth: required, admin only
  app.post('/invite', {
    preHandler: [verifyAccessToken, requireAdmin],
  }, async (req, reply) => {
    const { email, role } = z.object({
      email: z.string().email('Invalid email address'),
      role: z.enum(['admin', 'member']).default('member'),
    }).parse(req.body);

    const result = await teamService.inviteMember(
      (req as FastifyRequest & { user: { orgId: string; sub: string } }).user.orgId,
      (req as FastifyRequest & { user: { orgId: string; sub: string } }).user.sub,
      email,
      role,
    );

    return reply.status(201).send(result);
  });

  // ─── REVOKE INVITATION ────────────────────────────────────────
  // DELETE /api/org/invitations/:id
  // Auth: required, admin only
  app.delete('/invitations/:id', {
    preHandler: [verifyAccessToken, requireAdmin],
  }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const result = await teamService.revokeInvitation((req as FastifyRequest & { user: { orgId: string } }).user.orgId, id);
    return reply.send(result);
  });

  // ─── REMOVE MEMBER ────────────────────────────────────────────
  // DELETE /api/org/members/:userId
  // Auth: required, admin only
  app.delete('/members/:userId', {
    preHandler: [verifyAccessToken, requireAdmin],
  }, async (req, reply) => {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);

    const result = await teamService.removeMember(
      (req as FastifyRequest & { user: { orgId: string; sub: string } }).user.orgId,
      (req as FastifyRequest & { user: { orgId: string; sub: string } }).user.sub,
      userId,
    );

    return reply.send(result);
  });

  // ─── CHANGE MEMBER ROLE ───────────────────────────────────────
  // PATCH /api/org/members/:userId/role
  // Auth: required, admin only
  app.patch('/members/:userId/role', {
    preHandler: [verifyAccessToken, requireAdmin],
  }, async (req, reply) => {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);
    const { role } = z.object({ role: z.enum(['admin', 'member']) }).parse(req.body);

    const result = await teamService.changeMemberRole(
      (req as FastifyRequest & { user: { orgId: string; sub: string } }).user.orgId,
      (req as FastifyRequest & { user: { orgId: string; sub: string } }).user.sub,
      userId,
      role,
    );

    return reply.send(result);
  });

  // ─── GET ORG DETAILS ──────────────────────────────────────────
  // GET /api/org
  // Auth: required
  app.get('/', {
    preHandler: [verifyAccessToken],
  }, async (req, reply) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, (req as FastifyRequest & { user: { orgId: string } }).user.orgId),
    });

    if (!org) throw new NotFoundError('Organization not found');

    return reply.send(org);
  });
}
