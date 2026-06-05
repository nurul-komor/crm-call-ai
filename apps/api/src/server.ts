import { env } from './config/env.js';
import { connectMongo } from './lib/mongo.js';
import { getRedis } from './lib/redis.js';
import { logger } from './lib/logger.js';
import { createApp } from './app.js';

async function main(): Promise<void> {
  const e = env();
  await connectMongo();
  getRedis(); // initialize singleton
  const app = createApp();
  app.listen(e.BACKEND_PORT, () =>
    logger().info({ port: e.BACKEND_PORT, env: e.NODE_ENV }, 'api listening'),
  );
}

main().catch((err) => {
  logger().fatal({ err }, 'api failed to start');
  process.exit(1);
});
