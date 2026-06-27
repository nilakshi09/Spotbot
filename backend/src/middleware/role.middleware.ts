import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './error-handler.js';

// Middleware to require admin role
export async function requireAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (req.user?.role !== 'admin') {
    throw new AppError(
      403,
      'This action requires admin permissions',
      'FORBIDDEN'
    );
  }
}

// Middleware to require specific role
export function requireRole(role: 'admin' | 'member') {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (req.user?.role !== role && req.user?.role !== 'admin') {
      throw new AppError(
        403,
        `This action requires ${role} permissions`,
        'FORBIDDEN'
      );
    }
  };
}
