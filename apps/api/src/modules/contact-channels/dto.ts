import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

const E164 = z
  .string()
  .min(2)
  .max(20)
  .refine((s) => isValidPhoneNumber(s), 'Invalid phone (E.164 expected)')
  .transform((s) => parsePhoneNumber(s).number);

export const CreateChannelDto = z.object({
  type: z.enum(['phone', 'whatsapp']),
  provider: z.enum(['twilio', 'meta', 'vonage', 'plivo']),
  number: E164,
  friendlyName: z.string().max(200).optional(),
  twilioSid: z.string().regex(/^PN[a-fA-F0-9]{32}$/).optional(),
  isDefault: z.boolean().optional(),
});
export type CreateChannelInput = z.infer<typeof CreateChannelDto>;

export const UpdateChannelDto = CreateChannelDto.partial().omit({ number: true, type: true });
export type UpdateChannelInput = z.infer<typeof UpdateChannelDto>;
