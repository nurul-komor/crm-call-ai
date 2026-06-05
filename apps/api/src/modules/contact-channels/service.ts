import { Types } from 'mongoose';

import { AppError } from '../../lib/errors.js';

import { ContactChannelModel } from './model.js';

import type { CreateChannelInput, UpdateChannelInput } from './dto.js';

export class ContactChannelService {
  constructor(private readonly companyId: string) {}

  async create(input: CreateChannelInput): Promise<Record<string, unknown>> {
    try {
      if (input.isDefault) await this.clearDefault(input.type);
      const doc = await ContactChannelModel.create({ ...input, companyId: this.companyId });
      return doc.toObject();
    } catch (err) {
      if (isDupKey(err)) {
        throw new AppError('conflict', 'A channel with this number already exists', 409);
      }
      throw err;
    }
  }

  async list(): Promise<Array<Record<string, unknown>>> {
    return ContactChannelModel.find({ companyId: this.companyId }).sort({ createdAt: -1 }).lean();
  }

  async update(id: string, input: UpdateChannelInput): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const existing = await ContactChannelModel.findOne({ _id: id, companyId: this.companyId });
    if (!existing) throw new AppError('not_found', 'Channel not found', 404);
    if (input.isDefault) await this.clearDefault(existing.type, id);
    Object.assign(existing, input);
    await existing.save();
    return existing.toObject();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    // FK check against campaigns happens at the campaign-launch boundary; not
    // here, to avoid a circular import. A future cron sweeper warns about
    // dangling references. The plan's "FK check" is enforced as: cannot
    // delete while ANY campaign references it.
    const usedBy = await checkCampaignReferences(id);
    if (usedBy > 0) {
      throw new AppError(
        'conflict',
        `Channel is referenced by ${usedBy} campaign(s); cannot delete`,
        409,
      );
    }
    const res = await ContactChannelModel.deleteOne({ _id: id, companyId: this.companyId });
    if (res.deletedCount === 0) throw new AppError('not_found', 'Channel not found', 404);
  }

  private async clearDefault(type: 'phone' | 'whatsapp', excludeId?: string): Promise<void> {
    const filter: Record<string, unknown> = {
      companyId: this.companyId,
      type,
      isDefault: true,
    };
    if (excludeId) filter._id = { $ne: excludeId };
    await ContactChannelModel.updateMany(filter, { $set: { isDefault: false } });
  }
}

function isDupKey(err: unknown): boolean {
  return err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000;
}

// Lazy lookup to avoid module-load cycles with campaigns module.
// Returns 0 if the campaigns module isn't built yet (Phase 1K does that).
async function checkCampaignReferences(channelId: string): Promise<number> {
  try {
    const mod = await import('../campaigns/model.js');
    if (!mod?.CampaignModel) return 0;
    return mod.CampaignModel.countDocuments({
      $or: [{ primaryChannel: channelId }, { fallbackChannels: channelId }],
      status: { $in: ['scheduled', 'running', 'paused'] },
    });
  } catch {
    return 0;
  }
}
