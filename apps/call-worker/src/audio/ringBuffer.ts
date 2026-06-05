/**
 * Inbound PCM ring buffer for assembling utterances.
 *
 * Holds the last ~30 s of inbound audio. On speech_start, the start offset is
 * stamped; on speech_end, the buffer between [start, end] is extracted as one
 * utterance and shipped to STT. Old samples beyond the ring are discarded.
 */

const MAX_BUFFER_SAMPLES = 8000 * 30; // 30 s @ 8 kHz

export class UtteranceBuffer {
  private chunks: Int16Array[] = [];
  private samples = 0;
  private headOffset = 0; // absolute sample offset of chunks[0][0]

  append(pcm: Int16Array): void {
    this.chunks.push(pcm);
    this.samples += pcm.length;
    while (this.samples > MAX_BUFFER_SAMPLES && this.chunks.length > 1) {
      const drop = this.chunks.shift()!;
      this.samples -= drop.length;
      this.headOffset += drop.length;
    }
  }

  /** Extract PCM samples between absolute offsets [from, to). */
  slice(from: number, to: number): Int16Array {
    const start = Math.max(0, from - this.headOffset);
    const end = Math.max(0, to - this.headOffset);
    const length = Math.max(0, end - start);
    const out = new Int16Array(length);

    let offset = 0;
    let cursor = 0;
    for (const chunk of this.chunks) {
      const chunkStart = cursor;
      const chunkEnd = cursor + chunk.length;
      if (chunkEnd <= start) {
        cursor = chunkEnd;
        continue;
      }
      if (chunkStart >= end) break;
      const localFrom = Math.max(0, start - chunkStart);
      const localTo = Math.min(chunk.length, end - chunkStart);
      out.set(chunk.subarray(localFrom, localTo), offset);
      offset += localTo - localFrom;
      cursor = chunkEnd;
    }
    return out;
  }

  reset(): void {
    this.chunks = [];
    this.samples = 0;
    this.headOffset = 0;
  }
}
