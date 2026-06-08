import cors from 'cors';
import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { AppError } from '../lib/errors.js';

import { env } from '../config/env.js';

export function corsMiddleware(): RequestHandler {
  const { CORS_ORIGINS: origins, NODE_ENV } = env();
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / curl / server-to-server
      if (NODE_ENV === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return cb(null, true); // allow any localhost port in dev
      }
      if (origins.includes(origin)) return cb(null, true);
      return cb(new AppError('forbidden', 'CORS: origin not allowed', 403));
    },
    credentials: true,
  });
}

export const helmetMiddleware = helmet({
  crossOriginEmbedderPolicy: false,
});

export function rateLimitMiddleware(): RequestHandler {
  const e = env();
  return rateLimit({
    windowMs: e.RATE_LIMIT_WINDOW_MS,
    max: e.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'rate_limited', message: 'Too many requests' },
      });
    },
  });
}
