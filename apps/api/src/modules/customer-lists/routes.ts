import { Router } from 'express';

import { AppError } from '../../lib/errors.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/requirePermission.js';

import { CreateListDto, CustomerListService } from './service.js';

export const customerListsRouter = Router();
customerListsRouter.use(authenticate);

function svc(req: Express.Request): CustomerListService {
  if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
  return new CustomerListService(req.user.companyId);
}

customerListsRouter.post('/', requirePermission('customer-lists:create'), async (req, res, next) => {
  try {
    const input = CreateListDto.parse(req.body);
    res.status(201).json(await svc(req).create(input));
  } catch (err) {
    next(err);
  }
});

customerListsRouter.get('/', requirePermission('customer-lists:read'), async (req, res, next) => {
  try {
    res.json(await svc(req).list());
  } catch (err) {
    next(err);
  }
});

customerListsRouter.delete(
  '/:id',
  requirePermission('customer-lists:delete'),
  async (req, res, next) => {
    try {
      await svc(req).remove(req.params.id ?? '');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

customerListsRouter.get(
  '/:id/resolve',
  requirePermission('customer-lists:read'),
  async (req, res, next) => {
    try {
      const ids = await svc(req).resolve(req.params.id ?? '');
      res.json({ customerIds: ids.map((i) => String(i)), count: ids.length });
    } catch (err) {
      next(err);
    }
  },
);
