import { Router } from 'express';

import { AppError } from '../../lib/errors.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/requirePermission.js';

import { CreateAiProviderDto, UpdateAiProviderDto } from './dto.js';
import { AiProviderService } from './service.js';

export const aiProvidersRouter = Router();
aiProvidersRouter.use(authenticate);

function svc(req: Express.Request): AiProviderService {
  if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
  return new AiProviderService(req.user.companyId);
}

aiProvidersRouter.post(
  '/',
  requirePermission('ai-providers:create'),
  async (req, res, next) => {
    try {
      res.status(201).json(await svc(req).create(CreateAiProviderDto.parse(req.body)));
    } catch (err) {
      next(err);
    }
  },
);

aiProvidersRouter.get('/', requirePermission('ai-providers:read'), async (req, res, next) => {
  try {
    res.json(await svc(req).list());
  } catch (err) {
    next(err);
  }
});

aiProvidersRouter.put('/:id', requirePermission('ai-providers:update'), async (req, res, next) => {
  try {
    res.json(await svc(req).update(req.params.id ?? '', UpdateAiProviderDto.parse(req.body)));
  } catch (err) {
    next(err);
  }
});

aiProvidersRouter.delete(
  '/:id',
  requirePermission('ai-providers:delete'),
  async (req, res, next) => {
    try {
      await svc(req).remove(req.params.id ?? '');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
