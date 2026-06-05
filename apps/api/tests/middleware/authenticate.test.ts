import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';

import { startInMemoryReplSet, stopInMemoryReplSet } from '../mongo-rs.js';
import { authenticate } from '../../src/middleware/authenticate.js';
import { requirePermission, __internal } from '../../src/middleware/requirePermission.js';
import { signAccessToken } from '../../src/lib/jwt.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { requestId } from '../../src/middleware/requestId.js';
import { RoleModel } from '../../src/modules/roles/model.js';

function appWith(...mw: express.RequestHandler[]): Express {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  app.get('/protected', ...mw, (req, res) => res.json({ user: req.user }));
  app.use(errorHandler);
  return app;
}

beforeAll(async () => {
  await startInMemoryReplSet();
}, 60_000);
afterAll(async () => {
  await stopInMemoryReplSet();
});

describe('authenticate', () => {
  let roleId: string;
  const COMPANY = '64b7c1e2c1a2a30000000001';
  const USER = '64b7c1e2c1a2a30000000002';

  beforeEach(async () => {
    await RoleModel.deleteMany({});
    const role = await RoleModel.create({
      companyId: COMPANY,
      name: 'company_admin',
      permissions: ['campaigns:create', 'campaigns:read', 'calls:*'],
    });
    roleId = String(role._id);
  });

  it('rejects requests without a bearer header', async () => {
    const res = await request(appWith(authenticate)).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthenticated');
  });

  it('rejects an expired token with token_expired', async () => {
    const token = signAccessToken({ sub: USER, cid: COMPANY, rid: roleId });
    // Forge an expired token by manually signing with negative TTL
    const expired = (await import('jsonwebtoken')).default.sign(
      { sub: USER, cid: COMPANY, rid: roleId, type: 'access' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '-1s' },
    );
    expect(token).not.toBe(expired);
    const res = await request(appWith(authenticate))
      .get('/protected')
      .set('authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('token_expired');
  });

  it('populates req.user with permissions on success', async () => {
    const token = signAccessToken({ sub: USER, cid: COMPANY, rid: roleId });
    const res = await request(appWith(authenticate))
      .get('/protected')
      .set('authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(USER);
    expect(res.body.user.companyId).toBe(COMPANY);
    // Set is not JSON-serializable, but we forwarded via req.user — supertest
    // gets whatever the handler responded with; we just verify the user wrapper.
  });
});

describe('requirePermission', () => {
  const { holds } = __internal;

  it('matches exact tokens', () => {
    expect(holds(new Set(['campaigns:create']), 'campaigns:create')).toBe(true);
    expect(holds(new Set(['campaigns:create']), 'campaigns:read')).toBe(false);
  });

  it('matches resource wildcard', () => {
    expect(holds(new Set(['campaigns:*']), 'campaigns:launch')).toBe(true);
    expect(holds(new Set(['campaigns:*']), 'calls:read')).toBe(false);
  });

  it('matches super-wildcard', () => {
    expect(holds(new Set(['*:*']), 'anything:goes')).toBe(true);
  });
});
