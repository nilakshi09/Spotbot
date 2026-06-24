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
    const payload = await request.jwtVerify<JwtPayload>();
    request.user = {
      sub: payload.sub,
      email: payload.email,
      orgId: payload.orgId,
      role: payload.role,
      plan: payload.plan,
    };
    console.log('JWT verified, req.user:', request.user);
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}
