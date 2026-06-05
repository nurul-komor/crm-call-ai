/**
 * Raw `ws` server on CALL_WORKER_PORT/voice/:callJobId.
 *
 * Phase 1L-1N scaffold: accepts the upgrade, looks up the Call by callJobId,
 * logs the inbound 'start' event, then idles until the stream closes.
 * Phase 1O–1S will plug the CallSession state machine in here (VAD, STT,
 * LLM, TTS, barge-in, recording).
 */

import { createServer, type IncomingMessage, type Server } from 'node:http';

import { WebSocketServer, type WebSocket } from 'ws';

import { Call } from '../models/call.js';
import { env } from '../config.js';
import { log } from '../logger.js';

interface MediaStreamMessage {
  event: 'connected' | 'start' | 'media' | 'stop' | 'mark';
  streamSid?: string;
  start?: { streamSid: string; callSid: string };
  media?: { payload: string; track?: 'inbound' | 'outbound'; timestamp?: string };
}

export function startMediaStreamServer(): Server {
  const httpServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    handleUpgrade(req, socket as never, head, wss).catch((err) => {
      log().error({ err }, 'upgrade handler failed');
      try {
        socket.destroy();
      } catch {
        /* noop */
      }
    });
  });

  wss.on('connection', (ws, req) => {
    const callJobId = extractCallJobId(req.url ?? '');
    log().info({ callJobId }, 'media stream connected');
    bindCallSession(ws, callJobId);
  });

  const port = env().CALL_WORKER_PORT;
  httpServer.listen(port, () =>
    log().info({ port }, 'call-worker WebSocket server listening'),
  );
  return httpServer;
}

async function handleUpgrade(
  req: IncomingMessage,
  socket: import('node:net').Socket,
  head: Buffer,
  wss: WebSocketServer,
): Promise<void> {
  const callJobId = extractCallJobId(req.url ?? '');
  if (!callJobId) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }
  const call = await Call.findOne({ callJobId }).lean();
  if (!call) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
}

function extractCallJobId(url: string): string {
  const match = /^\/voice\/([^/?]+)/.exec(url);
  return match?.[1] ?? '';
}

function bindCallSession(ws: WebSocket, callJobId: string): void {
  let mediaCount = 0;
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as MediaStreamMessage;
      if (msg.event === 'start') {
        log().info(
          { callJobId, streamSid: msg.start?.streamSid, callSid: msg.start?.callSid },
          'media stream start',
        );
        // Phase 1O–1S: instantiate CallSession here and pipe inbound media to VAD/STT.
      } else if (msg.event === 'media') {
        mediaCount++;
        if (mediaCount % 250 === 0) {
          log().debug({ callJobId, mediaFrames: mediaCount }, 'media stream progress');
        }
      } else if (msg.event === 'stop') {
        log().info({ callJobId, totalFrames: mediaCount }, 'media stream stop');
        ws.close(1000);
      }
    } catch (err) {
      log().warn({ err, callJobId }, 'malformed media message');
    }
  });
  ws.on('close', (code) => log().info({ callJobId, code }, 'media stream closed'));
  ws.on('error', (err) => log().error({ err, callJobId }, 'media stream error'));
}
