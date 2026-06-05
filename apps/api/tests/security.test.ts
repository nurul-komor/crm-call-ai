import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';

describe('security middleware', () => {
  it('sets helmet security headers', async () => {
    const app = createApp({ disableRateLimit: true });
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows configured CORS origin and rejects others on preflight', async () => {
    const app = createApp({ disableRateLimit: true });

    const ok = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://allowed.test')
      .set('Access-Control-Request-Method', 'GET');
    expect(ok.headers['access-control-allow-origin']).toBe('http://allowed.test');

    const blocked = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://evil.test')
      .set('Access-Control-Request-Method', 'GET');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
