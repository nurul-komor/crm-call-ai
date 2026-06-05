import { z } from 'zod';

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  BULLMQ_PREFIX: z.string().default('vf'),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .min(1)
    .refine((s) => Buffer.from(s, 'base64').length === 32, '32-byte base64 key required'),
  POST_CALL_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof Schema>;
let cached: Env | undefined;
export function env(): Env {
  if (cached) return cached;
  const r = Schema.safeParse(process.env);
  if (!r.success) {
    throw new Error(
      'Invalid post-call-worker env:\n' +
        r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'),
    );
  }
  cached = r.data;
  return cached;
}
