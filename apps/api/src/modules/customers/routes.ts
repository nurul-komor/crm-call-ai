import { Router } from 'express';
import multer from 'multer';

import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/requirePermission.js';

import * as controller from './controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const customersRouter = Router();

customersRouter.use(authenticate);

customersRouter.post('/', requirePermission('customers:create'), controller.create);
customersRouter.get('/', requirePermission('customers:read'), controller.list);
customersRouter.get('/export.csv', requirePermission('customers:read'), controller.exportCsv);
customersRouter.post(
  '/import',
  requirePermission('customers:create'),
  upload.single('file'),
  controller.importCsv,
);
customersRouter.get('/:id', requirePermission('customers:read'), controller.getById);
customersRouter.put('/:id', requirePermission('customers:update'), controller.update);
customersRouter.delete('/:id', requirePermission('customers:delete'), controller.remove);
