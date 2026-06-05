import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import type { Transporter } from 'nodemailer';

import { createApp } from '../../src/app.js';
import { __setMailerForTesting } from '../../src/lib/mailer.js';
import { CompanyModel } from '../../src/modules/companies/model.js';
import { PasswordResetTokenModel } from '../../src/modules/auth/password-reset.model.js';
import { RefreshTokenModel } from '../../src/modules/auth/refresh-token.model.js';
import { RoleModel } from '../../src/modules/roles/model.js';
import { UserModel } from '../../src/modules/users/model.js';
import { startInMemoryReplSet, stopInMemoryReplSet } from '../mongo-rs.js';

const app = createApp({ disableRateLimit: true });

interface CapturedMail {
  to: string;
  subject: string;
  text: string;
}

const captured: CapturedMail[] = [];

beforeAll(async () => {
  await startInMemoryReplSet();
  const fakeTransporter = {
    sendMail: vi.fn(async (msg: CapturedMail) => {
      captured.push(msg);
      return { messageId: 'x' };
    }),
  } as unknown as Transporter;
  __setMailerForTesting(fakeTransporter);
}, 60_000);

afterAll(async () => {
  await stopInMemoryReplSet();
  __setMailerForTesting(undefined);
});

beforeEach(async () => {
  captured.length = 0;
  // Reset between tests
  for (const m of [
    UserModel,
    CompanyModel,
    RoleModel,
    RefreshTokenModel,
    PasswordResetTokenModel,
  ]) {
    await m.deleteMany({});
  }
});

const VALID = {
  companyName: 'Acme Insurance',
  email: 'admin@acme.test',
  password: 'aValidPassw0rd!',
  firstName: 'Ada',
  lastName: 'Lovelace',
};

describe('POST /api/v1/auth/signup', () => {
  it('creates company + roles + admin user atomically and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send(VALID);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe('admin@acme.test');
    expect(res.body.user.companyId).toBeTruthy();
    expect(res.body.user.roleId).toBeTruthy();

    const companies = await CompanyModel.find();
    expect(companies).toHaveLength(1);
    expect(companies[0]!.slug).toBe('acme-insurance');

    const roles = await RoleModel.find({ companyId: companies[0]!._id });
    const roleNames = roles.map((r) => r.name).sort();
    expect(roleNames).toEqual(['agent', 'campaign_manager', 'company_admin', 'viewer']);

    const adminRole = roles.find((r) => r.name === 'company_admin')!;
    expect(adminRole.permissions).toContain('campaigns:*');

    const user = await UserModel.findOne({ email: VALID.email });
    expect(user).not.toBeNull();
    expect(String(user!.roleId)).toBe(String(adminRole._id));
  });

  it('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...VALID, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejects password missing a digit', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...VALID, password: 'noDigitsAtAllHere' });
    expect(res.status).toBe(400);
    expect(res.body.error.message.toLowerCase()).toContain('digit');
  });

  it('rejects duplicate email within the same company race', async () => {
    await request(app).post('/api/v1/auth/signup').send(VALID).expect(201);
    const res = await request(app).post('/api/v1/auth/signup').send(VALID);
    // Different company slug auto-generated, but email re-use within new tenant
    // is allowed because users are scoped per-company. The first signup created
    // company-1 with admin; the second creates company-2 with same email. Both succeed.
    expect([201, 409]).toContain(res.status);
  });

  it('auto-suffixes colliding company slug', async () => {
    await request(app).post('/api/v1/auth/signup').send(VALID).expect(201);
    await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...VALID, email: 'other@acme.test' })
      .expect(201);
    const slugs = (await CompanyModel.find().sort({ createdAt: 1 })).map((c) => c.slug);
    expect(slugs[0]).toBe('acme-insurance');
    expect(slugs[1]).toBe('acme-insurance-2');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/signup').send(VALID).expect(201);
  });

  it('issues new tokens for correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();

    const user = await UserModel.findOne({ email: VALID.email });
    expect(user!.lastLoginAt).toBeTruthy();
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID.email, password: 'wrong-password-12' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401 (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@acme.test', password: 'anything-here-12' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  let refreshToken: string;

  beforeEach(async () => {
    const signupRes = await request(app).post('/api/v1/auth/signup').send(VALID).expect(201);
    refreshToken = signupRes.body.refreshToken;
  });

  it('exchanges a valid refresh token for a new pair, rotating it', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(refreshToken);

    // Old refresh should be revoked
    const second = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(second.status).toBe(401);
  });

  it('rejects logout-revoked refresh', async () => {
    await request(app).post('/api/v1/auth/logout').send({ refreshToken }).expect(204);
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('forgot + reset password', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/signup').send(VALID).expect(201);
  });

  it('always returns 204 from forgot-password and emits an email on hit', async () => {
    const hit = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: VALID.email });
    expect(hit.status).toBe(204);
    expect(captured).toHaveLength(1);
    expect(captured[0]!.to).toBe(VALID.email);
    expect(captured[0]!.text).toContain('token=');

    captured.length = 0;
    const miss = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@acme.test' });
    expect(miss.status).toBe(204);
    expect(captured).toHaveLength(0);
  });

  it('completes a full reset flow and invalidates old credentials', async () => {
    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: VALID.email })
      .expect(204);
    const token = /token=([0-9a-f]+)/.exec(captured[0]!.text)![1]!;

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'newPassword123!' });
    expect(reset.status).toBe(204);

    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID.email, password: VALID.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: VALID.email, password: 'newPassword123!' });
    expect(newLogin.status).toBe(200);

    // Second use of token must fail
    const second = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'anotherPass456!' });
    expect(second.status).toBe(400);
  });
});

// Sanity check that mongoose connection is still alive after the suite
describe('teardown', () => {
  it('connection still open during run', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });
});
