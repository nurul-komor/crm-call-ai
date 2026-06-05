import { createHash } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';

const MIN_PASSWORD_LENGTH = 12;
const REQUIRE_DIGIT = /\d/;
const REQUIRE_LETTER = /[A-Za-z]/;

export function validatePasswordComplexity(password: string): { ok: true } | { ok: false; reason: string } {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (!REQUIRE_DIGIT.test(password)) return { ok: false, reason: 'Password must contain a digit' };
  if (!REQUIRE_LETTER.test(password)) {
    return { ok: false, reason: 'Password must contain a letter' };
  }
  return { ok: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env().BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Stable, fast hash for storing refresh tokens / reset tokens (not for passwords). */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
