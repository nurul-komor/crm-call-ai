import { z } from 'zod';

const csv = z
  .string()
  .min(1)
  .transform((s) => s.split(',').map((v) => v.trim()).filter(Boolean));

const base64ThirtyTwo = z
  .string()
  .min(1, 'ENCRYPTION_MASTER_KEY is required')
  .refine(
    (s) => {
      try {
        return Buffer.from(s, 'base64').length === 32;
      } catch {
        return false;
      }
    },
    { message: 'ENCRYPTION_MASTER_KEY must decode to 32 bytes (base64-encoded 256-bit key)' },
  );

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  APP_BASE_URL: z.string().url().default('http://localhost:5173'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  BULLMQ_PREFIX: z.string().min(1).default('vf'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  PASSWORD_RESET_TTL: z.string().default('1h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(20).default(12),

  ENCRYPTION_MASTER_KEY: base64ThirtyTwo,
  ENCRYPTION_KEY_VERSION: z.coerce.number().int().min(1).default(1),

  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_WEBHOOK_BASE_URL: z.string().optional().default(''),
  TWILIO_AMD_MODE: z
    .enum(['Enable', 'DetectMessageEnd'])
    .default('DetectMessageEnd'),

  ELEVENLABS_API_KEY: z.string().optional().default(''),
  ELEVENLABS_MODEL: z.string().default('eleven_flash_v2_5'),
  ELEVENLABS_OUTPUT_FORMAT: z.string().default('ulaw_8000'),
  ELEVENLABS_OPTIMIZE_LATENCY: z.coerce.number().int().min(0).max(4).default(3),

  OPENAI_API_KEY: z.string().optional().default(''),
  DEFAULT_AI_PROVIDER: z.enum(['openai', 'claude', 'gemini', 'openrouter']).default('openai'),
  DEFAULT_AI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_STT_MODEL: z.string().default('gpt-4o-transcribe'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./data/storage'),
  SIGNED_URL_TTL_SEC: z.coerce.number().int().positive().default(900),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('VoiceFlow AI <noreply@voiceflow.ai>'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  CORS_ORIGINS: csv.default('http://localhost:5173'),

  CALL_WORKER_PORT: z.coerce.number().int().positive().default(4100),
  CALL_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(25),
  CALL_WORKER_MAX_CALL_SEC: z.coerce.number().int().positive().default(900),
  POST_CALL_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(10),
  RECORDING_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  PER_COMPANY_MAX_CONCURRENT: z.coerce.number().int().positive().default(50),
  TWILIO_ORIGINATION_RPS: z.coerce.number().positive().default(1),
  TWILIO_MEDIA_STREAM_WS_HOST: z.string().optional().default(''),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

let cached: Env | undefined;
export function env(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}
