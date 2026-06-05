import { Queue } from 'bullmq';
import { Types } from 'mongoose';

import { QUEUE_NAMES, type PostCallJob } from '@voiceflow/shared-types';
import { decrypt } from '@voiceflow/shared-utils';

import { env } from '../config.js';
import { publishCallEvent } from '../events.js';
import { log } from '../logger.js';
import { Call } from '../models/call.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { redis } from '../redis.js';
import { OpenAiSttClient } from '../stt/openAiSttClient.js';
import { ElevenLabsTtsClient } from '../tts/elevenLabsClient.js';

import { CallSession } from './CallSession.js';

import type { WebSocket as WsWebSocket } from 'ws';

let _postCallQueue: Queue<PostCallJob> | undefined;
function postCallQueue(): Queue<PostCallJob> {
  if (_postCallQueue) return _postCallQueue;
  _postCallQueue = new Queue<PostCallJob>(QUEUE_NAMES.postCall, {
    prefix: env().BULLMQ_PREFIX,
    connection: redis(),
  });
  return _postCallQueue;
}

/**
 * Build a CallSession bound to the given Twilio WS. Looks up:
 *   - Call → campaignRunId → CampaignRun.campaignSnapshot
 * to derive the system prompt, voice profile, and AI provider key (decrypted
 * with the master key from env).
 */
export async function buildSession(opts: {
  twilioWs: WsWebSocket;
  callJobId: string;
}): Promise<CallSession | null> {
  const call = await Call.findOne({ callJobId: opts.callJobId }).lean();
  if (!call) return null;

  const { CampaignRun, AiProvider, VoiceProfile } = await loadAdjacentModels();
  const run = await CampaignRun.findById(call.campaignRunId).lean();
  if (!run) return null;
  const snapshot = run.campaignSnapshot as {
    agent?: { systemPrompt?: string; name?: string };
    aiProviderId?: Types.ObjectId | string;
    voiceProfileId?: Types.ObjectId | string;
  };
  const systemPrompt = snapshot.agent?.systemPrompt ?? 'You are a friendly AI agent.';
  const greeting = `Hello, this is ${snapshot.agent?.name || 'your AI agent'} calling. May I have a moment of your time?`;

  const provider = await AiProvider.findById(snapshot.aiProviderId).select('+apiKey').lean();
  if (!provider) {
    log().warn({ callJobId: opts.callJobId }, 'AI provider not found for campaign');
    return null;
  }
  const apiKey = decrypt(
    provider.apiKey as {
      ciphertext: string;
      iv: string;
      tag: string;
      v: number;
    },
    Buffer.from(masterKey(), 'base64'),
  );

  const voice = await VoiceProfile.findById(snapshot.voiceProfileId).lean();
  if (!voice) {
    log().warn({ callJobId: opts.callJobId }, 'Voice profile not found for campaign');
    return null;
  }
  const elevenKey = process.env.ELEVENLABS_API_KEY ?? '';

  const ai = new OpenAIProvider({ apiKey, model: provider.modelName as string });
  const stt = new OpenAiSttClient({ apiKey });
  const tts = new ElevenLabsTtsClient({ apiKey: elevenKey, voiceId: voice.voiceId as string });

  return new CallSession({
    twilioWs: opts.twilioWs,
    callJobId: opts.callJobId,
    systemPrompt,
    greeting,
    ai,
    stt,
    tts,
    onTurn: (turn) => {
      // fire-and-forget transcript write
      Call.updateOne(
        { callJobId: opts.callJobId },
        { $push: { transcript: turn } },
      ).catch((err) =>
        log().warn({ err, callJobId: opts.callJobId }, 'transcript write failed'),
      );
      // Real-time event for the dashboard
      publishCallEvent(String(call.companyId), {
        type: 'call.turn',
        callId: String(call._id),
        callJobId: opts.callJobId,
        role: turn.role,
        text: turn.text,
        at: turn.at.toISOString(),
      }).catch((err) =>
        log().warn({ err, callJobId: opts.callJobId }, 'turn event publish failed'),
      );
    },
    onEnd: async (reason) => {
      try {
        const status =
          reason === 'answering_machine' ? 'answering_machine' : 'completed';
        await Call.updateOne(
          { callJobId: opts.callJobId },
          { $set: { endedAt: new Date(), status } },
        );
        await publishCallEvent(String(call.companyId), {
          type: 'call.ended',
          callId: String(call._id),
          callJobId: opts.callJobId,
          status,
        });
        // Enqueue post-call processing (summary, extraction, lead score).
        if (reason !== 'answering_machine') {
          await postCallQueue().add(
            QUEUE_NAMES.postCall,
            { callId: String(call._id), companyId: String(call.companyId) },
            { jobId: String(call._id) },
          );
        }
      } catch (err) {
        log().warn({ err, callJobId: opts.callJobId }, 'end handler failed');
      }
    },
  });
}

function masterKey(): string {
  const k = process.env.ENCRYPTION_MASTER_KEY;
  if (!k) throw new Error('ENCRYPTION_MASTER_KEY not configured');
  return k;
}

async function loadAdjacentModels() {
  // Lazy-define models the worker also needs to read but doesn't write.
  const mongoose = (await import('mongoose')).default;
  const { Schema } = mongoose;
  const get = <T>(name: string, schema: import('mongoose').Schema): import('mongoose').Model<T> => {
    return (
      (mongoose.models[name] as unknown as import('mongoose').Model<T>) ??
      mongoose.model<T>(name, schema)
    );
  };

  void env(); // ensure env validated
  const CampaignRun = get<{ campaignSnapshot: unknown }>('CampaignRun', new Schema({}, { strict: false }));
  const AiProvider = get<{ apiKey: unknown; modelName: string }>(
    'AiProvider',
    new Schema({}, { strict: false }),
  );
  const VoiceProfile = get<{ voiceId: string }>('VoiceProfile', new Schema({}, { strict: false }));
  return { CampaignRun, AiProvider, VoiceProfile };
}
