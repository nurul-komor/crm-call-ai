import { Redis } from 'ioredis';

import { env } from '../config/env.js';
import { logger } from './logger.js';

let client: Redis | undefined;

export function getRedis(): Redis {
  if (client) return client;
  const instance = new Redis(env().REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  instance.on('error', (err) => logger().error({ err }, 'redis error'));
  instance.on('ready', () => logger().info('redis ready'));
  client = instance;
  return instance;
}

export async function closeRedis(): Promise<void> {
  if (!client) return;
  await client.quit();
  client = undefined;
}
