import { z } from 'zod';

export const CreateVoiceProfileDto = z.object({
  name: z.string().min(1).max(120),
  voiceId: z.string().min(1).max(200),
  provider: z.literal('elevenlabs').default('elevenlabs'),
  language: z.string().min(2).max(10).default('en'),
  gender: z.enum(['male', 'female', 'neutral']).optional(),
  description: z.string().max(2000).optional(),
  isDefault: z.boolean().optional(),
});
export type CreateVoiceProfileInput = z.infer<typeof CreateVoiceProfileDto>;

export const UpdateVoiceProfileDto = CreateVoiceProfileDto.partial();
export type UpdateVoiceProfileInput = z.infer<typeof UpdateVoiceProfileDto>;
