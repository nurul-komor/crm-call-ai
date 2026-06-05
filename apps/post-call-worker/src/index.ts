import mongoose from 'mongoose';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { QUEUE_NAMES, PostCallJobSchema } from '@voiceflow/shared-types';

import { env } from './config.js';
import { log } from './logger.js';
import { processCall } from './processCall.js';

async function main(): Promise<void> {
  const e = env();
  await mongoose.connect(e.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  const connection = new Redis(e.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });

  const worker = new Worker(
    QUEUE_NAMES.postCall,
    async (job) => {
      const parsed = PostCallJobSchema.parse(job.data);
      await processCall(parsed.callId);
    },
    {
      prefix: e.BULLMQ_PREFIX,
      connection,
      concurrency: e.POST_CALL_WORKER_CONCURRENCY,
    },
  );
  worker.on('failed', (job, err) => log().error({ jobId: job?.id, err }, 'post-call job failed'));
  worker.on('completed', (job) => log().debug({ jobId: job.id }, 'post-call complete'));
  log().info({ concurrency: e.POST_CALL_WORKER_CONCURRENCY }, 'post-call-worker ready');
}

main().catch((err) => {
  log().fatal({ err }, 'post-call-worker failed to start');
  process.exit(1);
});
