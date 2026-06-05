/**
 * Per-call state machine. Owns the live Twilio Media Streams WS, the inbound
 * PCM ring buffer + VAD, the ElevenLabs streaming TTS WS, and the AIProvider.
 *
 * Lifecycle (one instance per call):
 *   awaiting_call_start  → start event from Twilio → ready to greet
 *   speaking             → AI audio flowing to Twilio
 *   listening            → user speaking; VAD active; STT pending utterance
 *   thinking             → STT done, LLM streaming
 *   ended                → cleanup
 *
 * Barge-in: when VAD speech_start fires while state === 'speaking', we abort
 * the ElevenLabs WS, drop the outbound queue, and send Twilio a {event:'clear'}.
 */

import type { WebSocket as WsWebSocket } from 'ws';

import { decodeULawBuffer } from '../audio/mulaw.js';
import { UtteranceBuffer } from '../audio/ringBuffer.js';
import { EnergyVad, type Detector } from '../audio/vad.js';
import { log } from '../logger.js';
import type { AIProvider, ChatMessage } from '../providers/AIProvider.js';
import type { SttClient } from '../stt/openAiSttClient.js';
import type { TtsSession, ElevenLabsTtsClient } from '../tts/elevenLabsClient.js';

const MAX_OUTBOUND_BUFFER = 50 * 1024;
const FRAMES_PER_SECOND = 50; // Twilio: 20 ms frames

export type SessionState =
  | 'awaiting_call_start'
  | 'awaiting_human_answer'
  | 'speaking'
  | 'listening'
  | 'thinking'
  | 'ended';

export interface CallSessionDeps {
  twilioWs: WsWebSocket;
  callJobId: string;
  systemPrompt: string;
  greeting?: string;
  ai: AIProvider;
  stt: SttClient;
  tts: ElevenLabsTtsClient;
  vad?: Detector;
  /** Persist a transcript turn (fire-and-forget). */
  onTurn?: (turn: { role: 'agent' | 'customer'; text: string; at: Date }) => void;
  /** Notified when the session is ending (so worker can flush state). */
  onEnd?: (reason: string) => void;
}

export class CallSession {
  state: SessionState = 'awaiting_call_start';
  streamSid?: string;
  callSid?: string;
  history: ChatMessage[] = [];

  private readonly buffer = new UtteranceBuffer();
  private readonly vad: Detector;
  private sampleOffset = 0;
  private utteranceStartOffset = -1;
  private droppedFrames = 0;
  private currentTts?: TtsSession;
  private currentUtteranceId = 0;
  private answeredByHuman = false;
  private ended = false;

  constructor(private readonly deps: CallSessionDeps) {
    this.vad = deps.vad ?? new EnergyVad();
  }

  /** Entry point: feed a parsed Twilio message. */
  async handleMessage(msg: {
    event: string;
    streamSid?: string;
    start?: { streamSid: string; callSid: string };
    media?: { payload: string; track?: 'inbound' | 'outbound' };
  }): Promise<void> {
    if (this.ended) return;
    switch (msg.event) {
      case 'connected':
        return;
      case 'start':
        this.streamSid = msg.start?.streamSid;
        this.callSid = msg.start?.callSid;
        this.state = 'awaiting_human_answer';
        // For Phase 1 we treat answered events as "human" unless AMD flags otherwise.
        // Phase 1S extends this with Redis pub/sub from the api status webhook.
        this.markHumanAnswered();
        return;
      case 'media':
        if (msg.media?.payload && msg.media.track !== 'outbound') {
          this.ingestInbound(msg.media.payload);
        }
        return;
      case 'stop':
        await this.end('twilio_stop');
        return;
    }
  }

  /** Called externally (Phase 1S) when api status webhook confirms human answer. */
  markHumanAnswered(): void {
    if (this.answeredByHuman || this.ended) return;
    this.answeredByHuman = true;
    if (this.deps.greeting) {
      void this.speak(this.deps.greeting);
    }
  }

  /** Called externally when AMD detects machine; ends call cleanly. */
  markAnsweringMachine(): void {
    if (this.ended) return;
    void this.end('answering_machine');
  }

  /** External hangup (manual stop). */
  async hangup(reason: string): Promise<void> {
    await this.end(reason);
  }

  // ---------------- internals ----------------

  private ingestInbound(payloadBase64: string): void {
    const ulaw = Buffer.from(payloadBase64, 'base64');
    const pcm = decodeULawBuffer(ulaw);
    this.buffer.append(pcm);

    const events = this.vad.process(pcm, this.sampleOffset);
    this.sampleOffset += pcm.length;

    for (const ev of events) {
      if (ev.type === 'speech_start') {
        this.utteranceStartOffset = ev.sampleOffset;
        if (this.state === 'speaking') this.bargeIn();
        this.state = 'listening';
      } else if (ev.type === 'speech_end') {
        const start = this.utteranceStartOffset >= 0 ? this.utteranceStartOffset : 0;
        const utterance = this.buffer.slice(start, ev.sampleOffset);
        this.utteranceStartOffset = -1;
        void this.processUtterance(utterance);
      }
    }
  }

  private async processUtterance(pcm: Int16Array): Promise<void> {
    this.state = 'thinking';
    const transcript = await this.deps.stt.transcribe(pcm).catch((err) => {
      log().warn({ err, callJobId: this.deps.callJobId }, 'stt error');
      return null;
    });
    if (!transcript) {
      this.state = this.answeredByHuman ? 'awaiting_human_answer' : 'awaiting_call_start';
      return;
    }
    this.history.push({ role: 'user', content: transcript });
    this.deps.onTurn?.({ role: 'customer', text: transcript, at: new Date() });

    // Stream LLM → TTS pipelining.
    const utteranceId = ++this.currentUtteranceId;
    this.state = 'speaking';
    let collected = '';
    const tts = this.deps.tts.start((audio) => this.sendAudioFrame(audio, utteranceId));
    this.currentTts = tts;

    try {
      for await (const token of this.deps.ai.completeStream({
        systemPrompt: this.deps.systemPrompt,
        history: this.history,
        userInput: transcript,
      })) {
        if (this.ended || this.currentUtteranceId !== utteranceId) break;
        collected += token;
        tts.sendText(token);
      }
      tts.finish();
      await tts.done();
    } catch (err) {
      log().warn({ err, callJobId: this.deps.callJobId }, 'llm error');
      tts.abort();
    }

    if (collected) {
      this.history.push({ role: 'assistant', content: collected });
      this.deps.onTurn?.({ role: 'agent', text: collected, at: new Date() });
    }
    if (this.currentUtteranceId === utteranceId && !this.ended) {
      this.state = 'awaiting_human_answer';
    }
  }

  private async speak(text: string): Promise<void> {
    if (this.ended) return;
    const utteranceId = ++this.currentUtteranceId;
    this.state = 'speaking';
    const tts = this.deps.tts.start((audio) => this.sendAudioFrame(audio, utteranceId));
    this.currentTts = tts;
    tts.sendText(text);
    tts.finish();
    await tts.done();
    if (this.currentUtteranceId === utteranceId && !this.ended) {
      this.history.push({ role: 'assistant', content: text });
      this.deps.onTurn?.({ role: 'agent', text, at: new Date() });
      this.state = 'awaiting_human_answer';
    }
  }

  private sendAudioFrame(payloadBase64: string, utteranceId: number): void {
    if (this.ended) return;
    if (utteranceId !== this.currentUtteranceId) return; // cancelled utterance
    const ws = this.deps.twilioWs;
    if (ws.readyState !== ws.OPEN) return;
    if (ws.bufferedAmount > MAX_OUTBOUND_BUFFER) {
      this.droppedFrames++;
      return;
    }
    if (!this.streamSid) return;
    ws.send(
      JSON.stringify({
        event: 'media',
        streamSid: this.streamSid,
        media: { payload: payloadBase64 },
      }),
    );
  }

  private bargeIn(): void {
    if (!this.streamSid) return;
    const ws = this.deps.twilioWs;
    log().debug({ callJobId: this.deps.callJobId }, 'barge-in');
    this.currentTts?.abort();
    this.currentTts = undefined;
    this.currentUtteranceId++; // any in-flight TTS frames are now stale
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ event: 'clear', streamSid: this.streamSid }));
    }
  }

  private async end(reason: string): Promise<void> {
    if (this.ended) return;
    this.ended = true;
    this.state = 'ended';
    this.currentTts?.abort();
    try {
      if (this.deps.twilioWs.readyState === this.deps.twilioWs.OPEN) {
        this.deps.twilioWs.close(1000);
      }
    } catch {
      /* noop */
    }
    log().info(
      { callJobId: this.deps.callJobId, reason, droppedFrames: this.droppedFrames },
      'call session ended',
    );
    this.deps.onEnd?.(reason);
  }

  /** Exposed for tests. */
  __testHooks(): { framesPerSecond: number; vad: Detector; droppedFrames: () => number } {
    return {
      framesPerSecond: FRAMES_PER_SECOND,
      vad: this.vad,
      droppedFrames: () => this.droppedFrames,
    };
  }
}
