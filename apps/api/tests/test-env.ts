// Shared test bootstrap — populates process.env with a valid config
// before any module that calls env() is imported. Vitest loads test
// files in isolation per-suite, so importing this at the top of each
// test file is enough.

const FILLED = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  BACKEND_PORT: '4000',
  API_BASE_URL: 'http://localhost:4000',
  APP_BASE_URL: 'http://localhost:5173',
  MONGO_URI: 'mongodb://localhost:27017/voiceflow_test',
  REDIS_URL: 'redis://localhost:6379',
  BULLMQ_PREFIX: 'vf_test',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '30d',
  PASSWORD_RESET_TTL: '1h',
  BCRYPT_ROUNDS: '4',
  ENCRYPTION_MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
  ENCRYPTION_KEY_VERSION: '1',
  CORS_ORIGINS: 'http://localhost:5173,http://allowed.test',
  RATE_LIMIT_WINDOW_MS: '60000',
  RATE_LIMIT_MAX: '300',
} as const;

for (const [k, v] of Object.entries(FILLED)) {
  if (process.env[k] === undefined) process.env[k] = v;
}

export {};
