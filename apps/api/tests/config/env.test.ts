import { describe, it, expect } from 'vitest';

import { loadEnv } from '../../src/config/env.js';

const validEnv = {
  NODE_ENV: 'test',
  BACKEND_PORT: '4000',
  API_BASE_URL: 'http://localhost:4000',
  APP_BASE_URL: 'http://localhost:5173',
  MONGO_URI: 'mongodb://localhost:27017/test',
  REDIS_URL: 'redis://localhost:6379',
  BULLMQ_PREFIX: 'vf',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '30d',
  PASSWORD_RESET_TTL: '1h',
  BCRYPT_ROUNDS: '12',
  ENCRYPTION_MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
  ENCRYPTION_KEY_VERSION: '1',
  CORS_ORIGINS: 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: '60000',
  RATE_LIMIT_MAX: '300',
  STORAGE_DRIVER: 'local',
  LOCAL_STORAGE_DIR: './data/storage',
  SIGNED_URL_TTL_SEC: '900',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_FROM: 'noreply@example.com',
  LOG_LEVEL: 'info',
  TWILIO_AMD_MODE: 'DetectMessageEnd',
  ELEVENLABS_MODEL: 'eleven_flash_v2_5',
  ELEVENLABS_OUTPUT_FORMAT: 'ulaw_8000',
  ELEVENLABS_OPTIMIZE_LATENCY: '3',
  DEFAULT_AI_PROVIDER: 'openai',
  DEFAULT_AI_MODEL: 'gpt-4o-mini',
  OPENAI_STT_MODEL: 'gpt-4o-transcribe',
} as const;

describe('loadEnv', () => {
  it('parses a fully-specified env into a typed object', () => {
    const env = loadEnv(validEnv);
    expect(env.BACKEND_PORT).toBe(4000);
    expect(env.BCRYPT_ROUNDS).toBe(12);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173']);
    expect(Buffer.from(env.ENCRYPTION_MASTER_KEY, 'base64').length).toBe(32);
  });

  it('throws with a useful message when a required key is missing', () => {
    const partial = { ...validEnv, JWT_ACCESS_SECRET: undefined } as unknown as Record<
      string,
      string
    >;
    expect(() => loadEnv(partial)).toThrowError(/JWT_ACCESS_SECRET/);
  });

  it('rejects a too-short JWT secret', () => {
    expect(() => loadEnv({ ...validEnv, JWT_ACCESS_SECRET: 'short' })).toThrowError(/at least/i);
  });

  it('rejects an ENCRYPTION_MASTER_KEY that is not 32 bytes after base64 decode', () => {
    expect(() =>
      loadEnv({ ...validEnv, ENCRYPTION_MASTER_KEY: Buffer.alloc(16).toString('base64') }),
    ).toThrowError(/32 bytes/);
  });
});
