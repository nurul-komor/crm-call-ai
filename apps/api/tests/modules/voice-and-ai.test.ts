import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { AiProviderModel } from '../../src/modules/ai-providers/model.js';
import { CompanyModel } from '../../src/modules/companies/model.js';
import { RoleModel } from '../../src/modules/roles/model.js';
import { UserModel } from '../../src/modules/users/model.js';
import { VoiceProfileModel } from '../../src/modules/voice-profiles/model.js';
import {
  __setElevenLabsFetch,
  clearCatalogCache,
} from '../../src/modules/voice-profiles/elevenLabsClient.js';
import { startInMemoryReplSet, stopInMemoryReplSet } from '../mongo-rs.js';

const app = createApp({ disableRateLimit: true });

const SIGNUP = {
  companyName: 'Acme',
  email: 'admin@acme.test',
  password: 'aValidPassw0rd!',
  firstName: 'Ada',
  lastName: 'L',
};

beforeAll(async () => {
  await startInMemoryReplSet();
}, 60_000);

afterAll(async () => {
  await stopInMemoryReplSet();
  __setElevenLabsFetch(undefined);
});

beforeEach(async () => {
  for (const m of [VoiceProfileModel, AiProviderModel, UserModel, RoleModel, CompanyModel]) {
    await m.deleteMany({});
  }
  await clearCatalogCache();
});

async function tenant(): Promise<{ token: string }> {
  const res = await request(app).post('/api/v1/auth/signup').send(SIGNUP).expect(201);
  return { token: res.body.accessToken };
}

describe('voice-profiles', () => {
  it('CRUD with isDefault clearing siblings', async () => {
    const { token } = await tenant();
    const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

    const a = await auth(
      request(app).post('/api/v1/voice-profiles').send({
        name: 'Sarah',
        voiceId: 'EXAVITQu4vr4xnSDxMaL',
        language: 'en',
        gender: 'female',
        isDefault: true,
      }),
    );
    expect(a.status).toBe(201);

    const b = await auth(
      request(app).post('/api/v1/voice-profiles').send({
        name: 'David',
        voiceId: 'pNInz6obpgDQGcFmaJgB',
        gender: 'male',
        isDefault: true,
      }),
    );
    expect(b.status).toBe(201);

    const list = await auth(request(app).get('/api/v1/voice-profiles'));
    const defaults = list.body.filter((v: { isDefault?: boolean }) => v.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].name).toBe('David');

    // duplicate voiceId rejected
    const dup = await auth(
      request(app).post('/api/v1/voice-profiles').send({
        name: 'SarahCopy',
        voiceId: 'EXAVITQu4vr4xnSDxMaL',
      }),
    );
    expect(dup.status).toBe(409);
  });

  it('catalog proxies ElevenLabs with Redis cache', async () => {
    process.env.ELEVENLABS_API_KEY = 'fake-key-for-tests';
    const { token } = await tenant();
    const fakeFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          voices: [
            {
              voice_id: 'EXAVITQu4vr4xnSDxMaL',
              name: 'Sarah',
              category: 'premade',
              description: 'Friendly female',
              labels: { language: 'en', gender: 'female' },
              preview_url: 'https://example/sample.mp3',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    __setElevenLabsFetch(fakeFetch as unknown as typeof fetch);

    const r1 = await request(app)
      .get('/api/v1/voice-profiles/catalog')
      .set('authorization', `Bearer ${token}`);
    expect(r1.status).toBe(200);
    expect(r1.body.voices[0]).toMatchObject({
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Sarah',
      gender: 'female',
      language: 'en',
    });

    // Second call should be served from cache (fetch not called again)
    await request(app)
      .get('/api/v1/voice-profiles/catalog')
      .set('authorization', `Bearer ${token}`);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it('catalog returns 400 when no API key configured', async () => {
    process.env.ELEVENLABS_API_KEY = '';
    const { token } = await tenant();
    const res = await request(app)
      .get('/api/v1/voice-profiles/catalog')
      .set('authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('ai-providers', () => {
  it('stores apiKey encrypted, never returns it', async () => {
    const { token } = await tenant();
    const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

    const res = await auth(
      request(app).post('/api/v1/ai-providers').send({
        provider: 'openai',
        apiKey: 'sk-test-1234567890abcdef',
        model: 'gpt-4o-mini',
        label: 'Main',
        isDefault: true,
      }),
    );
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.keyHint).toBe('sk-…cdef');
    // CRITICAL: no apiKey in response
    expect(res.body.apiKey).toBeUndefined();

    // On-disk it must be encrypted (not stored plain)
    const raw = await AiProviderModel.findById(res.body.id).select('+apiKey').lean();
    expect(raw).toBeTruthy();
    expect(JSON.stringify(raw)).not.toContain('sk-test-1234567890abcdef');
    expect((raw as unknown as { apiKey: { ciphertext: string } }).apiKey.ciphertext).toBeTruthy();
  });

  it('setting isDefault clears it from siblings of same provider', async () => {
    const { token } = await tenant();
    const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

    await auth(
      request(app).post('/api/v1/ai-providers').send({
        provider: 'openai',
        apiKey: 'sk-keyAAAAAAAA',
        model: 'gpt-4o-mini',
        isDefault: true,
      }),
    ).expect(201);

    await auth(
      request(app).post('/api/v1/ai-providers').send({
        provider: 'openai',
        apiKey: 'sk-keyBBBBBBBB',
        model: 'gpt-4o',
        isDefault: true,
      }),
    ).expect(201);

    const list = await auth(request(app).get('/api/v1/ai-providers'));
    const defaults = list.body.filter((p: { isDefault?: boolean }) => p.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].model).toBe('gpt-4o');
  });

  it('cross-tenant isolation', async () => {
    const a = await tenant();
    await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...SIGNUP, email: 'b@other.test', companyName: 'Beta' })
      .expect(201);
    const b = (await request(app).post('/api/v1/auth/login').send({
      email: 'b@other.test',
      password: SIGNUP.password,
    })).body;

    const created = await request(app)
      .post('/api/v1/ai-providers')
      .set('authorization', `Bearer ${a.token}`)
      .send({ provider: 'openai', apiKey: 'sk-tenant-a-key', model: 'gpt-4o-mini' })
      .expect(201);

    const listByB = await request(app)
      .get('/api/v1/ai-providers')
      .set('authorization', `Bearer ${b.accessToken}`);
    expect(listByB.body).toHaveLength(0);

    const removeByB = await request(app)
      .delete(`/api/v1/ai-providers/${created.body.id}`)
      .set('authorization', `Bearer ${b.accessToken}`);
    expect(removeByB.status).toBe(404);
  });
});
