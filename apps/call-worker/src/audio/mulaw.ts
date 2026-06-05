/**
 * ITU-T G.711 μ-law ↔ PCM16 codec.
 *
 * Twilio Media Streams + ElevenLabs `ulaw_8000` both speak μ-law at 8 kHz,
 * so we keep the wire format and only decode/encode when the VAD or STT
 * needs PCM. Lookup-table-based; ~constant time per byte.
 */

const BIAS = 0x84;

const ULAW_TO_PCM = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  const u = ~i & 0xff;
  const sign = u & 0x80;
  const exponent = (u >> 4) & 0x07;
  const mantissa = u & 0x0f;
  let sample = ((mantissa << 3) + BIAS) << exponent;
  sample -= BIAS;
  ULAW_TO_PCM[i] = sign ? -sample : sample;
}

export function decodeULawBuffer(ulaw: Buffer): Int16Array {
  const out = new Int16Array(ulaw.length);
  for (let i = 0; i < ulaw.length; i++) {
    out[i] = ULAW_TO_PCM[ulaw[i]!]!;
  }
  return out;
}

export function encodePcmBuffer(pcm: Int16Array): Buffer {
  const out = Buffer.allocUnsafe(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    out[i] = pcm16ToULaw(pcm[i]!);
  }
  return out;
}

function pcm16ToULaw(sample: number): number {
  let s = sample;
  let sign = 0;
  if (s < 0) {
    sign = 0x80;
    s = -s;
  }
  if (s > 32635) s = 32635;
  s += BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (s & mask) === 0 && exponent > 0; mask >>= 1, exponent--) {
    /* find exponent */
  }
  const mantissa = (s >> (exponent + 3)) & 0x0f;
  return (~(sign | (exponent << 4) | mantissa)) & 0xff;
}

/** Wrap PCM16 in a minimal WAV header so the audio file can be sent to STT. */
export function pcm16ToWav(pcm: Int16Array, sampleRate = 8000): Buffer {
  const dataBytes = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20);  // PCM format
  buf.writeUInt16LE(1, 22);  // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);  // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < pcm.length; i++) {
    buf.writeInt16LE(pcm[i]!, 44 + i * 2);
  }
  return buf;
}
