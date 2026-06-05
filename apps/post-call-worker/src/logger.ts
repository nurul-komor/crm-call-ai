import { pino, type Logger } from 'pino';

import { env } from './config.js';

let _l: Logger | undefined;
export function log(): Logger {
  if (_l) return _l;
  _l = pino({
    level: env().LOG_LEVEL,
    base: { app: 'post-call-worker' },
    transport:
      env().NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });
  return _l;
}
