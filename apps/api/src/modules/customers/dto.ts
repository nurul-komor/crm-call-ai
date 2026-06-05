import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

const E164 = z
  .string()
  .min(2)
  .max(20)
  .refine((s) => isValidPhoneNumber(s), 'Invalid phone (E.164 expected, e.g. +14155551234)')
  .transform((s) => parsePhoneNumber(s).number);

export const CreateCustomerDto = z.object({
  name: z.string().min(1).max(200),
  phone: E164.optional(),
  whatsappNumber: E164.optional(),
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  tags: z.array(z.string().min(1).max(40)).max(50).optional(),
  customFields: z.record(z.unknown()).optional(),
  status: z.enum(['active', 'do_not_contact']).optional(),
  notes: z.string().max(5000).optional(),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerDto>;

export const UpdateCustomerDto = CreateCustomerDto.partial();
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerDto>;

export const ListCustomersQuery = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'do_not_contact']).optional(),
  tag: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});
export type ListCustomersQueryInput = z.infer<typeof ListCustomersQuery>;
