import { env } from './config.js';
import { startCallConsumer } from './jobs/callJob.js';
import { log } from './logger.js';
import { connect as connectMongo } from './mongo.js';
import { redis } from './redis.js';
import { startMediaStreamServer } from './ws/mediaStreamServer.js';

async function main(): Promise<void> {
  const e = env();
  await connectMongo();
  redis();
  startMediaStreamServer();
  startCallConsumer();
  log().info(
    {
      port: e.CALL_WORKER_PORT,
      concurrency: e.CALL_WORKER_CONCURRENCY,
    },
    'call-worker ready',
  );
}

main().catch((err) => {
  log().fatal({ err }, 'call-worker failed to start');
  process.exit(1);
});
