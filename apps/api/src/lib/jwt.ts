import { randomUUID } from 'node:crypto';

import jsonwebtoken from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from './errors.js';

export interface AccessTokenClaims {
  sub: string;            // userId
  cid: string;            // companyId
  rid: string;            // roleId
  type: 'access';
}

export interface RefreshTokenClaims {
  sub: string;
  cid: string;
  jti: string;
  type: 'refresh';
}

export function signAccessToken(payload: Omit<AccessTokenClaims, 'type'>): string {
  return jsonwebtoken.sign({ ...payload, type: 'access' }, env().JWT_ACCESS_SECRET, {
    expiresIn: env().JWT_ACCESS_TTL,
  });
}

export function signRefreshToken(
  payload: Omit<RefreshTokenClaims, 'type' | 'jti'> & { jti?: string },
): { token: string; jti: string } {
  const jti = payload.jti ?? randomUUID();
  const token = jsonwebtoken.sign(
    { sub: payload.sub, cid: payload.cid, jti, type: 'refresh' },
    env().JWT_REFRESH_SECRET,
    { expiresIn: env().JWT_REFRESH_TTL },
  );
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const claims = jsonwebtoken.verify(token, env().JWT_ACCESS_SECRET) as AccessTokenClaims;
    if (claims.type !== 'access') throw new AppError('unauthenticated', 'Wrong token type', 401);
    return claims;
  } catch (err) {
    if (err instanceof jsonwebtoken.TokenExpiredError) {
      throw new AppError('token_expired', 'Access token expired', 401);
    }
    if (err instanceof AppError) throw err;
    throw new AppError('unauthenticated', 'Invalid access token', 401);
  }
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  try {
    const claims = jsonwebtoken.verify(token, env().JWT_REFRESH_SECRET) as RefreshTokenClaims;
    if (claims.type !== 'refresh') throw new AppError('unauthenticated', 'Wrong token type', 401);
    return claims;
  } catch (err) {
    if (err instanceof jsonwebtoken.TokenExpiredError) {
      throw new AppError('token_expired', 'Refresh token expired', 401);
    }
    if (err instanceof AppError) throw err;
    throw new AppError('unauthenticated', 'Invalid refresh token', 401);
  }
}
