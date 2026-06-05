import { Schema } from 'mongoose';

import {
  EncryptedFieldSchema as EncryptedFieldZod,
  decrypt,
  encrypt,
  type EncryptedField,
} from '@voiceflow/shared-utils';

import { env } from '../config/env.js';

/** Mongoose subdocument schema mirroring EncryptedFieldZod. */
export const EncryptedFieldMongooseSchema = new Schema(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    v: { type: Number, required: true },
  },
  { _id: false },
);

export function encryptForStorage(plaintext: string): EncryptedField {
  const e = env();
  return encrypt(plaintext, e.ENCRYPTION_MASTER_KEY, e.ENCRYPTION_KEY_VERSION);
}

export function decryptFromStorage(payload: EncryptedField | undefined | null): string {
  if (!payload) throw new Error('decryptFromStorage called with no payload');
  const parsed = EncryptedFieldZod.parse(payload);
  return decrypt(parsed, env().ENCRYPTION_MASTER_KEY);
}
