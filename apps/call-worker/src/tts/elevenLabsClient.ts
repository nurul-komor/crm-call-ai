/**
 * ElevenLabs streaming TTS client.
 *
 * Opens one WS per utterance to ws://api.elevenlabs.io/v1/text-to-speech/:voiceId/stream-input
 * with model_id=eleven_flash_v2_5, output_format=ulaw_8000,
 * optimize_streaming_latency=3. Each LLM token is forwarded immediately
 * via sendText() so the first TTS frame can come back before the LLM finishes
 * (per validated architecture decisions).
 *
 * Inbound μ-law audio frames are forwarded to the caller via the
 * onAudio callback as base64-encoded Twilio media payloads (already
 * μ-law @ 8 kHz, no transcoding needed).
 */

import { WebSocket } from 'ws';

import { log } from '../logger.js';

export interface ElevenLabsClientOptions {
  apiKey: string;
  voiceId: string;
  model?: string; // default eleven_flash_v2_5
  optimizeStreamingLatency?: number; // default 3
  /** For tests. */
  wsFactory?: (url: string, headers: Record<string, string>) => WebSocket;
}

export interface TtsSession {
  /** Send a chunk of text. Forwarded immediately. Empty string flushes. */
  sendText(text: string): void;
  /** Mark end-of-utterance — flushes the buffer and lets the server close. */
  finish(): void;
  /** Hard cancel: closes the WS and signals barge-in. */
  abort(): void;
  /** Resolves when the WS closes (cleanly or otherwise). */
  done(): Promise<void>;
  /** True once the WS handshake is complete. */
  isReady(): boolean;
}

export type AudioCallback = (payloadBase64: string) => void;

const DEFAULT_MODEL = 'eleven_flash_v2_5';
const DEFAULT_LATENCY = 3;
const ELEVENLABS_HOST = 'wss://api.elevenlabs.io';

export class ElevenLabsTtsClient {
  constructor(private readonly opts: ElevenLabsClientOptions) {}

  /** Open a streaming session for one utterance. Caller pipes tokens in. */
  start(onAudio: AudioCallback): TtsSession {
    const model = this.opts.model ?? DEFAULT_MODEL;
    const lat = this.opts.optimizeStreamingLatency ?? DEFAULT_LATENCY;
    const url = `${ELEVENLABS_HOST}/v1/text-to-speech/${this.opts.voiceId}/stream-input?model_id=${model}&output_format=ulaw_8000&optimize_streaming_latency=${lat}`;
    const headers = { 'xi-api-key': this.opts.apiKey };
    const ws = (this.opts.wsFactory ?? defaultWsFactory)(url, headers);

    let ready = false;
    let aborted = false;
    let finished = false;
    const queue: string[] = [];

    let resolveDone: () => void = () => undefined;
    const donePromise = new Promise<void>((resolve) => {
      resolveDone = resolve;
    });

    const sendInitial = () => {
      ws.send(
        JSON.stringify({
          text: ' ',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          xi_api_key: this.opts.apiKey,
        }),
      );
    };

    const drain = () => {
      while (queue.length) {
        const chunk = queue.shift()!;
        ws.send(JSON.stringify({ text: chunk }));
      }
    };

    ws.on('open', () => {
      ready = true;
      sendInitial();
      drain();
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          audio?: string;
          isFinal?: boolean;
          error?: string;
        };
        if (msg.error) {
          log().warn({ err: msg.error }, 'elevenlabs error');
          return;
        }
        if (msg.audio) onAudio(msg.audio);
        if (msg.isFinal) ws.close(1000);
      } catch (err) {
        log().warn({ err }, 'elevenlabs malformed message');
      }
    });

    ws.on('close', () => resolveDone());
    ws.on('error', (err) => {
      log().warn({ err }, 'elevenlabs ws error');
      resolveDone();
    });

    return {
      sendText(text: string): void {
        if (aborted || finished) return;
        if (!text) return;
        if (!ready) {
          queue.push(text);
        } else {
          ws.send(JSON.stringify({ text }));
        }
      },
      finish(): void {
        if (aborted || finished) return;
        finished = true;
        if (ready) {
          ws.send(JSON.stringify({ text: '' })); // flush + close
        }
      },
      abort(): void {
        if (aborted) return;
        aborted = true;
        try {
          ws.close(1000);
        } catch {
          /* noop */
        }
      },
      done: () => donePromise,
      isReady: () => ready,
    };
  }
}

function defaultWsFactory(url: string, headers: Record<string, string>): WebSocket {
  return new WebSocket(url, { headers });
}
