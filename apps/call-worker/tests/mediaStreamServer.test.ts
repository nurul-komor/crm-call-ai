import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Call } from '../src/models/call.js';
import { startMediaStreamServer } from '../src/ws/mediaStreamServer.js';

let mongod: MongoMemoryReplSet;
let server: Server;

beforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
  process.env.CALL_WORKER_PORT = '0';
  server = startMediaStreamServer();
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
}, 60_000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  await mongod.stop();
});

function port(): number {
  return (server.address() as AddressInfo).port;
}

describe('media stream server', () => {
  it('rejects an upgrade to an unknown callJobId with 404', async () => {
    const ws = new WebSocket(`ws://localhost:${port()}/voice/does-not-exist`);
    await new Promise<void>((resolve) => {
      ws.on('unexpected-response', (_req, res) => {
        expect(res.statusCode).toBe(404);
        resolve();
      });
      ws.on('open', () => {
        ws.close();
        throw new Error('should not have opened');
      });
    });
  });

  it('accepts an upgrade for a known callJobId and handles start/stop', async () => {
    const callJobId = 'job-abc';
    await Call.create({
      companyId: new mongoose.Types.ObjectId(),
      campaignId: new mongoose.Types.ObjectId(),
      campaignRunId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(),
      contactChannelId: new mongoose.Types.ObjectId(),
      callJobId,
      status: 'initiated',
    });

    const ws = new WebSocket(`ws://localhost:${port()}/voice/${callJobId}`);
    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            event: 'start',
            start: { streamSid: 'MZx', callSid: 'CAx' },
          }),
        );
        // Send a few media frames + stop
        ws.send(JSON.stringify({ event: 'media', media: { payload: 'AAAA' } }));
        ws.send(JSON.stringify({ event: 'stop' }));
      });
      ws.on('close', (code) => {
        expect(code).toBe(1000);
        resolve();
      });
      ws.on('error', reject);
    });
  });
});
