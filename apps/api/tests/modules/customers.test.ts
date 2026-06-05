import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { CompanyModel } from '../../src/modules/companies/model.js';
import { ContactChannelModel } from '../../src/modules/contact-channels/model.js';
import { CustomerModel } from '../../src/modules/customers/model.js';
import { CustomerListModel } from '../../src/modules/customer-lists/model.js';
import { RoleModel } from '../../src/modules/roles/model.js';
import { UserModel } from '../../src/modules/users/model.js';
import { RefreshTokenModel } from '../../src/modules/auth/refresh-token.model.js';
import { startInMemoryReplSet, stopInMemoryReplSet } from '../mongo-rs.js';

const app = createApp({ disableRateLimit: true });

const SIGNUP = (email = 'admin@acme.test') => ({
  companyName: 'Acme',
  email,
  password: 'aValidPassw0rd!',
  firstName: 'Ada',
  lastName: 'L',
});

beforeAll(async () => {
  await startInMemoryReplSet();
}, 60_000);
afterAll(async () => {
  await stopInMemoryReplSet();
});
beforeEach(async () => {
  for (const m of [
    CustomerModel,
    CustomerListModel,
    ContactChannelModel,
    UserModel,
    RoleModel,
    CompanyModel,
    RefreshTokenModel,
  ]) {
    await m.deleteMany({});
  }
});

async function bootstrapTenant(email = 'admin@acme.test'): Promise<{ token: string }> {
  const res = await request(app).post('/api/v1/auth/signup').send(SIGNUP(email)).expect(201);
  return { token: res.body.accessToken };
}

describe('customers CRUD', () => {
  it('blocks unauthenticated', async () => {
    const res = await request(app).get('/api/v1/customers');
    expect(res.status).toBe(401);
  });

  it('full CRUD round-trip', async () => {
    const { token } = await bootstrapTenant();
    const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

    const created = await auth(
      request(app).post('/api/v1/customers').send({
        name: 'Alice',
        phone: '+14155551111',
        email: 'alice@example.com',
        tags: ['vip'],
      }),
    );
    expect(created.status).toBe(201);
    const id = created.body._id;

    const got = await auth(request(app).get(`/api/v1/customers/${id}`));
    expect(got.status).toBe(200);
    expect(got.body.name).toBe('Alice');

    const updated = await auth(
      request(app).put(`/api/v1/customers/${id}`).send({ status: 'do_not_contact' }),
    );
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('do_not_contact');

    const list = await auth(request(app).get('/api/v1/customers?tag=vip'));
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);

    const removed = await auth(request(app).delete(`/api/v1/customers/${id}`));
    expect(removed.status).toBe(204);

    const afterDelete = await auth(request(app).get(`/api/v1/customers/${id}`));
    expect(afterDelete.status).toBe(404);
  });

  it('cross-tenant isolation', async () => {
    const a = await bootstrapTenant('a@acme.test');
    const b = await bootstrapTenant('admin@beta.test');

    const created = await request(app)
      .post('/api/v1/customers')
      .set('authorization', `Bearer ${a.token}`)
      .send({ name: 'Alice', phone: '+14155552222' })
      .expect(201);

    const seenByB = await request(app)
      .get(`/api/v1/customers/${created.body._id}`)
      .set('authorization', `Bearer ${b.token}`);
    expect(seenByB.status).toBe(404);

    const listByB = await request(app)
      .get('/api/v1/customers')
      .set('authorization', `Bearer ${b.token}`);
    expect(listByB.status).toBe(200);
    expect(listByB.body.items).toHaveLength(0);
  });

  it('rejects bad phone formats', async () => {
    const { token } = await bootstrapTenant();
    const res = await request(app)
      .post('/api/v1/customers')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'X', phone: 'not-a-number' });
    expect(res.status).toBe(400);
  });

  it('CSV import upserts and reports per-row errors', async () => {
    const { token } = await bootstrapTenant();
    const csv =
      'name,phone,email,tags\n' +
      'Alice,+14155551111,alice@x.com,vip;active\n' +
      ',+14155552222,,\n' +
      'Carol,bad-phone,c@x.com,\n' +
      'Dave,+14155553333,d@x.com,gold\n';
    const res = await request(app)
      .post('/api/v1/customers/import')
      .set('authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv, 'utf8'), 'customers.csv');
    expect(res.status).toBe(202);
    expect(res.body.created).toBe(2);
    expect(res.body.skipped).toBe(2);
    expect(res.body.errors).toHaveLength(2);

    const list = await request(app)
      .get('/api/v1/customers')
      .set('authorization', `Bearer ${token}`);
    expect(list.body.items).toHaveLength(2);
  });

  it('CSV export round-trips imported data', async () => {
    const { token } = await bootstrapTenant();
    await request(app)
      .post('/api/v1/customers/import')
      .set('authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('name,phone\nAlice,+14155551111\n', 'utf8'), 'c.csv')
      .expect(202);

    const res = await request(app)
      .get('/api/v1/customers/export.csv')
      .set('authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('Alice');
    expect(res.text).toContain('+14155551111');
  });
});

describe('contact channels', () => {
  it('CRUD with isDefault clearing siblings of same type', async () => {
    const { token } = await bootstrapTenant();
    const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

    const a = await auth(
      request(app).post('/api/v1/contact-channels').send({
        type: 'phone',
        provider: 'twilio',
        number: '+14155551001',
        friendlyName: 'Sales A',
        isDefault: true,
      }),
    );
    expect(a.status).toBe(201);

    const b = await auth(
      request(app).post('/api/v1/contact-channels').send({
        type: 'phone',
        provider: 'twilio',
        number: '+14155551002',
        friendlyName: 'Sales B',
        isDefault: true,
      }),
    );
    expect(b.status).toBe(201);

    const list = await auth(request(app).get('/api/v1/contact-channels'));
    const defaults = list.body.filter((c: { isDefault?: boolean }) => c.isDefault === true);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].number).toBe('+14155551002');

    // Duplicate number → conflict
    const dup = await auth(
      request(app).post('/api/v1/contact-channels').send({
        type: 'phone',
        provider: 'twilio',
        number: '+14155551001',
      }),
    );
    expect(dup.status).toBe(409);
  });
});

describe('customer lists', () => {
  it('creates a static list and resolves to its members', async () => {
    const { token } = await bootstrapTenant();
    const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

    const c1 = await auth(
      request(app).post('/api/v1/customers').send({ name: 'A', phone: '+14155551001' }),
    );
    const c2 = await auth(
      request(app).post('/api/v1/customers').send({ name: 'B', phone: '+14155551002' }),
    );

    const list = await auth(
      request(app).post('/api/v1/customer-lists').send({
        name: 'Top 2',
        type: 'static',
        staticIds: [c1.body._id, c2.body._id],
      }),
    );
    expect(list.status).toBe(201);

    const resolved = await auth(request(app).get(`/api/v1/customer-lists/${list.body._id}/resolve`));
    expect(resolved.body.count).toBe(2);
    expect(resolved.body.customerIds.sort()).toEqual(
      [c1.body._id, c2.body._id].sort(),
    );
  });

  it('creates a dynamic list and resolves via filter', async () => {
    const { token } = await bootstrapTenant();
    const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

    await auth(
      request(app).post('/api/v1/customers').send({ name: 'V', phone: '+14155553001', tags: ['vip'] }),
    );
    await auth(
      request(app).post('/api/v1/customers').send({ name: 'X', phone: '+14155553002', tags: ['cold'] }),
    );

    const list = await auth(
      request(app).post('/api/v1/customer-lists').send({
        name: 'VIPs',
        type: 'dynamic',
        filter: { tags: ['vip'] },
      }),
    );
    expect(list.status).toBe(201);

    const resolved = await auth(request(app).get(`/api/v1/customer-lists/${list.body._id}/resolve`));
    expect(resolved.body.count).toBe(1);
  });
});
