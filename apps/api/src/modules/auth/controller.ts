import type { Request, Response, NextFunction } from 'express';

import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  ResetPasswordDto,
  SignupDto,
} from './dto.js';
import * as service from './service.js';

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = SignupDto.parse(req.body);
    const result = await service.signup(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = LoginDto.parse(req.body);
    const result = await service.login(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = RefreshDto.parse(req.body);
    const tokens = await service.refresh(input);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = RefreshDto.parse(req.body);
    await service.logout(input.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ForgotPasswordDto.parse(req.body);
    await service.forgotPassword(input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = ResetPasswordDto.parse(req.body);
    await service.resetPassword(input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
