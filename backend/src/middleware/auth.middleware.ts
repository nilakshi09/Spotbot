import { FastifyInstance, FastifyRequest } from 'fastify';
import { UnauthorizedError } from './error-handler.js';

export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  role: string;
  plan: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

export async function verifyAccessToken(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}
