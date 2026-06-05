import { z } from 'zod';

export const CreateAiProviderDto = z.object({
  provider: z.enum(['openai', 'claude', 'gemini', 'openrouter']),
  apiKey: z.string().min(8).max(500),
  model: z.string().min(1).max(120),
  label: z.string().max(120).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type CreateAiProviderInput = z.infer<typeof CreateAiProviderDto>;

export const UpdateAiProviderDto = CreateAiProviderDto.partial().omit({ provider: true });
export type UpdateAiProviderInput = z.infer<typeof UpdateAiProviderDto>;
