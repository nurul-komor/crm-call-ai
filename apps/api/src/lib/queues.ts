import { randomUUID } from 'node:crypto';

import { Queue } from 'bullmq';

import { QUEUE_NAMES, type CallJob } from '@voiceflow/shared-types';

import { env } from '../config/env.js';
import { getRedis } from './redis.js';

let _callQueue: Queue<CallJob> | undefined;

export function callQueue(): Queue<CallJob> {
  if (_callQueue) return _callQueue;
  _callQueue = new Queue<CallJob>(QUEUE_NAMES.call, {
    prefix: env().BULLMQ_PREFIX,
    connection: getRedis(),
    defaultJobOptions: {
      attempts: 1, // calls don't retry at job level; campaign retryRules handle it
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86_400 },
    },
  });
  return _callQueue;
}

export function newCallJobId(): string {
  return randomUUID();
}

export async function enqueueCall(job: CallJob, opts: { delayMs?: number } = {}): Promise<void> {
  await callQueue().add(QUEUE_NAMES.call, job, {
    jobId: job.callJobId,
    delay: opts.delayMs,
  });
}

export async function closeQueues(): Promise<void> {
  if (_callQueue) {
    await _callQueue.close();
    _callQueue = undefined;
  }
}
