import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/requirePermission.js';

import * as controller from './controller.js';

export const contactChannelsRouter = Router();

contactChannelsRouter.use(authenticate);

contactChannelsRouter.post('/', requirePermission('contact-channels:create'), controller.create);
contactChannelsRouter.get('/', requirePermission('contact-channels:read'), controller.list);
contactChannelsRouter.put('/:id', requirePermission('contact-channels:update'), controller.update);
contactChannelsRouter.delete(
  '/:id',
  requirePermission('contact-channels:delete'),
  controller.remove,
);
