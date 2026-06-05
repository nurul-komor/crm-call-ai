import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../lib/errors.js';

/**
 * Tokens are of the form `<resource>:<action>`. Stored tokens may use
 * wildcards: `resource:*` matches any action on resource; `*:*` matches
 * everything.
 *
 * The handler accepts one or more required tokens; the user must hold
 * (a token matching) ALL of them to pass.
 */
export function requirePermission(...required: string[]): RequestHandler {
  if (required.length === 0) {
    throw new Error('requirePermission called with no tokens');
  }
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(new AppError('unauthenticated', 'Authentication required', 401));
    for (const need of required) {
      if (!holds(user.permissions, need)) {
        return next(
          new AppError('forbidden', `Missing required permission: ${need}`, 403, { need }),
        );
      }
    }
    next();
  };
}

function holds(grants: ReadonlySet<string>, need: string): boolean {
  if (grants.has('*:*')) return true;
  if (grants.has(need)) return true;
  const colon = need.indexOf(':');
  if (colon > 0) {
    const resource = need.slice(0, colon);
    if (grants.has(`${resource}:*`)) return true;
    if (grants.has(`*:${need.slice(colon + 1)}`)) return true;
  }
  return false;
}

/** Exported for unit tests. */
export const __internal = { holds };
