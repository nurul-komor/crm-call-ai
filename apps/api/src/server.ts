import http from 'node:http';

import { env } from './config/env.js';
import { connectMongo } from './lib/mongo.js';
import { getRedis } from './lib/redis.js';
import { logger } from './lib/logger.js';
import { startSocketServer } from './lib/socket.js';
import { createApp } from './app.js';
import { bullDispatcher } from './modules/campaigns/bullDispatcher.js';
import { setDispatcher } from './modules/campaigns/dispatcher.js';

async function main(): Promise<void> {
  const e = env();
  await connectMongo();
  getRedis();
  setDispatcher(bullDispatcher);

  const app = createApp();
  const server = http.createServer(app);
  await startSocketServer(server);

  server.listen(e.BACKEND_PORT, () =>
    logger().info({ port: e.BACKEND_PORT, env: e.NODE_ENV }, 'api listening (+ socket.io)'),
  );
}

main().catch((err) => {
  logger().fatal({ err }, 'api failed to start');
  process.exit(1);
});
