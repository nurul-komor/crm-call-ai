import { Router } from 'express';

import { AppError } from '../../lib/errors.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/requirePermission.js';

import { CallService } from './service.js';

export const callsRouter = Router();
callsRouter.use(authenticate);

function svc(req: Express.Request): CallService {
  if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
  return new CallService(req.user.companyId);
}

callsRouter.get('/', requirePermission('calls:read'), async (req, res, next) => {
  try {
    const { campaignId, status, limit, cursor } = req.query as Record<string, string | undefined>;
    res.json(
      await svc(req).list({
        campaignId,
        status,
        limit: limit ? Number(limit) : undefined,
        cursor,
      }),
    );
  } catch (err) {
    next(err);
  }
});

callsRouter.get('/:id', requirePermission('calls:read'), async (req, res, next) => {
  try {
    res.json(await svc(req).getById(req.params.id ?? ''));
  } catch (err) {
    next(err);
  }
});
