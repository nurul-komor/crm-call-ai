import { randomUUID } from 'node:crypto';

import { Queue } from 'bullmq';

import { QUEUE_NAMES, type CallJob, type PostCallJob } from '@voiceflow/shared-types';

import { env } from '../config/env.js';
import { getRedis } from './redis.js';

let _callQueue: Queue<CallJob> | undefined;
let _postCallQueue: Queue<PostCallJob> | undefined;

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

export function postCallQueue(): Queue<PostCallJob> {
  if (_postCallQueue) return _postCallQueue;
  _postCallQueue = new Queue<PostCallJob>(QUEUE_NAMES.postCall, {
    prefix: env().BULLMQ_PREFIX,
    connection: getRedis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 86_400 },
      removeOnFail: { age: 7 * 86_400 },
    },
  });
  return _postCallQueue;
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

export async function enqueuePostCall(job: PostCallJob): Promise<void> {
  await postCallQueue().add(QUEUE_NAMES.postCall, job, { jobId: job.callId });
}

export async function closeQueues(): Promise<void> {
  if (_callQueue) {
    await _callQueue.close();
    _callQueue = undefined;
  }
  if (_postCallQueue) {
    await _postCallQueue.close();
    _postCallQueue = undefined;
  }
}
