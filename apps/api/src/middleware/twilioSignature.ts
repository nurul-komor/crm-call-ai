import type { RequestHandler } from 'express';
import twilio from 'twilio';

import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

/** Validates `X-Twilio-Signature` against TWILIO_AUTH_TOKEN + the full URL + sorted form params. */
export const twilioSignature: RequestHandler = (req, _res, next) => {
  const token = env().TWILIO_AUTH_TOKEN;
  if (!token) {
    // In dev with no token, allow through but warn
    if (env().NODE_ENV !== 'production') return next();
    return next(new AppError('forbidden', 'Twilio auth token not configured', 403));
  }
  const signature = req.header('x-twilio-signature');
  if (!signature) {
    return next(new AppError('forbidden', 'Missing X-Twilio-Signature', 403));
  }
  // Twilio expects POSTed form params + the *full* public URL we registered.
  // TWILIO_WEBHOOK_BASE_URL is the public origin (e.g. https://abc.ngrok.app).
  const base = env().TWILIO_WEBHOOK_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const fullUrl = `${base}${req.originalUrl}`;
  const params = (req.body ?? {}) as Record<string, string>;
  const valid = twilio.validateRequest(token, signature, fullUrl, params);
  if (!valid) return next(new AppError('forbidden', 'Invalid Twilio signature', 403));
  next();
};
