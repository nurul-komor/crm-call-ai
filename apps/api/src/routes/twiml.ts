import { Router } from 'express';

import { env } from '../config/env.js';
import { CallModel } from '../modules/calls/model.js';
import { twilioSignature } from '../middleware/twilioSignature.js';

export const twimlRouter = Router();

// Twilio posts URL-encoded form data.
twimlRouter.use((req, res, next) => {
  // express.urlencoded already mounted globally; nothing extra here.
  next();
});

twimlRouter.post('/voice/:callJobId', twilioSignature, async (req, res, next) => {
  try {
    const { callJobId } = req.params;
    const call = await CallModel.findOne({ callJobId }).lean();
    if (!call) {
      res.type('application/xml').send('<Response><Hangup/></Response>');
      return;
    }
    const wsHost = env().TWILIO_MEDIA_STREAM_WS_HOST;
    if (!wsHost) {
      // Misconfigured deploy — refuse the call rather than dangle.
      res.type('application/xml').send('<Response><Hangup/></Response>');
      return;
    }
    const streamUrl = `wss://${wsHost}/voice/${callJobId}`;
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(streamUrl)}" />
  </Connect>
</Response>`,
    );
  } catch (err) {
    next(err);
  }
});

twimlRouter.post('/status/:callJobId', twilioSignature, async (req, res, next) => {
  try {
    const { callJobId } = req.params;
    const body = req.body as Record<string, string | undefined>;
    const update: Record<string, unknown> = {};
    const sid = body.CallSid;
    if (sid) update.callSid = sid;
    const status = body.CallStatus;
    if (status) update.status = mapTwilioStatus(status, body.AnsweredBy);
    if (body.AnsweredBy) update.answeredBy = body.AnsweredBy;
    const duration = body.CallDuration;
    if (duration) {
      update.durationSec = Number(duration);
      update.endedAt = new Date();
    }
    if (Object.keys(update).length > 0) {
      await CallModel.updateOne({ callJobId }, { $set: update });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

function mapTwilioStatus(twilio: string, answeredBy?: string): string {
  switch (twilio) {
    case 'queued':
    case 'initiated':
      return 'initiated';
    case 'ringing':
      return 'ringing';
    case 'in-progress':
      if (answeredBy?.startsWith('machine')) return 'answering_machine';
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'busy':
      return 'busy';
    case 'no-answer':
      return 'no_answer';
    case 'failed':
    case 'canceled':
      return 'failed';
    default:
      return 'initiated';
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
