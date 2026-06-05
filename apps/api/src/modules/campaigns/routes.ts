import { Router } from 'express';

import { AppError } from '../../lib/errors.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/requirePermission.js';

import { CreateCampaignDto, UpdateCampaignDto } from './dto.js';
import { CampaignService } from './service.js';

export const campaignsRouter = Router();
campaignsRouter.use(authenticate);

function svc(req: Express.Request): CampaignService {
  if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
  return new CampaignService(req.user.companyId, req.user.id);
}

campaignsRouter.post('/', requirePermission('campaigns:create'), async (req, res, next) => {
  try {
    res.status(201).json(await svc(req).create(CreateCampaignDto.parse(req.body)));
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get('/', requirePermission('campaigns:read'), async (req, res, next) => {
  try {
    res.json(await svc(req).list());
  } catch (err) {
    next(err);
  }
});

campaignsRouter.get('/:id', requirePermission('campaigns:read'), async (req, res, next) => {
  try {
    res.json(await svc(req).getById(req.params.id ?? ''));
  } catch (err) {
    next(err);
  }
});

campaignsRouter.put('/:id', requirePermission('campaigns:update'), async (req, res, next) => {
  try {
    res.json(await svc(req).update(req.params.id ?? '', UpdateCampaignDto.parse(req.body)));
  } catch (err) {
    next(err);
  }
});

campaignsRouter.delete('/:id', requirePermission('campaigns:delete'), async (req, res, next) => {
  try {
    await svc(req).remove(req.params.id ?? '');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

campaignsRouter.post('/:id/launch', requirePermission('campaigns:launch'), async (req, res, next) => {
  try {
    res.json(await svc(req).launch(req.params.id ?? ''));
  } catch (err) {
    next(err);
  }
});

campaignsRouter.post('/:id/pause', requirePermission('campaigns:update'), async (req, res, next) => {
  try {
    await svc(req).pause(req.params.id ?? '');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

campaignsRouter.post('/:id/resume', requirePermission('campaigns:update'), async (req, res, next) => {
  try {
    await svc(req).resume(req.params.id ?? '');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
