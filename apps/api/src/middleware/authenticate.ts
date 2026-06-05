import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { getRedis } from '../lib/redis.js';
import { RoleModel } from '../modules/roles/model.js';

export interface RequestUser {
  id: string;
  companyId: string;
  roleId: string;
  permissions: ReadonlySet<string>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

const ROLE_CACHE_TTL_SEC = 300;
const ROLE_CACHE_PREFIX = 'role-perms:';

async function loadRolePermissions(roleId: string): Promise<string[]> {
  const redis = getRedis();
  const cached = await redis.get(ROLE_CACHE_PREFIX + roleId);
  if (cached) return JSON.parse(cached) as string[];
  const role = await RoleModel.findById(roleId).lean();
  if (!role) return [];
  await redis.setex(ROLE_CACHE_PREFIX + roleId, ROLE_CACHE_TTL_SEC, JSON.stringify(role.permissions));
  return role.permissions;
}

/** Invalidate the cached permission set for a role (call on role update). */
export async function invalidateRolePermissions(roleId: string): Promise<void> {
  await getRedis().del(ROLE_CACHE_PREFIX + roleId);
}

export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const header = req.header('authorization');
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('unauthenticated', 'Missing bearer token', 401);
    }
    const token = header.slice('Bearer '.length).trim();
    const claims = verifyAccessToken(token);
    const permissions = await loadRolePermissions(claims.rid);
    req.user = {
      id: claims.sub,
      companyId: claims.cid,
      roleId: claims.rid,
      permissions: new Set(permissions),
    };
    next();
  } catch (err) {
    next(err);
  }
};
