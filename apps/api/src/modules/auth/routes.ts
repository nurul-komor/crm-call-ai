import { Router } from 'express';

import * as controller from './controller.js';

export const authRouter = Router();

authRouter.post('/signup', controller.signup);
authRouter.post('/login', controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);
authRouter.post('/forgot-password', controller.forgotPassword);
authRouter.post('/reset-password', controller.resetPassword);
