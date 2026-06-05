import type { Request, Response, NextFunction } from 'express';

import { AppError } from '../../lib/errors.js';

import { CreateCustomerDto, ListCustomersQuery, UpdateCustomerDto } from './dto.js';
import { exportCustomersCsv, importCustomersCsv } from './import.js';
import { CustomerService } from './service.js';

function svc(req: Request): CustomerService {
  if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
  return new CustomerService(req.user.companyId);
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = CreateCustomerDto.parse(req.body);
    const doc = await svc(req).create(input);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await svc(req).getById(req.params.id ?? '');
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = UpdateCustomerDto.parse(req.body);
    const doc = await svc(req).update(req.params.id ?? '', input);
    res.json(doc);
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

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = ListCustomersQuery.parse(req.query);
    const result = await svc(req).list(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function importCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError('bad_request', 'CSV file required (multipart field "file")', 400);
    const csv = file.buffer.toString('utf8');
    const result = await importCustomersCsv(csv, req.user.companyId);
    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('unauthenticated', 'Authentication required', 401);
    const csv = await exportCustomersCsv(req.user.companyId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
