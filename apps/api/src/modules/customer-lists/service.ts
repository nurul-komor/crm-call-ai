import { Types } from 'mongoose';
import { z } from 'zod';

import { AppError } from '../../lib/errors.js';
import { CustomerModel } from '../customers/model.js';

import { CustomerListModel } from './model.js';

export const CreateListDto = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().max(1000).optional(),
    type: z.enum(['static', 'dynamic']),
    staticIds: z.array(z.string().regex(/^[a-f0-9]{24}$/)).optional(),
    filter: z
      .object({
        tags: z.array(z.string()).optional(),
        status: z.enum(['active', 'do_not_contact']).optional(),
      })
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'static' && (!v.staticIds || v.staticIds.length === 0)) {
      ctx.addIssue({ code: 'custom', message: 'staticIds required for type=static', path: ['staticIds'] });
    }
    if (v.type === 'dynamic' && !v.filter) {
      ctx.addIssue({ code: 'custom', message: 'filter required for type=dynamic', path: ['filter'] });
    }
  });
export type CreateListInput = z.infer<typeof CreateListDto>;

export class CustomerListService {
  constructor(private readonly companyId: string) {}

  async create(input: CreateListInput): Promise<Record<string, unknown>> {
    try {
      const doc = await CustomerListModel.create({ ...input, companyId: this.companyId });
      return doc.toObject();
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code?: number }).code === 11000) {
        throw new AppError('conflict', 'List name already in use', 409);
      }
      throw err;
    }
  }

  async list(): Promise<Array<Record<string, unknown>>> {
    return CustomerListModel.find({ companyId: this.companyId }).sort({ createdAt: -1 }).lean();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const res = await CustomerListModel.deleteOne({ _id: id, companyId: this.companyId });
    if (res.deletedCount === 0) throw new AppError('not_found', 'List not found', 404);
  }

  /** Resolve a list to a stream of customers (used at campaign launch). */
  async resolve(id: string): Promise<Types.ObjectId[]> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const list = await CustomerListModel.findOne({ _id: id, companyId: this.companyId }).lean();
    if (!list) throw new AppError('not_found', 'List not found', 404);

    if (list.type === 'static') {
      return (list.staticIds ?? []) as Types.ObjectId[];
    }

    const filter: Record<string, unknown> = { companyId: this.companyId };
    const f = (list.filter as { tags?: string[]; status?: string } | undefined) ?? {};
    if (f.tags?.length) filter.tags = { $in: f.tags };
    if (f.status) filter.status = f.status;
    const docs = await CustomerModel.find(filter).select('_id').lean();
    return docs.map((d) => d._id as Types.ObjectId);
  }
}
