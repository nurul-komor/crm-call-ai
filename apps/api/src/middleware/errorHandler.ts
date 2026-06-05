import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { AppError, type ErrorCode } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError('not_found', `Route not found: ${req.method} ${req.path}`, 404));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const reqId = req.id;
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        requestId: reqId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error' satisfies ErrorCode,
        message: 'Request validation failed',
        details: err.flatten(),
        requestId: reqId,
      },
    });
    return;
  }

  logger().error({ err, reqId }, 'unhandled error');
  res.status(500).json({
    error: {
      code: 'internal_error' satisfies ErrorCode,
      message:
        env().NODE_ENV === 'production'
          ? 'Something went wrong'
          : err instanceof Error
            ? err.message
            : 'Unknown error',
      requestId: reqId,
    },
  });
};
