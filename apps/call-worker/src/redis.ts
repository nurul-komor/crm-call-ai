import { Redis } from 'ioredis';

import { env } from './config.js';
import { log } from './logger.js';

let _redis: Redis | undefined;

export function redis(): Redis {
  if (_redis) return _redis;
  const r = new Redis(env().REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: null,
  });
  r.on('error', (err) => log().error({ err }, 'redis error'));
  r.on('ready', () => log().info('redis ready'));
  _redis = r;
  return r;
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = undefined;
  }
}
