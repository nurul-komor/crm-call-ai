/**
 * Publish real-time call events to the api process via Redis pub/sub.
 * The api process subscribes to `socket:company:<companyId>` and forwards to
 * its Socket.IO room.
 */

import { redis } from './redis.js';

export interface CallEvent {
  type: 'call.started' | 'call.turn' | 'call.ended' | 'call.failed';
  callId?: string;
  callJobId: string;
  role?: 'agent' | 'customer';
  text?: string;
  status?: string;
  at?: string;
}

export async function publishCallEvent(companyId: string, event: CallEvent): Promise<void> {
  await redis().publish(`socket:company:${companyId}`, JSON.stringify(event));
}
