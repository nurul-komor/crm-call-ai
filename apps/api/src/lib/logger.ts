import { pino, type Logger } from 'pino';

import { env } from '../config/env.js';

let rootLogger: Logger | undefined;

export function logger(): Logger {
  if (rootLogger) return rootLogger;
  const e = env();
  rootLogger = pino({
    level: e.LOG_LEVEL,
    base: { app: 'api' },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.apiKey',
        '*.passwordHash',
        '*.JWT_ACCESS_SECRET',
        '*.JWT_REFRESH_SECRET',
        '*.ENCRYPTION_MASTER_KEY',
      ],
      censor: '[REDACTED]',
    },
    transport:
      e.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, singleLine: false } }
        : undefined,
  });
  return rootLogger;
}
