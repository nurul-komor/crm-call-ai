import cors from 'cors';
import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { env } from '../config/env.js';

export function corsMiddleware(): RequestHandler {
  const origins = env().CORS_ORIGINS;
  return cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / curl
      if (origins.includes(origin)) return cb(null, true);
      return cb(new Error('cors_origin_not_allowed'));
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
