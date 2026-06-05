/**
 * Raw `ws` server on CALL_WORKER_PORT/voice/:callJobId.
 *
 * On upgrade, validates the callJobId against the Call collection and
 * instantiates a CallSession that owns the audio loop (VAD → STT → LLM →
 * ElevenLabs streaming TTS, with barge-in). The default session-builder is
 * sessionRegistry.buildSession; tests can swap in a fake via setSessionBuilder.
 */

import { createServer, type IncomingMessage, type Server } from 'node:http';

import { WebSocketServer, type WebSocket } from 'ws';

import { Call } from '../models/call.js';
import { env } from '../config.js';
import { log } from '../logger.js';
import { CallSession } from '../session/CallSession.js';
import { buildSession as defaultBuildSession } from '../session/sessionRegistry.js';

interface MediaStreamMessage {
  event: 'connected' | 'start' | 'media' | 'stop' | 'mark';
  streamSid?: string;
  start?: { streamSid: string; callSid: string };
  media?: { payload: string; track?: 'inbound' | 'outbound'; timestamp?: string };
}

export type SessionBuilder = (opts: {
  twilioWs: WebSocket;
  callJobId: string;
}) => Promise<CallSession | null>;

let activeBuilder: SessionBuilder = defaultBuildSession;

/** Tests override the builder (e.g. with stub providers). */
export function setSessionBuilder(b: SessionBuilder): void {
  activeBuilder = b;
}

export function resetSessionBuilder(): void {
  activeBuilder = defaultBuildSession;
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
    void bind(ws, callJobId);
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

async function bind(ws: WebSocket, callJobId: string): Promise<void> {
  let session: CallSession | null = null;
  try {
    session = await activeBuilder({ twilioWs: ws, callJobId });
  } catch (err) {
    log().error({ err, callJobId }, 'session build failed');
  }
  if (!session) {
    log().warn({ callJobId }, 'no session built; closing');
    try {
      ws.close(1011);
    } catch {
      /* noop */
    }
    return;
  }

  const s = session;
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as MediaStreamMessage;
      void s.handleMessage(msg);
    } catch (err) {
      log().warn({ err, callJobId }, 'malformed media message');
    }
  });
  ws.on('close', (code) => {
    log().info({ callJobId, code }, 'media stream closed');
    void s.hangup('twilio_close');
  });
  ws.on('error', (err) => log().error({ err, callJobId }, 'media stream error'));
}
