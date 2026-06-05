import { z } from 'zod';

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  BULLMQ_PREFIX: z.string().default('vf'),

  CALL_WORKER_PORT: z.coerce.number().int().min(0).default(4100),
  CALL_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(25),
  CALL_WORKER_MAX_CALL_SEC: z.coerce.number().int().positive().default(900),
  PER_COMPANY_MAX_CONCURRENT: z.coerce.number().int().positive().default(50),
  TWILIO_ORIGINATION_RPS: z.coerce.number().positive().default(1),
  TWILIO_MEDIA_STREAM_WS_HOST: z.string().default(''),

  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_WEBHOOK_BASE_URL: z.string().default(''),
  TWILIO_AMD_MODE: z.enum(['Enable', 'DetectMessageEnd']).default('DetectMessageEnd'),

  API_BASE_URL: z.string().url().default('http://localhost:4000'),
});

export type WorkerEnv = z.infer<typeof Schema>;

let cached: WorkerEnv | undefined;
export function env(): WorkerEnv {
  if (cached) return cached;
  const parsed = Schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid worker environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
