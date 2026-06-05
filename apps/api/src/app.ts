import express, { type Express, Router } from 'express';

import { AppError } from './lib/errors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import {
  corsMiddleware,
  helmetMiddleware,
  rateLimitMiddleware,
} from './middleware/security.js';
import { authRouter } from './modules/auth/routes.js';

export interface AppOptions {
  /** Disable rate limiting in tests. */
  disableRateLimit?: boolean;
}

export function createApp(opts: AppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(helmetMiddleware);
  app.use(corsMiddleware());
  if (!opts.disableRateLimit) app.use(rateLimitMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));

  const v1 = Router();
  v1.get('/health', (_req, res) => res.json({ status: 'ok' }));
  v1.use('/auth', authRouter);
  app.use('/api/v1', v1);

  app.use((req, _res, next) => next(new AppError('not_found', `Route not found: ${req.method} ${req.path}`, 404)));
  app.use(errorHandler);

  return app;
}
