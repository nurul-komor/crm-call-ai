const FILLED = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  MONGO_URI: 'mongodb://localhost:27017/voiceflow_worker_test',
  REDIS_URL: 'redis://localhost:6379',
  CALL_WORKER_PORT: '0',
  TWILIO_MEDIA_STREAM_WS_HOST: 'localhost',
} as const;

for (const [k, v] of Object.entries(FILLED)) {
  if (process.env[k] === undefined) process.env[k] = v;
}

export {};
