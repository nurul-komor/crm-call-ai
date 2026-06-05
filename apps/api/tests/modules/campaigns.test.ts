import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { AiProviderModel } from '../../src/modules/ai-providers/model.js';
import { CampaignModel } from '../../src/modules/campaigns/model.js';
import { CampaignRunModel } from '../../src/modules/campaigns/campaign-run.model.js';
import { setDispatcher } from '../../src/modules/campaigns/dispatcher.js';
import { CompanyModel } from '../../src/modules/companies/model.js';
import { ContactChannelModel } from '../../src/modules/contact-channels/model.js';
import { CustomerListModel } from '../../src/modules/customer-lists/model.js';
import { CustomerModel } from '../../src/modules/customers/model.js';
import { RoleModel } from '../../src/modules/roles/model.js';
import { UserModel } from '../../src/modules/users/model.js';
import { VoiceProfileModel } from '../../src/modules/voice-profiles/model.js';
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
});

beforeEach(async () => {
  for (const m of [
    CampaignRunModel,
    CampaignModel,
    CustomerListModel,
    CustomerModel,
    AiProviderModel,
    VoiceProfileModel,
    ContactChannelModel,
    UserModel,
    RoleModel,
    CompanyModel,
  ]) {
    await m.deleteMany({});
  }
});

interface Refs {
  token: string;
  channelId: string;
  voiceId: string;
  aiId: string;
  listId: string;
}

async function bootstrap(): Promise<Refs> {
  const { body: signup } = await request(app)
    .post('/api/v1/auth/signup')
    .send(SIGNUP)
    .expect(201);
  const token = signup.accessToken;
  const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);

  const channel = await auth(
    request(app).post('/api/v1/contact-channels').send({
      type: 'phone',
      provider: 'twilio',
      number: '+14155551111',
      isDefault: true,
    }),
  );
  const voice = await auth(
    request(app).post('/api/v1/voice-profiles').send({
      name: 'Sarah',
      voiceId: 'voice-test-1',
      isDefault: true,
    }),
  );
  const ai = await auth(
    request(app).post('/api/v1/ai-providers').send({
      provider: 'openai',
      apiKey: 'sk-test-key-1234567890',
      model: 'gpt-4o-mini',
      isDefault: true,
    }),
  );

  const c1 = await auth(
    request(app).post('/api/v1/customers').send({ name: 'A', phone: '+14155552001' }),
  );
  const c2 = await auth(
    request(app).post('/api/v1/customers').send({ name: 'B', phone: '+14155552002' }),
  );
  const list = await auth(
    request(app).post('/api/v1/customer-lists').send({
      name: 'All',
      type: 'static',
      staticIds: [c1.body._id, c2.body._id],
    }),
  );

  return {
    token,
    channelId: channel.body._id,
    voiceId: voice.body._id,
    aiId: ai.body.id,
    listId: list.body._id,
  };
}

function campaignPayload(r: Refs) {
  return {
    name: 'Welcome calls',
    type: 'phone_call',
    primaryChannel: r.channelId,
    customerListId: r.listId,
    aiProviderId: r.aiId,
    voiceProfileId: r.voiceId,
    agent: {
      systemPrompt:
        'You are Sarah from ABC Insurance. Greet, ask name, ask budget. Keep under 2 minutes.',
      requiredQuestions: ['What is your name?', 'What is your budget?'],
      extractionFields: [
        { key: 'name', type: 'string' as const, required: true },
        { key: 'budget', type: 'number' as const },
      ],
      leadScoringRules: [{ when: 'budget > 1000', points: 40 }],
    },
  };
}

describe('campaigns', () => {
  it('create + read + list + update + delete (full CRUD)', async () => {
    const r = await bootstrap();
    const auth = (req: request.Test) => req.set('authorization', `Bearer ${r.token}`);

    const created = await auth(request(app).post('/api/v1/campaigns').send(campaignPayload(r)));
    expect(created.status).toBe(201);
    const id = created.body._id;

    const got = await auth(request(app).get(`/api/v1/campaigns/${id}`));
    expect(got.body.name).toBe('Welcome calls');

    const updated = await auth(
      request(app).put(`/api/v1/campaigns/${id}`).send({ description: 'Q4 batch' }),
    );
    expect(updated.body.description).toBe('Q4 batch');

    const list = await auth(request(app).get('/api/v1/campaigns'));
    expect(list.body).toHaveLength(1);

    await auth(request(app).delete(`/api/v1/campaigns/${id}`)).expect(204);
  });

  it('rejects creation with bad references', async () => {
    const r = await bootstrap();
    const auth = (req: request.Test) => req.set('authorization', `Bearer ${r.token}`);

    const bad = await auth(
      request(app).post('/api/v1/campaigns').send({
        ...campaignPayload(r),
        aiProviderId: '64aabbccddeeff0011223344',
      }),
    );
    expect(bad.status).toBe(400);
    expect(bad.body.error.message).toMatch(/aiProviderId/);
  });

  it('launch enqueues via dispatcher and transitions draft→scheduled', async () => {
    const r = await bootstrap();
    const auth = (req: request.Test) => req.set('authorization', `Bearer ${r.token}`);
    const created = await auth(request(app).post('/api/v1/campaigns').send(campaignPayload(r)));
    const id = created.body._id;

    const dispatchSpy = vi.fn(async (plan: { customerIds: string[] }) => ({
      enqueuedCount: plan.customerIds.length,
    }));
    setDispatcher(dispatchSpy);

    const launched = await auth(request(app).post(`/api/v1/campaigns/${id}/launch`));
    expect(launched.status).toBe(200);
    expect(launched.body.enqueued).toBe(2);
    expect(launched.body.campaignRunId).toBeTruthy();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);

    const after = await auth(request(app).get(`/api/v1/campaigns/${id}`));
    expect(after.body.status).toBe('scheduled');
    expect(after.body.stats.enqueuedCalls).toBe(2);

    const run = await CampaignRunModel.findOne({ campaignId: id });
    expect(run?.status).toBe('running');
    expect(run?.totalCustomers).toBe(2);
  });

  it('rejects launch when customer list is empty', async () => {
    const r = await bootstrap();
    const auth = (req: request.Test) => req.set('authorization', `Bearer ${r.token}`);

    // Build a dynamic list that matches nothing
    const emptyList = await auth(
      request(app).post('/api/v1/customer-lists').send({
        name: 'Nobody',
        type: 'dynamic',
        filter: { tags: ['nonexistent-tag'] },
      }),
    );

    const created = await auth(
      request(app).post('/api/v1/campaigns').send({
        ...campaignPayload(r),
        customerListId: emptyList.body._id,
      }),
    );
    const launch = await auth(request(app).post(`/api/v1/campaigns/${created.body._id}/launch`));
    expect(launch.status).toBe(400);
    expect(launch.body.error.message).toMatch(/empty/i);
  });

  it('pause + resume + cannot update while scheduled', async () => {
    const r = await bootstrap();
    const auth = (req: request.Test) => req.set('authorization', `Bearer ${r.token}`);
    const created = await auth(request(app).post('/api/v1/campaigns').send(campaignPayload(r)));
    const id = created.body._id;
    setDispatcher(async (p) => ({ enqueuedCount: p.customerIds.length }));
    await auth(request(app).post(`/api/v1/campaigns/${id}/launch`)).expect(200);

    const editWhileScheduled = await auth(
      request(app).put(`/api/v1/campaigns/${id}`).send({ name: 'x' }),
    );
    expect(editWhileScheduled.status).toBe(409);

    await auth(request(app).post(`/api/v1/campaigns/${id}/pause`)).expect(204);
    const editWhilePaused = await auth(
      request(app).put(`/api/v1/campaigns/${id}`).send({ name: 'y' }),
    );
    expect(editWhilePaused.status).toBe(200);

    await auth(request(app).post(`/api/v1/campaigns/${id}/resume`)).expect(204);
    const after = await auth(request(app).get(`/api/v1/campaigns/${id}`));
    expect(after.body.status).toBe('scheduled');
  });
});
