import crypto from 'crypto';
import { db } from '../db/client.js';
import { invitations, users, organizations } from '../db/schema/index.js';
import { eq, and, ne } from 'drizzle-orm';
import { sendInvitationEmail } from './email.service.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { ConflictError, InvitationExpiredError, InvitationAlreadyAcceptedError } from '../utils/errors.js';
import { AppError, NotFoundError } from '../middleware/error-handler.js';
import { z } from 'zod';

export class TeamService {

  // ─── INVITE MEMBER ────────────────────────────────────────────────────────

  async inviteMember(
    orgId: string,
    invitedByUserId: string,
    email: string,
    role: 'admin' | 'member' = 'member',
  ) {
    // Validate role
    if (!['admin', 'member'].includes(role)) {
      throw new AppError(400, 'Role must be admin or member', 'VALIDATION_ERROR');
    }

    // Check if email already belongs to a user in this org
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.email, email.toLowerCase()),
        eq(users.organizationId, orgId),
      ),
    });

    if (existingUser) {
      throw new ConflictError(
        'This email is already a member of your organization'
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.organizationId, orgId),
        eq(invitations.email, email.toLowerCase()),
        eq(invitations.revoked, false),
      ),
    });

    if (existingInvitation) {
      // Check if it's expired
      if (new Date(existingInvitation.expiresAt) > new Date()) {
        throw new ConflictError(
          'An invitation has already been sent to this email'
        );
      }
      // If expired, revoke old one and send new
      await db
        .update(invitations)
        .set({ revoked: true })
        .where(eq(invitations.id, existingInvitation.id));
    }

    // Get org and inviter details for email
    const [org, inviter] = await Promise.all([
      db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, invitedByUserId),
        columns: { name: true, email: true },
      }),
    ]);

    if (!org) throw new NotFoundError('Organization not found');
    if (!inviter) throw new NotFoundError('User not found');

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiry — 48 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create invitation record
    const [invitation] = await db
      .insert(invitations)
      .values({
        organizationId: orgId,
        invitedByUserId,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      })
      .returning();

    // Send invitation email
    const inviteUrl =
      `${env.FRONTEND_URL}/invite/accept?token=${token}`;

    await sendInvitationEmail(
      email,
      inviter.name,
      org.name,
      inviteUrl,
      role,
    );

    logger.info(
      { orgId, email, role, invitationId: invitation.id },
      'Team invitation sent',
    );

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
      invitedBy: inviter.name,
    };
  }

  // ─── ACCEPT INVITATION ────────────────────────────────────────────────────

  async acceptInvitation(
    token: string,
    name: string,
    password: string,
  ) {
    // Validate token format
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new AppError(400, 'Invalid invitation token', 'VALIDATION_ERROR');
    }

    // Find invitation
    const invitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.token, token),
        eq(invitations.revoked, false),
      ),
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    // Check expiry
    if (new Date(invitation.expiresAt) < new Date()) {
      throw new InvitationExpiredError();
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      throw new InvitationAlreadyAcceptedError();
    }

    // Check if email already has an account
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, invitation.email),
    });

    if (existingUser) {
      // If user exists, just add them to the org
      // (they clicked invite link while already having an account)
      await db
        .update(users)
        .set({
          organizationId: invitation.organizationId,
          role: invitation.role as 'admin' | 'member',
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      // Mark invitation as accepted
      await db
        .update(invitations)
        .set({ acceptedAt: new Date() })
        .where(eq(invitations.id, invitation.id));

      logger.info(
        { userId: existingUser.id, orgId: invitation.organizationId },
        'Existing user joined org via invitation',
      );

      return { userId: existingUser.id, isNewUser: false };
    }

    // Validate password
    if (!password || password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters', 'VALIDATION_ERROR');
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user in the invited org
    const [newUser] = await db
      .insert(users)
      .values({
        email: invitation.email,
        passwordHash,
        name,
        organizationId: invitation.organizationId,
        role: invitation.role as 'admin' | 'member',
        emailVerified: true, // trusted since they clicked email link
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id));

    logger.info(
      { userId: newUser.id, orgId: invitation.organizationId },
      'New user joined org via invitation',
    );

    return { userId: newUser.id, isNewUser: true };
  }

  // ─── GET MEMBERS ──────────────────────────────────────────────────────────

  async getMembers(orgId: string) {
    // Get all users in the org
    const members = await db.query.users.findMany({
      where: eq(users.organizationId, orgId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    // Get pending invitations
    const pendingInvitations = await db.query.invitations.findMany({
      where: and(
        eq(invitations.organizationId, orgId),
        eq(invitations.revoked, false),
      ),
    });

    // Separate active vs expired invitations
    const now = new Date();
    const activeInvitations = pendingInvitations
      .filter(inv => !inv.acceptedAt && new Date(inv.expiresAt) > now)
      .map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: 'pending' as const,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
      }));

    return {
      members: members.map(m => ({
        ...m,
        status: 'active' as const,
        createdAt: m.createdAt.toISOString(),
      })),
      pendingInvitations: activeInvitations,
      totalCount: members.length,
    };
  }

  // ─── REMOVE MEMBER ────────────────────────────────────────────────────────

  async removeMember(
    orgId: string,
    adminUserId: string,
    targetUserId: string,
  ) {
    // Cannot remove yourself
    if (adminUserId === targetUserId) {
      throw new AppError(400, 'You cannot remove yourself from the organization', 'VALIDATION_ERROR');
    }

    // Verify target user belongs to this org
    const targetUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, targetUserId),
        eq(users.organizationId, orgId),
      ),
    });

    if (!targetUser) {
      throw new NotFoundError('Member not found');
    }

    // Check there's at least one other admin
    if (targetUser.role === 'admin') {
      const adminCount = await db.query.users.findMany({
        where: and(
          eq(users.organizationId, orgId),
          eq(users.role, 'admin'),
        ),
        columns: { id: true },
      });

      if (adminCount.length <= 1) {
        throw new AppError(
          400,
          'Cannot remove the last admin. Promote another member to admin first.',
          'VALIDATION_ERROR'
        );
      }
    }

    // Create a new personal org for the removed user
    // (so they still have an account, just not in this org)
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: `${targetUser.name}'s Workspace`,
        plan: 'free',
        scanLimit: 5,
        scansUsed: 0,
      })
      .returning();

    // Move user to their new personal org
    await db
      .update(users)
      .set({
        organizationId: newOrg.id,
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));

    logger.info(
      { orgId, adminUserId, targetUserId },
      'Member removed from organization',
    );

    return { removed: true, userId: targetUserId };
  }

  // ─── CHANGE MEMBER ROLE ───────────────────────────────────────────────────

  async changeMemberRole(
    orgId: string,
    adminUserId: string,
    targetUserId: string,
    newRole: 'admin' | 'member',
  ) {
    // Cannot change your own role
    if (adminUserId === targetUserId) {
      throw new AppError(400, 'You cannot change your own role', 'VALIDATION_ERROR');
    }

    // Validate role
    if (!['admin', 'member'].includes(newRole)) {
      throw new AppError(400, 'Role must be admin or member', 'VALIDATION_ERROR');
    }

    // Verify target user belongs to this org
    const targetUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, targetUserId),
        eq(users.organizationId, orgId),
      ),
    });

    if (!targetUser) {
      throw new NotFoundError('Member not found');
    }

    // If demoting from admin, check there's still another admin
    if (targetUser.role === 'admin' && newRole === 'member') {
      const adminCount = await db.query.users.findMany({
        where: and(
          eq(users.organizationId, orgId),
          eq(users.role, 'admin'),
        ),
        columns: { id: true },
      });

      if (adminCount.length <= 1) {
        throw new AppError(
          400,
          'Cannot demote the last admin. Promote another member to admin first.',
          'VALIDATION_ERROR'
        );
      }
    }

    // Update role
    await db
      .update(users)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));

    logger.info(
      { orgId, adminUserId, targetUserId, newRole },
      'Member role changed',
    );

    return { userId: targetUserId, role: newRole };
  }

  // ─── REVOKE INVITATION ────────────────────────────────────────────────────

  async revokeInvitation(orgId: string, invitationId: string) {
    const invitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.id, invitationId),
        eq(invitations.organizationId, orgId),
      ),
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    await db
      .update(invitations)
      .set({ revoked: true })
      .where(eq(invitations.id, invitationId));

    return { revoked: true };
  }

  // ─── GET INVITATION BY TOKEN ──────────────────────────────────────────────
  // Used to show invitation details before accepting

  async getInvitationDetails(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new NotFoundError('Invitation not found');
    }

    const invitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.token, token),
        eq(invitations.revoked, false),
      ),
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new InvitationExpiredError();
    }

    if (invitation.acceptedAt) {
      throw new InvitationAlreadyAcceptedError();
    }

    // Get org details
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, invitation.organizationId),
      columns: { name: true },
    });

    // Get inviter name
    const inviter = await db.query.users.findFirst({
      where: eq(users.id, invitation.invitedByUserId),
      columns: { name: true },
    });

    return {
      email: invitation.email,
      role: invitation.role,
      orgName: org?.name ?? 'Unknown Organization',
      inviterName: inviter?.name ?? 'A team member',
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }
}

export const teamService = new TeamService();
