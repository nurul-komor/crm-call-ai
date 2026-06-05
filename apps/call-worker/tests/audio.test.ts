import { describe, expect, it } from 'vitest';

import { decodeULawBuffer, encodePcmBuffer, pcm16ToWav } from '../src/audio/mulaw.js';
import { UtteranceBuffer } from '../src/audio/ringBuffer.js';
import { EnergyVad } from '../src/audio/vad.js';

describe('μ-law codec', () => {
  it('round-trips known PCM values within G.711 quantisation error', () => {
    const inputs = new Int16Array([0, 100, -100, 1000, -1000, 8000, -8000, 32000, -32000]);
    const ulaw = encodePcmBuffer(inputs);
    expect(ulaw.length).toBe(inputs.length);
    const back = decodeULawBuffer(ulaw);
    expect(back.length).toBe(inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      // μ-law is lossy; tolerance grows with magnitude
      const tol = Math.max(8, Math.abs(inputs[i]!) * 0.1);
      expect(Math.abs(back[i]! - inputs[i]!)).toBeLessThanOrEqual(tol);
    }
  });

  it('produces a valid WAV header', () => {
    const wav = pcm16ToWav(new Int16Array(16), 8000);
    expect(wav.slice(0, 4).toString()).toBe('RIFF');
    expect(wav.slice(8, 12).toString()).toBe('WAVE');
    expect(wav.readUInt32LE(24)).toBe(8000); // sample rate
  });
});

describe('UtteranceBuffer', () => {
  it('slices across chunk boundaries', () => {
    const b = new UtteranceBuffer();
    b.append(new Int16Array([1, 2, 3, 4]));
    b.append(new Int16Array([5, 6, 7, 8, 9, 10]));
    expect(Array.from(b.slice(2, 7))).toEqual([3, 4, 5, 6, 7]);
    expect(Array.from(b.slice(0, 10))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('EnergyVad', () => {
  it('fires speech_start after sustained loud frames and speech_end after silence', () => {
    const vad = new EnergyVad({
      speechThreshold: 500,
      minSpeechMs: 40, // 2 frames
      trailingSilenceMs: 60, // 3 frames
    });
    const events: { type: string }[] = [];
    let offset = 0;
    const FRAME = 160;
    const loud = new Int16Array(FRAME).fill(2000);
    const silent = new Int16Array(FRAME).fill(0);

    for (let i = 0; i < 5; i++) {
      events.push(...vad.process(loud, offset).map((e) => ({ type: e.type })));
      offset += FRAME;
    }
    for (let i = 0; i < 5; i++) {
      events.push(...vad.process(silent, offset).map((e) => ({ type: e.type })));
      offset += FRAME;
    }
    expect(events.map((e) => e.type)).toEqual(['speech_start', 'speech_end']);
  });

  it('does not fire on a single noisy frame', () => {
    const vad = new EnergyVad({ speechThreshold: 500, minSpeechMs: 40 });
    const events = vad.process(new Int16Array(160).fill(2000), 0);
    expect(events).toHaveLength(0);
  });
});
