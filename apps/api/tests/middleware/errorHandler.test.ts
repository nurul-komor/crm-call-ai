import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';

import { AppError } from '../../src/lib/errors.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { requestId } from '../../src/middleware/requestId.js';

function appWith(handler: express.RequestHandler): Express {
  const app = express();
  app.use(requestId);
  app.get('/x', handler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('shapes AppError into structured JSON', async () => {
    const app = appWith((_req, _res, next) =>
      next(new AppError('not_found', 'thing not found', 404)),
    );
    const res = await request(app).get('/x');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      error: { code: 'not_found', message: 'thing not found' },
    });
    expect(res.body.error.requestId).toBeTruthy();
  });

  it('maps unknown errors to 500 internal_error', async () => {
    const app = appWith((_req, _res, next) => next(new Error('boom')));
    const res = await request(app).get('/x');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('internal_error');
  });
});
