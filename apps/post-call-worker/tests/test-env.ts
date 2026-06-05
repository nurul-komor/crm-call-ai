const FILLED = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  MONGO_URI: 'mongodb://localhost:27017/voiceflow_pcw_test',
  REDIS_URL: 'redis://localhost:6379',
  ENCRYPTION_MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
} as const;

for (const [k, v] of Object.entries(FILLED)) {
  if (process.env[k] === undefined) process.env[k] = v;
}

export {};
