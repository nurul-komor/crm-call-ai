import { z } from 'zod';

export const SignupDto = z.object({
  companyName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(12).max(200),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});
export type SignupInput = z.infer<typeof SignupDto>;

export const LoginDto = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof LoginDto>;

export const RefreshDto = z.object({
  refreshToken: z.string().min(20),
});
export type RefreshInput = z.infer<typeof RefreshDto>;

export const ForgotPasswordDto = z.object({
  email: z.string().email().toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordDto>;

export const ResetPasswordDto = z.object({
  token: z.string().min(20),
  password: z.string().min(12).max(200),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordDto>;
