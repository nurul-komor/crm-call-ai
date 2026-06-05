import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../../lib/errors.js';

import { CreateChannelDto, UpdateChannelDto } from './dto.js';
import { ContactChannelService } from './service.js';

function svc(req: Request): ContactChannelService {
  if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
  return new ContactChannelService(req.user.companyId);
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = CreateChannelDto.parse(req.body);
    res.status(201).json(await svc(req).create(input));
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await svc(req).list());
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = UpdateChannelDto.parse(req.body);
    res.json(await svc(req).update(req.params.id ?? '', input));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await svc(req).remove(req.params.id ?? '');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
