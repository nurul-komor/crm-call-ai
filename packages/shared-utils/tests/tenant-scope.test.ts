import { describe, expect, it, vi } from 'vitest';

import { CrossTenantViolationError, scoped } from '../src/tenant-scope.js';

function fakeModel() {
  return {
    find: vi.fn((f: unknown) => ({ kind: 'find', filter: f })),
    findOne: vi.fn((f: unknown) => ({ kind: 'findOne', filter: f })),
    findById: vi.fn((id: unknown) => ({ kind: 'findById', id })),
    countDocuments: vi.fn((f: unknown) => ({ kind: 'count', filter: f })),
    create: vi.fn(async (p: unknown) => ({ kind: 'create', payload: p })),
    updateOne: vi.fn((f: unknown, u: unknown) => ({ kind: 'updateOne', filter: f, update: u })),
    updateMany: vi.fn((f: unknown, u: unknown) => ({ kind: 'updateMany', filter: f, update: u })),
    deleteOne: vi.fn((f: unknown) => ({ kind: 'deleteOne', filter: f })),
    deleteMany: vi.fn((f: unknown) => ({ kind: 'deleteMany', filter: f })),
    exists: vi.fn((f: unknown) => ({ kind: 'exists', filter: f })),
  };
}

describe('scoped()', () => {
  const COMPANY = '64b7c1e2c1a2a30000000000';
  const OTHER = '64b7c1e2c1a2a30000000099';

  it('stamps companyId onto every read', () => {
    const m = fakeModel();
    const repo = scoped(m, COMPANY);
    repo.find({ status: 'active' });
    expect(m.find).toHaveBeenCalledWith({ status: 'active', companyId: COMPANY });

    repo.findOne({ email: 'x' });
    expect(m.findOne).toHaveBeenCalledWith({ email: 'x', companyId: COMPANY });

    repo.findById('abc');
    expect(m.findOne).toHaveBeenLastCalledWith({ _id: 'abc', companyId: COMPANY });

    repo.countDocuments();
    expect(m.countDocuments).toHaveBeenCalledWith({ companyId: COMPANY });

    repo.exists({ key: 'v' });
    expect(m.exists).toHaveBeenCalledWith({ key: 'v', companyId: COMPANY });
  });

  it('stamps companyId on create() (single + array)', async () => {
    const m = fakeModel();
    const repo = scoped(m, COMPANY);
    await repo.create({ name: 'x' });
    expect(m.create).toHaveBeenCalledWith({ name: 'x', companyId: COMPANY });

    await repo.create([{ a: 1 }, { b: 2 }]);
    expect(m.create).toHaveBeenLastCalledWith([
      { a: 1, companyId: COMPANY },
      { b: 2, companyId: COMPANY },
    ]);
  });

  it('throws when a filter targets a different companyId', () => {
    const repo = scoped(fakeModel(), COMPANY);
    expect(() => repo.find({ companyId: OTHER })).toThrowError(CrossTenantViolationError);
    expect(() =>
      repo.updateOne({ companyId: OTHER }, { $set: { name: 'x' } }),
    ).toThrowError(CrossTenantViolationError);
  });

  it('throws when an update tries to mutate companyId via $set', () => {
    const repo = scoped(fakeModel(), COMPANY);
    expect(() =>
      repo.updateMany({}, { $set: { companyId: OTHER, name: 'x' } }),
    ).toThrowError(CrossTenantViolationError);
  });

  it('allows filter to include the matching companyId redundantly', () => {
    const m = fakeModel();
    const repo = scoped(m, COMPANY);
    repo.find({ companyId: COMPANY, status: 'active' });
    expect(m.find).toHaveBeenCalledWith({ status: 'active', companyId: COMPANY });
  });
});
