import { describe, it, expect } from 'vitest';

import {
  AuthTagMismatchError,
  EncryptedFieldSchema,
  decrypt,
  encrypt,
} from '../src/crypto.js';

const MASTER_KEY = Buffer.alloc(32, 42).toString('base64');

describe('crypto', () => {
  it('round-trips a string', () => {
    const enc = encrypt('hello world', MASTER_KEY, 1);
    expect(EncryptedFieldSchema.parse(enc)).toEqual(enc);
    expect(decrypt(enc, MASTER_KEY)).toBe('hello world');
  });

  it('produces a different ciphertext each call (random IV)', () => {
    const a = encrypt('same', MASTER_KEY, 1);
    const b = encrypt('same', MASTER_KEY, 1);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('rejects a mutated ciphertext with AuthTagMismatchError', () => {
    const enc = encrypt('secret', MASTER_KEY, 1);
    const bad = {
      ...enc,
      ciphertext: Buffer.from(
        Buffer.from(enc.ciphertext, 'base64').map((b, i) => (i === 0 ? b ^ 1 : b)),
      ).toString('base64'),
    };
    expect(() => decrypt(bad, MASTER_KEY)).toThrowError(AuthTagMismatchError);
  });

  it('rejects a mutated tag', () => {
    const enc = encrypt('secret', MASTER_KEY, 1);
    const tag = Buffer.from(enc.tag, 'base64');
    tag[0] ^= 1;
    expect(() => decrypt({ ...enc, tag: tag.toString('base64') }, MASTER_KEY)).toThrowError(
      AuthTagMismatchError,
    );
  });

  it('rejects a wrong master key', () => {
    const enc = encrypt('secret', MASTER_KEY, 1);
    const other = Buffer.alloc(32, 7).toString('base64');
    expect(() => decrypt(enc, other)).toThrowError(AuthTagMismatchError);
  });

  it('rejects a master key of the wrong length', () => {
    expect(() => encrypt('x', Buffer.alloc(16).toString('base64'), 1)).toThrowError(/32 bytes/);
  });

  it('rejects invalid version', () => {
    expect(() => encrypt('x', MASTER_KEY, 0)).toThrowError(/positive integer/);
  });

  it('stores the key version on the payload', () => {
    const enc = encrypt('x', MASTER_KEY, 7);
    expect(enc.v).toBe(7);
  });
});
