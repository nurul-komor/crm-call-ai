import { pino, type Logger } from 'pino';

import { env } from './config.js';

let _log: Logger | undefined;

export function log(): Logger {
  if (_log) return _log;
  _log = pino({
    level: env().LOG_LEVEL,
    base: { app: 'call-worker' },
    transport:
      env().NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });
  return _log;
}
