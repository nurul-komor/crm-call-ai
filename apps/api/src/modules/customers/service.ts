import { Types } from 'mongoose';

import { scoped } from '@voiceflow/shared-utils';

import { AppError } from '../../lib/errors.js';

import { CustomerModel } from './model.js';

import type {
  CreateCustomerInput,
  ListCustomersQueryInput,
  UpdateCustomerInput,
} from './dto.js';

export interface CustomerListResult {
  items: Array<Record<string, unknown>>;
  nextCursor: string | null;
}

export class CustomerService {
  constructor(private readonly companyId: string) {}

  private get repo() {
    return scoped(CustomerModel, this.companyId);
  }

  async create(input: CreateCustomerInput): Promise<Record<string, unknown>> {
    try {
      const doc = await CustomerModel.create({ ...input, companyId: this.companyId });
      return doc.toObject();
    } catch (err) {
      if (isDupKey(err)) throw new AppError('conflict', 'A customer with this phone already exists', 409);
      throw err;
    }
  }

  async getById(id: string): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const doc = await (this.repo.findById(id) as ReturnType<typeof CustomerModel.findOne>)
      .lean();
    if (!doc) throw new AppError('not_found', 'Customer not found', 404);
    return doc;
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    try {
      const doc = await CustomerModel.findOneAndUpdate(
        { _id: id, companyId: this.companyId },
        { $set: input },
        { new: true },
      ).lean();
      if (!doc) throw new AppError('not_found', 'Customer not found', 404);
      return doc;
    } catch (err) {
      if (isDupKey(err)) throw new AppError('conflict', 'A customer with this phone already exists', 409);
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const res = await CustomerModel.deleteOne({ _id: id, companyId: this.companyId });
    if (res.deletedCount === 0) throw new AppError('not_found', 'Customer not found', 404);
  }

  async list(query: ListCustomersQueryInput): Promise<CustomerListResult> {
    const filter: Record<string, unknown> = { companyId: this.companyId };
    if (query.status) filter.status = query.status;
    if (query.tag) filter.tags = query.tag;
    if (query.search) {
      const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe } },
      ];
    }
    if (query.cursor) {
      if (!Types.ObjectId.isValid(query.cursor)) {
        throw new AppError('bad_request', 'Invalid cursor', 400);
      }
      filter._id = { $lt: new Types.ObjectId(query.cursor) };
    }
    const docs = await CustomerModel.find(filter).sort({ _id: -1 }).limit(query.limit + 1).lean();
    const items = docs.slice(0, query.limit);
    const nextCursor = docs.length > query.limit ? String(items.at(-1)?._id) : null;
    return { items, nextCursor };
  }
}

function isDupKey(err: unknown): boolean {
  return err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000;
}
