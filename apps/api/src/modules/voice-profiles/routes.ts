import { Router } from 'express';

import { AppError } from '../../lib/errors.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/requirePermission.js';

import { CreateVoiceProfileDto, UpdateVoiceProfileDto } from './dto.js';
import { listVoices } from './elevenLabsClient.js';
import { VoiceProfileService } from './service.js';

export const voiceProfilesRouter = Router();
voiceProfilesRouter.use(authenticate);

function svc(req: Express.Request): VoiceProfileService {
  if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
  return new VoiceProfileService(req.user.companyId);
}

voiceProfilesRouter.get(
  '/catalog',
  requirePermission('voice-profiles:read'),
  async (_req, res, next) => {
    try {
      res.json({ voices: await listVoices() });
    } catch (err) {
      next(err);
    }
  },
);

voiceProfilesRouter.post(
  '/',
  requirePermission('voice-profiles:create'),
  async (req, res, next) => {
    try {
      res.status(201).json(await svc(req).create(CreateVoiceProfileDto.parse(req.body)));
    } catch (err) {
      next(err);
    }
  },
);

voiceProfilesRouter.get('/', requirePermission('voice-profiles:read'), async (req, res, next) => {
  try {
    res.json(await svc(req).list());
  } catch (err) {
    next(err);
  }
});

voiceProfilesRouter.put(
  '/:id',
  requirePermission('voice-profiles:update'),
  async (req, res, next) => {
    try {
      res.json(await svc(req).update(req.params.id ?? '', UpdateVoiceProfileDto.parse(req.body)));
    } catch (err) {
      next(err);
    }
  },
);

voiceProfilesRouter.delete(
  '/:id',
  requirePermission('voice-profiles:delete'),
  async (req, res, next) => {
    try {
      await svc(req).remove(req.params.id ?? '');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
