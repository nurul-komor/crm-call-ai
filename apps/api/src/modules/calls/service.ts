import { Types } from 'mongoose';

import { AppError } from '../../lib/errors.js';

import { CallModel } from './model.js';

export class CallService {
  constructor(private readonly companyId: string) {}

  async list(
    opts: { campaignId?: string; status?: string; limit?: number; cursor?: string } = {},
  ): Promise<{ items: Array<Record<string, unknown>>; nextCursor: string | null }> {
    const filter: Record<string, unknown> = { companyId: this.companyId };
    if (opts.campaignId) filter.campaignId = opts.campaignId;
    if (opts.status) filter.status = opts.status;
    if (opts.cursor) {
      if (!Types.ObjectId.isValid(opts.cursor)) {
        throw new AppError('bad_request', 'Invalid cursor', 400);
      }
      filter._id = { $lt: new Types.ObjectId(opts.cursor) };
    }
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const docs = await CallModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();
    const items = docs.slice(0, limit);
    const nextCursor = docs.length > limit ? String(items.at(-1)?._id) : null;
    return { items, nextCursor };
  }

  async getById(id: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const doc = await CallModel.findOne({ _id: id, companyId: this.companyId }).lean();
    if (!doc) throw new AppError('not_found', 'Call not found', 404);
    return doc;
  }
}
