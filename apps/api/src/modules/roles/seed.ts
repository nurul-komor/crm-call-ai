import type { ClientSession, Types } from 'mongoose';

import { DEFAULT_ROLE_NAMES, DEFAULT_ROLE_PERMISSIONS, RoleModel } from './model.js';

/**
 * Idempotently seed the five default roles for a tenant. Safe to call from
 * within a transaction (pass `session`).
 */
export async function seedDefaultRolesForCompany(
  companyId: Types.ObjectId,
  opts: { session?: ClientSession } = {},
): Promise<void> {
  for (const name of DEFAULT_ROLE_NAMES) {
    if (name === 'super_admin') continue; // only the global super_admin exists; not per-tenant
    await RoleModel.updateOne(
      { companyId, name },
      {
        $setOnInsert: {
          companyId,
          name,
          permissions: DEFAULT_ROLE_PERMISSIONS[name],
          isSystem: true,
        },
      },
      { upsert: true, session: opts.session },
    );
  }
}

/** Ensure the global super_admin role exists (no companyId). */
export async function seedSuperAdminRole(opts: { session?: ClientSession } = {}): Promise<void> {
  await RoleModel.updateOne(
    { companyId: null, name: 'super_admin' },
    {
      $setOnInsert: {
        companyId: null,
        name: 'super_admin',
        permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
        isSystem: true,
      },
    },
    { upsert: true, session: opts.session },
  );
}
