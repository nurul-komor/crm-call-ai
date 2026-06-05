import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { z } from 'zod';

/** AES-256-GCM with 96-bit IV, 128-bit auth tag. */
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

export const EncryptedFieldSchema = z.object({
  /** base64-encoded ciphertext */
  ciphertext: z.string().min(1),
  /** base64-encoded IV */
  iv: z.string().length(16), // base64 of 12 bytes = 16 chars
  /** base64-encoded auth tag */
  tag: z.string().length(24), // base64 of 16 bytes = 24 chars
  /** key version that encrypted this value */
  v: z.number().int().min(1),
});

export type EncryptedField = z.infer<typeof EncryptedFieldSchema>;

export class AuthTagMismatchError extends Error {
  readonly code = 'auth_tag_mismatch';
  constructor(message = 'Encrypted payload failed authentication') {
    super(message);
    this.name = 'AuthTagMismatchError';
  }
}

function decodeMasterKey(masterKey: string | Buffer): Buffer {
  if (Buffer.isBuffer(masterKey)) {
    if (masterKey.length !== KEY_BYTES) {
      throw new Error(`Master key must be ${KEY_BYTES} bytes (got ${masterKey.length})`);
    }
    return masterKey;
  }
  const buf = Buffer.from(masterKey, 'base64');
  if (buf.length !== KEY_BYTES) {
    throw new Error(`Master key must be ${KEY_BYTES} bytes after base64 decode (got ${buf.length})`);
  }
  return buf;
}

export function encrypt(
  plaintext: string,
  masterKey: string | Buffer,
  version: number,
): EncryptedField {
  if (typeof plaintext !== 'string') throw new TypeError('plaintext must be a string');
  if (!Number.isInteger(version) || version < 1) {
    throw new RangeError('version must be a positive integer');
  }
  const key = decodeMasterKey(masterKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    v: version,
  };
}

export function decrypt(payload: EncryptedField, masterKey: string | Buffer): string {
  const key = decodeMasterKey(masterKey);
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ct = Buffer.from(payload.ciphertext, 'base64');

  if (iv.length !== IV_BYTES) throw new Error('Invalid IV length');
  if (tag.length !== TAG_BYTES) throw new Error('Invalid tag length');

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  try {
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  } catch (err) {
    if ((err as Error).message.includes('auth')) {
      throw new AuthTagMismatchError();
    }
    throw err;
  }
}
