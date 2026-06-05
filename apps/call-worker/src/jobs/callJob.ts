import { Worker, type Job } from 'bullmq';

import { QUEUE_NAMES, type CallJob } from '@voiceflow/shared-types';

import { env } from '../config.js';
import { log } from '../logger.js';
import { redis } from '../redis.js';
import { ConcurrencyGate } from '../concurrency.js';
import { Call, ContactChannel, Customer } from '../models/call.js';
import { twilioClient } from '../twilio.js';

/** Start the BullMQ consumer for the `call` queue. */
export function startCallConsumer(): Worker<CallJob> {
  const gate = new ConcurrencyGate(redis());

  const worker = new Worker<CallJob>(
    QUEUE_NAMES.call,
    async (job) => processCallJob(job, gate),
    {
      prefix: env().BULLMQ_PREFIX,
      connection: redis(),
      concurrency: env().CALL_WORKER_CONCURRENCY,
    },
  );

  worker.on('failed', (job, err) =>
    log().error({ jobId: job?.id, err }, 'call job failed'),
  );
  worker.on('completed', (job) => log().info({ jobId: job.id }, 'call job completed'));
  return worker;
}

async function processCallJob(job: Job<CallJob>, gate: ConcurrencyGate): Promise<void> {
  const { callJobId, companyId, contactChannelId, customerId } = job.data;

  // Concurrency gate: per-company cap and origination RPS.
  const release = await gate.acquireOriginationSlot(companyId);
  if (!release) {
    // Defer this job by 1s and let another worker pick it up.
    throw new Error('per-company concurrency exhausted, will retry');
  }

  try {
    while (!(await gate.tryConsumeOriginationToken())) {
      await sleep(1000);
    }

    const [channel, customer] = await Promise.all([
      ContactChannel.findById(contactChannelId).lean(),
      Customer.findById(customerId).lean(),
    ]);
    if (!channel) throw new Error(`channel ${contactChannelId} not found`);
    if (!customer?.phone) throw new Error(`customer ${customerId} has no phone`);

    const tw = twilioClient();
    const e = env();
    const base = e.TWILIO_WEBHOOK_BASE_URL || e.API_BASE_URL;
    const created = await tw.calls.create({
      to: customer.phone,
      from: channel.number,
      url: `${base}/twiml/voice/${callJobId}`,
      statusCallback: `${base}/twiml/status/${callJobId}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: e.TWILIO_AMD_MODE,
    });

    await Call.updateOne(
      { callJobId },
      { $set: { callSid: created.sid, status: 'initiated', startedAt: new Date() } },
    );
    log().info({ callJobId, callSid: created.sid, to: customer.phone }, 'call originated');
  } catch (err) {
    await Call.updateOne(
      { callJobId },
      {
        $set: {
          status: 'failed',
          error: {
            code: 'originate_failed',
            message: err instanceof Error ? err.message : String(err),
          },
        },
      },
    );
    throw err;
  } finally {
    await release();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
