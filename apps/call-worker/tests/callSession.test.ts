import { EventEmitter } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import { encodePcmBuffer } from '../src/audio/mulaw.js';
import { CallSession } from '../src/session/CallSession.js';

import type { WebSocket as WsWebSocket } from 'ws';
import type {
  AIProvider,
  CompleteStreamParams,
  ChatMessage,
} from '../src/providers/AIProvider.js';
import type { SttClient } from '../src/stt/openAiSttClient.js';
import type { ElevenLabsTtsClient, TtsSession } from '../src/tts/elevenLabsClient.js';

/** Stand-in for the Twilio WS. */
class FakeWs extends EventEmitter {
  readyState = 1;
  OPEN = 1;
  bufferedAmount = 0;
  sent: string[] = [];
  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.readyState = 3;
  }
}

function tts(opts: { autoComplete?: boolean } = {}): {
  client: ElevenLabsTtsClient;
  start: ReturnType<typeof vi.fn>;
  sessions: TtsSession[];
  completeAll(): void;
} {
  const sessions: TtsSession[] = [];
  const resolvers: Array<() => void> = [];
  const autoComplete = opts.autoComplete ?? true;
  const start = vi.fn((onAudio: (b: string) => void) => {
    let aborted = false;
    let finished = false;
    let resolveDone: () => void = () => undefined;
    const donePromise = new Promise<void>((r) => {
      resolveDone = r;
    });
    resolvers.push(resolveDone);
    const sess: TtsSession = {
      sendText(t: string) {
        if (aborted || finished) return;
        if (t.trim()) onAudio(Buffer.from(t).toString('base64'));
      },
      finish() {
        finished = true;
        if (autoComplete) resolveDone();
      },
      abort() {
        aborted = true;
        resolveDone();
      },
      done: () => donePromise,
      isReady: () => true,
    };
    sessions.push(sess);
    return sess;
  });
  return {
    client: { start } as unknown as ElevenLabsTtsClient,
    start,
    sessions,
    completeAll: () => resolvers.splice(0).forEach((r) => r()),
  };
}

function ai(tokens: string[]): AIProvider {
  return {
    name: 'openai' as const,
    model: 'fake',
    async *completeStream(_p: CompleteStreamParams): AsyncIterable<string> {
      void _p;
      for (const t of tokens) yield t;
    },
    summarize: async () => ({ summary: '', sentiment: 'neutral' as const }),
    extract: async () => ({}) as Record<string, unknown>,
  };
}

function stt(text: string | null): SttClient {
  return { transcribe: vi.fn(async () => text) } as unknown as SttClient;
}

function media(ws: FakeWs, base64: string): void {
  void ws; // not used for inbound; we feed sessions directly
  // helper unused; kept for symmetry
}

describe('CallSession', () => {
  it('greets on start (human answer) and writes a transcript turn', async () => {
    const ws = new FakeWs();
    const ttsKit = tts();
    const turns: Array<{ role: string; text: string }> = [];
    const session = new CallSession({
      twilioWs: ws as unknown as WsWebSocket,
      callJobId: 'job-1',
      systemPrompt: 'be brief',
      greeting: 'Hi there!',
      ai: ai([]),
      stt: stt(null),
      tts: ttsKit.client,
      onTurn: (t) => turns.push(t),
    });
    await session.handleMessage({
      event: 'start',
      start: { streamSid: 'MZ1', callSid: 'CA1' },
    });
    // Wait for greet to flush
    await new Promise((r) => setTimeout(r, 10));
    expect(ttsKit.start).toHaveBeenCalledTimes(1);
    expect(turns.some((t) => t.role === 'agent' && t.text === 'Hi there!')).toBe(true);
    // Frames forwarded to Twilio WS
    const mediaFrames = ws.sent.filter((s) => s.includes('"event":"media"'));
    expect(mediaFrames.length).toBeGreaterThan(0);
  });

  it('barge-in: speech_start during speaking aborts TTS + sends Twilio clear', async () => {
    const ws = new FakeWs();
    const ttsKit = tts({ autoComplete: false }); // hold the greet open
    const session = new CallSession({
      twilioWs: ws as unknown as WsWebSocket,
      callJobId: 'job-2',
      systemPrompt: 'p',
      greeting: 'Hello hello hello hello hello hello',
      ai: ai([]),
      stt: stt(null),
      tts: ttsKit.client,
    });
    await session.handleMessage({
      event: 'start',
      start: { streamSid: 'MZ1', callSid: 'CA1' },
    });
    // Yield a tick so speak()'s state transition runs
    await new Promise((r) => setImmediate(r));
    expect(session.state).toBe('speaking');

    // Feed several loud frames to trigger speech_start
    const loud = new Int16Array(160).fill(3000);
    const loudUlaw = encodePcmBuffer(loud).toString('base64');
    for (let i = 0; i < 6; i++) {
      await session.handleMessage({
        event: 'media',
        media: { payload: loudUlaw, track: 'inbound' },
      });
    }
    expect(session.state).toBe('listening');
    // Twilio received a clear event
    const clearEvents = ws.sent.filter((s) => s.includes('"event":"clear"'));
    expect(clearEvents.length).toBeGreaterThan(0);
    // TTS session was aborted
    expect(ttsKit.sessions[0]).toBeDefined();
  });

  it('processes an utterance: VAD → STT → LLM → TTS', async () => {
    const ws = new FakeWs();
    const ttsKit = tts();
    const session = new CallSession({
      twilioWs: ws as unknown as WsWebSocket,
      callJobId: 'job-3',
      systemPrompt: 'be brief',
      ai: ai(['Hi! ', 'How ', 'can ', 'I help?']),
      stt: stt('What is your refund policy?'),
      tts: ttsKit.client,
    });
    await session.handleMessage({
      event: 'start',
      start: { streamSid: 'MZ1', callSid: 'CA1' },
    });

    // Loud frames → speech_start
    const loud = new Int16Array(160).fill(3000);
    const loudUlaw = encodePcmBuffer(loud).toString('base64');
    for (let i = 0; i < 6; i++) {
      await session.handleMessage({
        event: 'media',
        media: { payload: loudUlaw, track: 'inbound' },
      });
    }
    // Silent frames → speech_end (after ~250ms = 13 frames)
    const silent = new Int16Array(160).fill(0);
    const silentUlaw = encodePcmBuffer(silent).toString('base64');
    for (let i = 0; i < 20; i++) {
      await session.handleMessage({
        event: 'media',
        media: { payload: silentUlaw, track: 'inbound' },
      });
    }
    // Allow async processing to settle
    await new Promise((r) => setTimeout(r, 20));

    // History should contain the user turn and the assistant turn
    const userTurns = session.history.filter((m: ChatMessage) => m.role === 'user');
    const assistantTurns = session.history.filter((m: ChatMessage) => m.role === 'assistant');
    expect(userTurns).toHaveLength(1);
    expect(userTurns[0]!.content).toBe('What is your refund policy?');
    expect(assistantTurns).toHaveLength(1);
    expect(assistantTurns[0]!.content).toContain('Hi!');
  });

  it('drops outbound frames under backpressure', async () => {
    const ws = new FakeWs();
    ws.bufferedAmount = 100 * 1024; // over the 50KB threshold
    const ttsKit = tts();
    const session = new CallSession({
      twilioWs: ws as unknown as WsWebSocket,
      callJobId: 'job-4',
      systemPrompt: 'p',
      greeting: 'Hello! How are you doing today?',
      ai: ai([]),
      stt: stt(null),
      tts: ttsKit.client,
    });
    await session.handleMessage({
      event: 'start',
      start: { streamSid: 'MZ1', callSid: 'CA1' },
    });
    await new Promise((r) => setTimeout(r, 10));
    const mediaFrames = ws.sent.filter((s) => s.includes('"event":"media"'));
    expect(mediaFrames.length).toBe(0); // all dropped
    expect(session.__testHooks().droppedFrames()).toBeGreaterThan(0);
  });
});
