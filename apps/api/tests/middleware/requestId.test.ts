import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../../src/app.js';

describe('requestId middleware', () => {
  it('assigns a UUID when no x-request-id header is present', async () => {
    const app = createApp({ disableRateLimit: true });
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('echoes a valid x-request-id from the request', async () => {
    const app = createApp({ disableRateLimit: true });
    const res = await request(app)
      .get('/api/v1/health')
      .set('x-request-id', 'caller-abc-12345678');
    expect(res.headers['x-request-id']).toBe('caller-abc-12345678');
  });

  it('replaces a malformed x-request-id', async () => {
    const app = createApp({ disableRateLimit: true });
    const res = await request(app).get('/api/v1/health').set('x-request-id', '!!');
    expect(res.headers['x-request-id']).not.toBe('!!');
  });
});
