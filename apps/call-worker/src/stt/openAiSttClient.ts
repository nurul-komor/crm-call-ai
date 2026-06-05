/**
 * OpenAI gpt-4o-transcribe wrapper.
 *
 * Input: PCM16 buffer (mono 8 kHz). We wrap in a WAV header and POST as a file
 * to /v1/audio/transcriptions. p50 ~400 ms, p95 ~800 ms (per validated
 * architecture notes). A 3 s timeout cuts off pathological STT responses
 * cleanly rather than blocking the conversation loop.
 */

import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

import { pcm16ToWav } from '../audio/mulaw.js';

export interface SttClient {
  transcribe(pcm: Int16Array): Promise<string | null>;
}

export interface OpenAiSttOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  /** For tests: inject. */
  client?: OpenAI;
}

export class OpenAiSttClient implements SttClient {
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly client: OpenAI;
  private timeoutCount = 0;

  constructor(opts: OpenAiSttOptions) {
    this.model = opts.model ?? 'gpt-4o-transcribe';
    this.timeoutMs = opts.timeoutMs ?? 3000;
    this.client = opts.client ?? new OpenAI({ apiKey: opts.apiKey });
  }

  async transcribe(pcm: Int16Array): Promise<string | null> {
    if (pcm.length === 0) return null;
    const wav = pcm16ToWav(pcm, 8000);
    const file = await toFile(wav, 'utterance.wav', { type: 'audio/wav' });
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), this.timeoutMs);
    try {
      const res = await this.client.audio.transcriptions.create(
        { file, model: this.model, response_format: 'text' },
        { signal: ac.signal },
      );
      const text =
        typeof res === 'string' ? res : (res as { text?: string }).text ?? '';
      return text.trim() || null;
    } catch (err) {
      if (ac.signal.aborted) {
        this.timeoutCount++;
        return null;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  getTimeoutCount(): number {
    return this.timeoutCount;
  }
}
