import { Types } from 'mongoose';

import { AppError } from '../../lib/errors.js';
import { AiProviderModel } from '../ai-providers/model.js';
import { ContactChannelModel } from '../contact-channels/model.js';
import { CustomerListService } from '../customer-lists/service.js';
import { VoiceProfileModel } from '../voice-profiles/model.js';

import { CampaignRunModel } from './campaign-run.model.js';
import { CampaignModel } from './model.js';
import { getDispatcher } from './dispatcher.js';

import type { CreateCampaignInput, UpdateCampaignInput } from './dto.js';

export class CampaignService {
  constructor(
    private readonly companyId: string,
    private readonly userId?: string,
  ) {}

  async create(input: CreateCampaignInput): Promise<Record<string, unknown>> {
    await this.validateReferences(input);
    const doc = await CampaignModel.create({ ...input, companyId: this.companyId });
    return doc.toObject();
  }

  async getById(id: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const doc = await CampaignModel.findOne({ _id: id, companyId: this.companyId }).lean();
    if (!doc) throw new AppError('not_found', 'Campaign not found', 404);
    return doc;
  }

  async list(): Promise<Array<Record<string, unknown>>> {
    return CampaignModel.find({ companyId: this.companyId }).sort({ createdAt: -1 }).lean();
  }

  async update(id: string, input: UpdateCampaignInput): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const existing = await CampaignModel.findOne({ _id: id, companyId: this.companyId }).lean();
    if (!existing) throw new AppError('not_found', 'Campaign not found', 404);
    if (existing.status === 'running' || existing.status === 'scheduled') {
      throw new AppError(
        'conflict',
        'Cannot edit a scheduled/running campaign; pause it first',
        409,
      );
    }
    await this.validateReferences(input);
    const doc = await CampaignModel.findOneAndUpdate(
      { _id: id, companyId: this.companyId },
      { $set: input },
      { new: true },
    ).lean();
    return doc as Record<string, unknown>;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const doc = await CampaignModel.findOne({ _id: id, companyId: this.companyId }).lean();
    if (!doc) throw new AppError('not_found', 'Campaign not found', 404);
    if (doc.status === 'running' || doc.status === 'scheduled') {
      throw new AppError('conflict', 'Pause the campaign before deleting it', 409);
    }
    await CampaignModel.deleteOne({ _id: id, companyId: this.companyId });
  }

  async launch(id: string): Promise<{ campaignRunId: string; enqueued: number }> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const campaign = await CampaignModel.findOne({ _id: id, companyId: this.companyId }).lean();
    if (!campaign) throw new AppError('not_found', 'Campaign not found', 404);
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new AppError(
        'conflict',
        `Cannot launch a campaign in status ${campaign.status}`,
        409,
      );
    }

    // Phase 1: only phone_call is supported end-to-end; the others get scheduled
    // but their workers in Phase 2/3 will handle them.
    if (campaign.type === 'phone_call' && !campaign.primaryChannel) {
      throw new AppError('bad_request', 'phone_call campaigns require primaryChannel', 400);
    }

    const listSvc = new CustomerListService(this.companyId);
    const customerIds = await listSvc.resolve(String(campaign.customerListId));
    if (customerIds.length === 0) {
      throw new AppError('bad_request', 'Customer list is empty', 400);
    }

    const run = await CampaignRunModel.create({
      companyId: this.companyId,
      campaignId: campaign._id,
      campaignSnapshot: campaign,
      status: 'running',
      totalCustomers: customerIds.length,
      launchedBy: this.userId ? new Types.ObjectId(this.userId) : undefined,
    });

    const { enqueuedCount } = await getDispatcher()(
      { customerIds: customerIds.map((c) => String(c)) },
      { campaignRunId: String(run._id) },
    );

    await CampaignRunModel.updateOne(
      { _id: run._id },
      { $set: { enqueuedCalls: enqueuedCount } },
    );
    await CampaignModel.updateOne(
      { _id: campaign._id },
      {
        $set: {
          status: 'scheduled',
          lastLaunchedAt: new Date(),
          'stats.totalCustomers': customerIds.length,
          'stats.enqueuedCalls': enqueuedCount,
        },
      },
    );

    return { campaignRunId: String(run._id), enqueued: enqueuedCount };
  }

  async pause(id: string): Promise<void> {
    await this.transition(id, ['scheduled', 'running'], 'paused');
  }

  async resume(id: string): Promise<void> {
    await this.transition(id, ['paused'], 'scheduled');
  }

  private async transition(
    id: string,
    fromAny: string[],
    to: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const res = await CampaignModel.updateOne(
      { _id: id, companyId: this.companyId, status: { $in: fromAny } },
      { $set: { status: to } },
    );
    if (res.matchedCount === 0) {
      throw new AppError(
        'conflict',
        `Cannot transition: campaign not in ${fromAny.join('/')}`,
        409,
      );
    }
  }

  private async validateReferences(input: Partial<CreateCampaignInput>): Promise<void> {
    const checks: Array<Promise<unknown>> = [];
    if (input.aiProviderId) {
      checks.push(this.assertExists(AiProviderModel, input.aiProviderId, 'aiProviderId'));
    }
    if (input.voiceProfileId) {
      checks.push(this.assertExists(VoiceProfileModel, input.voiceProfileId, 'voiceProfileId'));
    }
    if (input.primaryChannel) {
      checks.push(this.assertExists(ContactChannelModel, input.primaryChannel, 'primaryChannel'));
    }
    for (const ch of input.fallbackChannels ?? []) {
      checks.push(this.assertExists(ContactChannelModel, ch, 'fallbackChannels'));
    }
    await Promise.all(checks);
  }

  private async assertExists(
    Model: { exists(filter: Record<string, unknown>): unknown },
    id: string,
    field: string,
  ): Promise<void> {
    const exists = await Model.exists({ _id: id, companyId: this.companyId });
    if (!exists) {
      throw new AppError('bad_request', `${field} does not exist in this tenant`, 400);
    }
  }
}
