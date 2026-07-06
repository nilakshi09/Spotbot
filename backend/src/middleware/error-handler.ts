import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { captureException } from '../config/sentry.js';
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export function globalErrorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Handle Rate Limit Error from @fastify/rate-limit
  if ('statusCode' in error && error.statusCode === 429) {
    return reply.status(429).send({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: error.message,
      },
    });
  }

  // Zod validation errors (usually handled via preHandler, but catch here too)
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: (error as { issues?: unknown }).issues,
      },
    });
  }

  request.log.error(error);

  if (!(error instanceof AppError) || error.statusCode >= 500) {
    captureException(error, {
      requestId: request.id,
      path: request.url,
      method: request.method,
      userId: (request as FastifyRequest & { user?: { sub?: string } }).user?.sub,
    });
  }

  return reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    },
  });
}
