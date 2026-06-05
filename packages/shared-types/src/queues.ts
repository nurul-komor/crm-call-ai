import { z } from 'zod';

export const QUEUE_NAMES = {
  call: 'call',
  postCall: 'post-call',
  recording: 'recording',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Shape of a job pushed to the `call` queue. */
export const CallJobSchema = z.object({
  /** Our own identifier — passed in TwiML URL + WS path so the worker can
   *  bind the incoming media stream to in-process job state. */
  callJobId: z.string().min(1),
  companyId: z.string().regex(/^[a-f0-9]{24}$/i),
  campaignId: z.string().regex(/^[a-f0-9]{24}$/i),
  campaignRunId: z.string().regex(/^[a-f0-9]{24}$/i),
  customerId: z.string().regex(/^[a-f0-9]{24}$/i),
  contactChannelId: z.string().regex(/^[a-f0-9]{24}$/i),
  retryCount: z.number().int().min(0).default(0),
});
export type CallJob = z.infer<typeof CallJobSchema>;

export const PostCallJobSchema = z.object({
  callId: z.string().regex(/^[a-f0-9]{24}$/i),
  companyId: z.string().regex(/^[a-f0-9]{24}$/i),
});
export type PostCallJob = z.infer<typeof PostCallJobSchema>;

export const RecordingJobSchema = z.object({
  callId: z.string().regex(/^[a-f0-9]{24}$/i),
  companyId: z.string().regex(/^[a-f0-9]{24}$/i),
  inboundPath: z.string().min(1),
  outboundPath: z.string().min(1),
});
export type RecordingJob = z.infer<typeof RecordingJobSchema>;
