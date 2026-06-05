import { randomBytes } from 'node:crypto';

import mongoose, { Types } from 'mongoose';

import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { sendMail } from '../../lib/mailer.js';
import {
  comparePassword,
  hashPassword,
  sha256,
  validatePasswordComplexity,
} from '../../lib/password.js';
import { CompanyModel } from '../companies/model.js';
import { RoleModel } from '../roles/model.js';
import { seedDefaultRolesForCompany } from '../roles/seed.js';
import { UserModel } from '../users/model.js';

import { PasswordResetTokenModel } from './password-reset.model.js';
import { RefreshTokenModel } from './refresh-token.model.js';

import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshInput,
  ResetPasswordInput,
  SignupInput,
} from './dto.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  companyId: string;
  roleId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

function toPublicUser(u: {
  _id: Types.ObjectId | string;
  companyId: Types.ObjectId | string;
  roleId: Types.ObjectId | string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}): PublicUser {
  return {
    id: String(u._id),
    companyId: String(u.companyId),
    roleId: String(u.roleId),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    status: u.status,
  };
}

function slugifyBasic(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function freeSlug(baseName: string): Promise<string> {
  const base = slugifyBasic(baseName) || 'company';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const exists = await CompanyModel.exists({ slug: candidate });
    if (!exists) return candidate;
  }
  return `${base}-${randomBytes(3).toString('hex')}`;
}

function ttlToMs(ttl: string): number {
  const m = /^(\d+)([smhd])$/.exec(ttl);
  if (!m) throw new Error(`Invalid TTL: ${ttl}`);
  const n = Number(m[1]);
  switch (m[2]) {
    case 's':
      return n * 1000;
    case 'm':
      return n * 60 * 1000;
    case 'h':
      return n * 60 * 60 * 1000;
    case 'd':
      return n * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid TTL unit: ${m[2]}`);
  }
}

export async function signup(input: SignupInput): Promise<AuthTokens & { user: PublicUser }> {
  const complexity = validatePasswordComplexity(input.password);
  if (!complexity.ok) throw new AppError('bad_request', complexity.reason, 400);

  try {
    const { user, publicUser } = await runSignupAtomic(input);
    const tokens = await issueTokens(user);
    return { ...tokens, user: publicUser };
  } catch (err) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as { code?: number }).code === 11000
    ) {
      throw new AppError('conflict', 'Duplicate value', 409);
    }
    throw err;
  }
}

interface SignupResult {
  user: { _id: Types.ObjectId; companyId: Types.ObjectId; roleId: Types.ObjectId };
  publicUser: PublicUser;
}

/**
 * Run the company + roles + user creates atomically when the Mongo deployment
 * supports transactions (Atlas replica sets, mongodb-memory-server with
 * `MongoMemoryReplSet`). On a standalone Mongo (`Transaction numbers are only
 * allowed on a replica set member or mongos`), fall back to non-transactional
 * creates and log a warning. The non-atomic path can leave orphan rows on
 * mid-flight failure, but unique indexes on (companyId, email) and slug make
 * a retry produce a clean conflict rather than a duplicate user.
 */
async function runSignupAtomic(input: SignupInput): Promise<SignupResult> {
  const session = await mongoose.startSession();
  try {
    let result: SignupResult | null = null;
    await session.withTransaction(async () => {
      result = await doSignup(input, session);
    });
    if (!result) throw new AppError('internal_error', 'Signup failed', 500);
    return result;
  } catch (err) {
    if (isNoTransactionSupportError(err)) {
      // One-time warning per process (sticky via a module flag would be
      // nicer, but logging every signup on standalone Mongo is fine for dev).
      // eslint-disable-next-line no-console
      console.warn(
        '[auth] Mongo deployment does not support transactions — running signup non-atomically. Use a replica set in production.',
      );
      return doSignup(input, null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

function isNoTransactionSupportError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    msg.includes('Transaction numbers') ||
    msg.includes('Transactions are not supported') ||
    msg.includes('replica set member or mongos')
  );
}

async function doSignup(
  input: SignupInput,
  session: mongoose.ClientSession | null,
): Promise<SignupResult> {
  const slug = await freeSlug(input.companyName);

  const [company] = await CompanyModel.create(
    [{ name: input.companyName, slug }],
    session ? { session } : {},
  );
  if (!company) throw new AppError('internal_error', 'Failed to create company', 500);

  await seedDefaultRolesForCompany(company._id, session ? { session } : {});

  const adminRoleQuery = RoleModel.findOne({
    companyId: company._id,
    name: 'company_admin',
  });
  if (session) adminRoleQuery.session(session);
  const adminRole = await adminRoleQuery;
  if (!adminRole) throw new AppError('internal_error', 'Default role missing', 500);

  const existingQuery = UserModel.findOne({
    companyId: company._id,
    email: input.email,
  });
  if (session) existingQuery.session(session);
  const existing = await existingQuery;
  if (existing) throw new AppError('conflict', 'Email already registered', 409);

  const passwordHash = await hashPassword(input.password);
  const [created] = await UserModel.create(
    [
      {
        companyId: company._id,
        roleId: adminRole._id,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: 'active',
      },
    ],
    session ? { session } : {},
  );
  if (!created) throw new AppError('internal_error', 'Failed to create user', 500);

  return {
    user: { _id: created._id, companyId: company._id, roleId: adminRole._id },
    publicUser: toPublicUser({ ...created.toObject(), _id: created._id }),
  };
}

export async function login(input: LoginInput): Promise<AuthTokens & { user: PublicUser }> {
  const user = await UserModel.findOne({ email: input.email })
    .select('+passwordHash')
    .lean();
  if (!user) throw new AppError('unauthenticated', 'Invalid credentials', 401);
  if (user.status !== 'active') throw new AppError('forbidden', 'Account disabled', 403);
  const ok = await comparePassword(input.password, user.passwordHash);
  if (!ok) throw new AppError('unauthenticated', 'Invalid credentials', 401);

  await UserModel.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  const tokens = await issueTokens({
    _id: user._id,
    companyId: user.companyId,
    roleId: user.roleId,
  });
  return { ...tokens, user: toPublicUser({ ...user, _id: user._id }) };
}

export async function refresh(input: RefreshInput): Promise<AuthTokens> {
  const claims = verifyRefreshToken(input.refreshToken);
  const stored = await RefreshTokenModel.findOne({ jti: claims.jti });
  if (!stored) throw new AppError('unauthenticated', 'Refresh token not found', 401);
  if (stored.revokedAt) {
    throw new AppError('unauthenticated', 'Refresh token revoked', 401);
  }
  if (stored.tokenHash !== sha256(input.refreshToken)) {
    throw new AppError('unauthenticated', 'Refresh token mismatch', 401);
  }
  if (stored.expiresAt.getTime() < Date.now()) {
    throw new AppError('token_expired', 'Refresh token expired', 401);
  }

  const user = await UserModel.findById(claims.sub).lean();
  if (!user) throw new AppError('unauthenticated', 'User not found', 401);

  const tokens = await issueTokens({
    _id: user._id,
    companyId: user.companyId,
    roleId: user.roleId,
  });

  await RefreshTokenModel.updateOne(
    { _id: stored._id },
    { $set: { revokedAt: new Date(), replacedByJti: (await replacedJti(tokens.refreshToken)) } },
  );

  return tokens;
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const claims = verifyRefreshToken(refreshToken);
    await RefreshTokenModel.updateOne(
      { jti: claims.jti, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  } catch {
    // swallow — logout is idempotent
  }
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await UserModel.findOne({ email: input.email });
  if (!user) return; // always succeed (no user enumeration)
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + ttlToMs(env().PASSWORD_RESET_TTL));
  await PasswordResetTokenModel.create({ userId: user._id, tokenHash, expiresAt });

  const resetUrl = `${env().APP_BASE_URL}/reset-password?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your VoiceFlow AI password',
    text: `Click here to reset your password (valid for ${env().PASSWORD_RESET_TTL}):\n\n${resetUrl}`,
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const complexity = validatePasswordComplexity(input.password);
  if (!complexity.ok) throw new AppError('bad_request', complexity.reason, 400);
  const tokenHash = sha256(input.token);
  const record = await PasswordResetTokenModel.findOne({ tokenHash });
  if (!record) throw new AppError('bad_request', 'Invalid or expired token', 400);
  if (record.usedAt) throw new AppError('bad_request', 'Token already used', 400);
  if (record.expiresAt.getTime() < Date.now()) {
    throw new AppError('bad_request', 'Token expired', 400);
  }

  const passwordHash = await hashPassword(input.password);
  await UserModel.updateOne({ _id: record.userId }, { $set: { passwordHash } });
  await PasswordResetTokenModel.updateOne(
    { _id: record._id },
    { $set: { usedAt: new Date() } },
  );
  // Revoke all active refresh tokens for safety
  await RefreshTokenModel.updateMany(
    { userId: record.userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

async function issueTokens(user: {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  roleId: Types.ObjectId;
}): Promise<AuthTokens> {
  const accessToken = signAccessToken({
    sub: String(user._id),
    cid: String(user.companyId),
    rid: String(user.roleId),
  });
  const { token: refreshToken, jti } = signRefreshToken({
    sub: String(user._id),
    cid: String(user.companyId),
  });
  await RefreshTokenModel.create({
    userId: user._id,
    companyId: user.companyId,
    jti,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + ttlToMs(env().JWT_REFRESH_TTL)),
  });
  return { accessToken, refreshToken };
}

async function replacedJti(refreshToken: string): Promise<string> {
  return verifyRefreshToken(refreshToken).jti;
}
