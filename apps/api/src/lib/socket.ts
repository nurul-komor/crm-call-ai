/**
 * Socket.IO real-time event hub.
 *
 * Clients connect with a Bearer-style JWT in the auth handshake; on connect
 * they're joined to the `company:<companyId>` room. The api process also
 * subscribes to a Redis pub/sub channel `socket:company:<companyId>` so the
 * call-worker can broadcast `call.turn` / `call.started` / `call.ended` events
 * without depending on the api process directly.
 */

import type { Server as HttpServer } from 'node:http';

import { createAdapter } from '@socket.io/redis-adapter';
import { Server as IOServer, type Socket } from 'socket.io';

import { env } from '../config/env.js';
import { AppError } from './errors.js';
import { verifyAccessToken } from './jwt.js';
import { logger } from './logger.js';
import { getRedis } from './redis.js';

let _io: IOServer | undefined;

const PUBSUB_PREFIX = 'socket:company:';

export interface CallEvent {
  type: 'call.started' | 'call.turn' | 'call.ended' | 'call.failed';
  callId?: string;
  callJobId: string;
  role?: 'agent' | 'customer';
  text?: string;
  status?: string;
  at?: string;
}

export async function startSocketServer(httpServer: HttpServer): Promise<IOServer> {
  if (_io) return _io;
  const io = new IOServer(httpServer, {
    cors: { origin: env().CORS_ORIGINS, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter — lets multiple api replicas share the room set.
  const pub = getRedis().duplicate();
  const sub = getRedis().duplicate();
  await Promise.all([pub.connect(), sub.connect()]).catch(() => undefined);
  io.adapter(createAdapter(pub, sub));

  io.use((socket: Socket, next) => {
    try {
      const raw =
        socket.handshake.auth?.token ??
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);
      if (!raw) throw new AppError('unauthenticated', 'missing token', 401);
      const claims = verifyAccessToken(raw);
      socket.data.companyId = claims.cid;
      socket.data.userId = claims.sub;
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  io.on('connection', (socket: Socket) => {
    const room = `company:${socket.data.companyId as string}`;
    socket.join(room);
    socket.emit('connected', { companyId: socket.data.companyId });
    logger().debug({ companyId: socket.data.companyId }, 'socket connected');
  });

  // Bridge: subscribe once per companyId we see traffic for.
  const subscribed = new Set<string>();
  io.on('connection', async (socket: Socket) => {
    const cid = socket.data.companyId as string;
    if (subscribed.has(cid)) return;
    subscribed.add(cid);
    const sub2 = getRedis().duplicate();
    await sub2.subscribe(PUBSUB_PREFIX + cid);
    sub2.on('message', (_channel, message) => {
      try {
        const event = JSON.parse(message) as CallEvent;
        io.to(`company:${cid}`).emit(event.type, event);
      } catch (err) {
        logger().warn({ err }, 'failed to relay pubsub event');
      }
    });
  });

  _io = io;
  return io;
}

/** Publish a call event from anywhere (api, call-worker, etc.). */
export async function publishCallEvent(companyId: string, event: CallEvent): Promise<void> {
  await getRedis().publish(PUBSUB_PREFIX + companyId, JSON.stringify(event));
}
