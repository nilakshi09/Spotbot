import type { FastifyRequest } from 'fastify';
import { AppError } from './error-handler.js';

// Middleware to require admin role
export async function requireAdmin(request: FastifyRequest): Promise<void> {
  if (request.user?.role !== 'admin') {
    throw new AppError(
      403,
      'This action requires admin permissions',
      'FORBIDDEN'
    );
  }
}

// Middleware to require specific role
export function requireRole(role: 'admin' | 'member' | 'system') {
  return async (request: FastifyRequest): Promise<void> => {
    if (request.user?.role !== role && request.user?.role !== 'admin') {
      throw new AppError(
        403,
        `This action requires ${role} permissions`,
        'FORBIDDEN'
      );
    }
  };
}
