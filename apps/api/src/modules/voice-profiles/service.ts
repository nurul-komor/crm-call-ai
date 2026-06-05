import { Types } from 'mongoose';

import { AppError } from '../../lib/errors.js';

import { VoiceProfileModel } from './model.js';

import type { CreateVoiceProfileInput, UpdateVoiceProfileInput } from './dto.js';

export class VoiceProfileService {
  constructor(private readonly companyId: string) {}

  async create(input: CreateVoiceProfileInput): Promise<Record<string, unknown>> {
    try {
      if (input.isDefault) await this.clearDefault();
      const doc = await VoiceProfileModel.create({ ...input, companyId: this.companyId });
      return doc.toObject();
    } catch (err) {
      if (isDupKey(err)) {
        throw new AppError('conflict', 'Voice with this voiceId already configured', 409);
      }
      throw err;
    }
  }

  async list(): Promise<Array<Record<string, unknown>>> {
    return VoiceProfileModel.find({ companyId: this.companyId }).sort({ createdAt: -1 }).lean();
  }

  async update(id: string, input: UpdateVoiceProfileInput): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    if (input.isDefault) await this.clearDefault(id);
    const doc = await VoiceProfileModel.findOneAndUpdate(
      { _id: id, companyId: this.companyId },
      { $set: input },
      { new: true },
    ).lean();
    if (!doc) throw new AppError('not_found', 'Voice profile not found', 404);
    return doc;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const res = await VoiceProfileModel.deleteOne({ _id: id, companyId: this.companyId });
    if (res.deletedCount === 0) throw new AppError('not_found', 'Voice profile not found', 404);
  }

  private async clearDefault(excludeId?: string): Promise<void> {
    const filter: Record<string, unknown> = { companyId: this.companyId, isDefault: true };
    if (excludeId) filter._id = { $ne: excludeId };
    await VoiceProfileModel.updateMany(filter, { $set: { isDefault: false } });
  }
}

function isDupKey(err: unknown): boolean {
  return err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000;
}
