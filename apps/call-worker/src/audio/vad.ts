/**
 * Voice Activity Detection.
 *
 * Phase 1 implementation: energy-based VAD with hysteresis + 250 ms trailing
 * silence trigger and a 100 ms pre-roll window. This is intentionally simple
 * — the plan flags Silero (via onnxruntime-node) as the production target;
 * see `memory/project_voice_pipeline_decisions.md`. The Detector interface
 * here exists so Silero can be slotted in without touching callers.
 *
 * Input: PCM16 frames decoded from Twilio Media Streams (8 kHz mono,
 * 20 ms = 160 samples per frame).
 */

export interface VadEvent {
  type: 'speech_start' | 'speech_end';
  /** Cumulative PCM samples seen so far when this event fired. */
  sampleOffset: number;
}

export interface Detector {
  /** Feed one ~20 ms frame; receive any events that fired during the call. */
  process(frame: Int16Array, sampleOffset: number): VadEvent[];
  /** Reset internal state between calls. */
  reset(): void;
}

export interface EnergyVadOptions {
  /** Mean abs sample value above which a frame is considered speech. ~700-1500 typical. */
  speechThreshold?: number;
  /** Trailing-silence ms required to declare speech_end. */
  trailingSilenceMs?: number;
  /** Pre-roll ms kept before speech_start fires (to avoid clipping first phoneme). */
  preRollMs?: number;
  /** Minimum continuous speech ms before speech_start fires (debounce). */
  minSpeechMs?: number;
  sampleRate?: number;
}

export class EnergyVad implements Detector {
  private readonly speechThreshold: number;
  private readonly trailingSilenceFrames: number;
  private readonly preRollFrames: number;
  private readonly minSpeechFrames: number;
  private readonly framesPerSecond: number;

  private inSpeech = false;
  private silentFrames = 0;
  private speechFrames = 0;
  private candidateStartOffset = -1;

  constructor(opts: EnergyVadOptions = {}) {
    const sampleRate = opts.sampleRate ?? 8000;
    const frameMs = 20;
    this.framesPerSecond = 1000 / frameMs;
    this.speechThreshold = opts.speechThreshold ?? 1000;
    this.trailingSilenceFrames = Math.ceil((opts.trailingSilenceMs ?? 250) / frameMs);
    this.preRollFrames = Math.ceil((opts.preRollMs ?? 100) / frameMs);
    this.minSpeechFrames = Math.ceil((opts.minSpeechMs ?? 100) / frameMs);
    void sampleRate; // reserved for future Silero integration
  }

  process(frame: Int16Array, sampleOffset: number): VadEvent[] {
    const energy = meanAbs(frame);
    const isSpeech = energy >= this.speechThreshold;
    const events: VadEvent[] = [];

    if (isSpeech) {
      this.silentFrames = 0;
      this.speechFrames++;
      if (!this.inSpeech) {
        if (this.candidateStartOffset === -1) {
          this.candidateStartOffset = Math.max(
            0,
            sampleOffset - this.preRollFrames * frame.length,
          );
        }
        if (this.speechFrames >= this.minSpeechFrames) {
          this.inSpeech = true;
          events.push({ type: 'speech_start', sampleOffset: this.candidateStartOffset });
        }
      }
    } else {
      this.speechFrames = 0;
      if (this.inSpeech) {
        this.silentFrames++;
        if (this.silentFrames >= this.trailingSilenceFrames) {
          this.inSpeech = false;
          this.candidateStartOffset = -1;
          this.silentFrames = 0;
          events.push({ type: 'speech_end', sampleOffset });
        }
      } else {
        this.candidateStartOffset = -1;
      }
    }
    return events;
  }

  reset(): void {
    this.inSpeech = false;
    this.silentFrames = 0;
    this.speechFrames = 0;
    this.candidateStartOffset = -1;
  }

  isSpeaking(): boolean {
    return this.inSpeech;
  }
}

function meanAbs(frame: Int16Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += Math.abs(frame[i]!);
  return frame.length === 0 ? 0 : sum / frame.length;
}
