/**
 * Tenant-scoping repository helper.
 *
 * Wraps a Mongoose Model so every read/write is automatically constrained
 * to the caller's companyId. Throws CrossTenantViolation if a filter or
 * payload explicitly targets a *different* companyId, defending against
 * accidental cross-tenant access from buggy or hostile callers.
 *
 * Usage:
 *
 *     import { scoped } from '@voiceflow/shared-utils';
 *     const repo = scoped(CustomerModel, companyId);
 *     await repo.find({ status: 'active' });
 *     await repo.create({ name: 'Acme', ... });   // companyId stamped on
 *
 * This intentionally exposes only the small slice of mongoose API we want
 * repositories to use — there is no escape hatch back to the raw model.
 */

export class CrossTenantViolationError extends Error {
  readonly code = 'cross_tenant_violation';
  constructor(message = 'Attempt to access another tenant') {
    super(message);
    this.name = 'CrossTenantViolationError';
  }
}

type ObjectIdLike = { toString(): string } | string;

interface ScopableModel<TDoc> {
  find: (filter: Record<string, unknown>) => unknown;
  findOne: (filter: Record<string, unknown>) => unknown;
  findById: (id: ObjectIdLike) => unknown;
  countDocuments: (filter: Record<string, unknown>) => unknown;
  create: (payload: Record<string, unknown> | Record<string, unknown>[]) => Promise<TDoc | TDoc[]>;
  updateOne: (filter: Record<string, unknown>, update: Record<string, unknown>) => unknown;
  updateMany: (filter: Record<string, unknown>, update: Record<string, unknown>) => unknown;
  deleteOne: (filter: Record<string, unknown>) => unknown;
  deleteMany: (filter: Record<string, unknown>) => unknown;
  exists: (filter: Record<string, unknown>) => unknown;
}

function assertSameTenant(
  filter: Record<string, unknown> | undefined,
  expectedCompanyId: string,
): void {
  if (!filter || !('companyId' in filter)) return;
  const v = filter.companyId;
  if (v === undefined || v === null) return;
  const supplied = typeof v === 'string' ? v : (v as { toString?: () => string }).toString?.();
  if (supplied && supplied !== expectedCompanyId) {
    throw new CrossTenantViolationError(
      `Filter targets companyId=${supplied} but caller is scoped to ${expectedCompanyId}`,
    );
  }
}

function withCompanyId<T extends Record<string, unknown>>(
  filter: T | undefined,
  companyId: string,
): Record<string, unknown> {
  return { ...(filter ?? {}), companyId };
}

export interface ScopedRepository<TDoc> {
  find(filter?: Record<string, unknown>): ReturnType<ScopableModel<TDoc>['find']>;
  findOne(filter?: Record<string, unknown>): ReturnType<ScopableModel<TDoc>['findOne']>;
  findById(id: ObjectIdLike): ReturnType<ScopableModel<TDoc>['findOne']>;
  countDocuments(
    filter?: Record<string, unknown>,
  ): ReturnType<ScopableModel<TDoc>['countDocuments']>;
  create(payload: Record<string, unknown> | Record<string, unknown>[]): Promise<TDoc | TDoc[]>;
  updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): ReturnType<ScopableModel<TDoc>['updateOne']>;
  updateMany(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): ReturnType<ScopableModel<TDoc>['updateMany']>;
  deleteOne(filter: Record<string, unknown>): ReturnType<ScopableModel<TDoc>['deleteOne']>;
  deleteMany(filter: Record<string, unknown>): ReturnType<ScopableModel<TDoc>['deleteMany']>;
  exists(filter?: Record<string, unknown>): ReturnType<ScopableModel<TDoc>['exists']>;
}

export function scoped<TDoc>(
  model: ScopableModel<TDoc>,
  companyId: string,
): ScopedRepository<TDoc> {
  if (!companyId) throw new Error('scoped() requires a non-empty companyId');

  return {
    find(filter = {}) {
      assertSameTenant(filter, companyId);
      return model.find(withCompanyId(filter, companyId));
    },
    findOne(filter = {}) {
      assertSameTenant(filter, companyId);
      return model.findOne(withCompanyId(filter, companyId));
    },
    findById(id) {
      return model.findOne(withCompanyId({ _id: id }, companyId));
    },
    countDocuments(filter = {}) {
      assertSameTenant(filter, companyId);
      return model.countDocuments(withCompanyId(filter, companyId));
    },
    create(payload) {
      if (Array.isArray(payload)) {
        for (const item of payload) assertSameTenant(item, companyId);
        return model.create(payload.map((p) => ({ ...p, companyId })));
      }
      assertSameTenant(payload, companyId);
      return model.create({ ...payload, companyId });
    },
    updateOne(filter, update) {
      assertSameTenant(filter, companyId);
      // Prevent set/setOnInsert overriding the tenant
      const sanitized = sanitizeUpdate(update, companyId);
      return model.updateOne(withCompanyId(filter, companyId), sanitized);
    },
    updateMany(filter, update) {
      assertSameTenant(filter, companyId);
      const sanitized = sanitizeUpdate(update, companyId);
      return model.updateMany(withCompanyId(filter, companyId), sanitized);
    },
    deleteOne(filter) {
      assertSameTenant(filter, companyId);
      return model.deleteOne(withCompanyId(filter, companyId));
    },
    deleteMany(filter) {
      assertSameTenant(filter, companyId);
      return model.deleteMany(withCompanyId(filter, companyId));
    },
    exists(filter = {}) {
      assertSameTenant(filter, companyId);
      return model.exists(withCompanyId(filter, companyId));
    },
  };
}

function sanitizeUpdate(update: Record<string, unknown>, companyId: string): Record<string, unknown> {
  // Don't allow $set / $setOnInsert / direct field to mutate companyId
  const out: Record<string, unknown> = { ...update };
  for (const op of ['$set', '$setOnInsert', '$unset'] as const) {
    const sub = out[op];
    if (sub && typeof sub === 'object' && 'companyId' in (sub as Record<string, unknown>)) {
      const supplied = (sub as Record<string, unknown>).companyId;
      const str = typeof supplied === 'string' ? supplied : String(supplied);
      if (str !== companyId) {
        throw new CrossTenantViolationError(
          `Update ${op}.companyId=${str} differs from scope ${companyId}`,
        );
      }
    }
  }
  if ('companyId' in out) {
    const supplied = String(out.companyId);
    if (supplied !== companyId) {
      throw new CrossTenantViolationError(
        `Update top-level companyId=${supplied} differs from scope ${companyId}`,
      );
    }
  }
  return out;
}
