import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createAuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';

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
}
