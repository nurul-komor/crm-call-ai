import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const app = createApp({ disableRateLimit: true });
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['x-request-id']).toMatch(/[0-9a-f-]{36}/);
  });

  it('returns 404 with a typed error payload for unknown routes', async () => {
    const app = createApp({ disableRateLimit: true });
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
    expect(res.body.error.requestId).toBeTruthy();
  });
});
