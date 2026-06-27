import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createAuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { teamService } from '../services/team.service.js';
import { db } from '../db/client.js';
import { users } from '../db/schema/users.js';
import { organizations } from '../db/schema/organizations.js';
import { eq } from 'drizzle-orm';
import { googleOAuthService } from '../services/google-oauth.service.js';
import { AppError } from '../middleware/error-handler.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export default async function authRoutes(app: FastifyInstance) {
  const authService = createAuthService(app);

  app.post('/signup', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
  }, async (request, reply) => {
    const data = signupSchema.parse(request.body);
    const result = await authService.signup(data.email, data.password, data.name);
    
    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  });

  app.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
  }, async (request, reply) => {
    const data = loginSchema.parse(request.body);
    const result = await authService.login(data.email, data.password);

    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  });

  app.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
    }

    const result = await authService.refresh(refreshToken);

    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return {
      accessToken: result.accessToken,
    };
  });

  app.post('/forgot-password', async (request, reply) => {
    const data = forgotPasswordSchema.parse(request.body);
    await authService.forgotPassword(data.email);
    return { message: 'If an account exists, a reset link has been sent' };
  });

  app.post('/reset-password', async (request, reply) => {
    const data = resetPasswordSchema.parse(request.body);
    await authService.resetPassword(data.token, data.password);
    return { message: 'Password has been reset' };
  });

  app.post('/logout', async (request, reply) => {
    reply.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return { message: 'Logged out' };
  });

  // GET /api/auth/invite/:token
  // Get invitation details before accepting
  // No auth required
  app.get('/invite/:token', async (req, reply) => {
    const { token } = z.object({ token: z.string().length(64) }).parse(req.params);
    const details = await teamService.getInvitationDetails(token);
    return reply.send(details);
  });

  // POST /api/auth/invite/accept
  // Accept invitation and create account
  // No auth required
  app.post('/invite/accept', async (req, reply) => {
    const { token, name, password } = z.object({
      token: z.string().length(64),
      name: z.string().min(2).max(100),
      password: z.string().min(8),
    }).parse(req.body);

    const result = await teamService.acceptInvitation(token, name, password);

    // If new user, auto-login and return tokens
    if (result.isNewUser) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, result.userId),
      });
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, user!.organizationId),
      });

      const tokens = await authService.generateTokenPair(user!, org!);

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return reply.send({
        accessToken: tokens.accessToken,
        user: tokens.user,
        isNewUser: true,
        redirectTo: '/dashboard',
      });
    }

    // Existing user — redirect to login
    return reply.send({
      isNewUser: false,
      redirectTo: '/login?invited=true',
    });
  });

  app.get('/google', async (req, reply) => {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError(
        501,
        'Google OAuth is not configured',
        'GOOGLE_AUTH_NOT_CONFIGURED'
      );
    }

    const redirectUri = `${env.BACKEND_URL ?? 'http://localhost:8000'}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    return reply.redirect(googleAuthUrl);
  });

  app.get('/google/callback', async (req, reply) => {
    const { code, error } = req.query as {
      code?: string;
      error?: string;
    };

    const redirectUri = `${env.BACKEND_URL ?? 'http://localhost:8000'}/api/auth/google/callback`;

    if (error) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=google_denied`);
    }

    if (!code) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=google_failed`);
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = (await tokenResponse.json()) as any;

      if (!tokenData.access_token) {
        throw new Error('No access token received from Google');
      }

      const result = await googleOAuthService.handleCallback(
        tokenData.access_token,
        authService
      );

      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: String(result.isNewUser),
      });

      return reply.redirect(`${env.FRONTEND_URL}/auth/google/success?${params}`);
    } catch (err: any) {
      req.log.error({ err }, 'Google OAuth callback failed');
      return reply.redirect(`${env.FRONTEND_URL}/login?error=google_failed`);
    }
  });
}

