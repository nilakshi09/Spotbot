import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import * as schema from '../db/schema/index.js';
import { ConflictError, UnauthorizedError } from '../middleware/error-handler.js';
import { sendPasswordResetEmail } from './email.service.js';
import { env } from '../config/env.js';
import { businessLogger } from '../utils/logger.js';

export function createAuthService(fastify: FastifyInstance) {
  return {
    async signup(email: string, password: string, name: string) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      if (existingUser) {
        throw new ConflictError('An account with this email already exists');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      return await db.transaction(async (tx) => {
        const [org] = await tx.insert(schema.organizations).values({
          name: `${name}'s Workspace`,
          plan: 'free',
        }).returning();

        const [user] = await tx.insert(schema.users).values({
          organizationId: org.id,
          email,
          passwordHash,
          name,
          role: 'admin',
        }).returning();

        const payload = {
          sub: user.id,
          email: user.email,
          orgId: user.organizationId,
          role: user.role,
          plan: org.plan,
        };

        const accessToken = fastify.jwt.sign(payload);
        const refreshToken = crypto.randomUUID();
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        await tx.insert(schema.refreshTokens).values({
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        businessLogger.userSignedUp(user.id, email, 'free');

        return {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            orgId: org.id,
            plan: org.plan,
          },
        };
      });
    },

    async generateTokenPair(user: any, org: any) {
      const payload = {
        sub: user.id,
        email: user.email,
        orgId: user.organizationId,
        role: user.role,
        plan: org.plan,
      };

      const accessToken = fastify.jwt.sign(payload);
      const refreshToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: org.id,
          plan: org.plan,
        },
      };
    },

    async login(email: string, password: string) {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
        with: {
          // Note: Assuming relations are defined, but if not we can join manually. 
          // Since relations aren't explicitly defined in Drizzle config yet, let's join manually to be safe.
        }
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, user.organizationId));

      const payload = {
        sub: user.id,
        email: user.email,
        orgId: user.organizationId,
        role: user.role,
        plan: org.plan,
      };

      const accessToken = fastify.jwt.sign(payload);
      const refreshToken = crypto.randomUUID();
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await db.insert(schema.refreshTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      businessLogger.userLoggedIn(user.id);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: org.id,
          plan: org.plan,
        },
      };
    },

    async refresh(refreshToken: string) {
      try {
        // Hash the incoming token
        const tokenHash = crypto
          .createHash('sha256')
          .update(refreshToken)
          .digest('hex');

        // Find token in DB
        const storedToken = await db.query.refreshTokens.findFirst({
          where: and(
            eq(schema.refreshTokens.tokenHash, tokenHash),
            eq(schema.refreshTokens.revoked, false)
          ),
        });

        if (!storedToken) {
          throw new UnauthorizedError('Invalid refresh token');
        }

        if (new Date(storedToken.expiresAt) < new Date()) {
          throw new UnauthorizedError('Refresh token expired');
        }

        // Get user
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, storedToken.userId),
        });

        if (!user) {
          throw new UnauthorizedError('User not found');
        }

        // Get org
        const org = await db.query.organizations.findFirst({
          where: eq(schema.organizations.id, user.organizationId),
        });

        if (!org) {
          throw new UnauthorizedError('Organization not found');
        }

        // Revoke old token
        await db.update(schema.refreshTokens)
          .set({ revoked: true })
          .where(eq(schema.refreshTokens.id, storedToken.id));

        // Generate new tokens
        const payload = {
          sub: user.id,
          email: user.email,
          orgId: user.organizationId,
          role: user.role,
          plan: org.plan,
        };

        const newAccessToken = fastify.jwt.sign(payload);
        const newRefreshToken = crypto.randomUUID();
        const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

        await db.insert(schema.refreshTokens).values({
          userId: user.id,
          tokenHash: newTokenHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };
      } catch (error) {
        if (error instanceof UnauthorizedError) throw error;
        throw new UnauthorizedError('Invalid refresh token');
      }
    },

    async forgotPassword(email: string) {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      if (!user) return; // Do not reveal existence

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await db.insert(schema.passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetLink);
    },

    async resetPassword(token: string, newPassword: string) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const resetToken = await db.query.passwordResetTokens.findFirst({
        where: and(
          eq(schema.passwordResetTokens.tokenHash, tokenHash),
          eq(schema.passwordResetTokens.used, false)
        )
      });

      if (!resetToken || resetToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired reset token');
      }

      // Validate password
      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
         throw new UnauthorizedError('Password does not meet requirements'); // or ValidationError
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await db.transaction(async (tx) => {
        // Update user
        await tx.update(schema.users)
          .set({ passwordHash })
          .where(eq(schema.users.id, resetToken.userId));

        // Mark reset token used
        await tx.update(schema.passwordResetTokens)
          .set({ used: true })
          .where(eq(schema.passwordResetTokens.id, resetToken.id));

        // Revoke all refresh tokens
        await tx.update(schema.refreshTokens)
          .set({ revoked: true })
          .where(eq(schema.refreshTokens.userId, resetToken.userId));
      });
    }
  };
}
