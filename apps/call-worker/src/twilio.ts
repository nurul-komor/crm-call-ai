import twilio from 'twilio';

import { env } from './config.js';

let _client: ReturnType<typeof twilio> | undefined;

export function twilioClient(): ReturnType<typeof twilio> {
  if (_client) return _client;
  const e = env();
  if (!e.TWILIO_ACCOUNT_SID || !e.TWILIO_AUTH_TOKEN) {
    throw new Error('TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN not configured');
  }
  _client = twilio(e.TWILIO_ACCOUNT_SID, e.TWILIO_AUTH_TOKEN);
  return _client;
}
