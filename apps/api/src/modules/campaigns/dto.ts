import { z } from 'zod';

const ObjectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid ObjectId');

const AgentDto = z.object({
  name: z.string().max(120).optional().default(''),
  personality: z.string().max(2000).optional().default(''),
  systemPrompt: z.string().min(10).max(20_000),
  language: z.string().default('en'),
  requiredQuestions: z.array(z.string().min(1).max(500)).max(50).optional().default([]),
  extractionFields: z
    .array(
      z.object({
        key: z.string().min(1).max(60),
        type: z.enum(['string', 'number', 'boolean', 'date', 'enum']),
        description: z.string().max(500).optional(),
        enumValues: z.array(z.string()).optional(),
        required: z.boolean().optional(),
      }),
    )
    .optional()
    .default([]),
  leadScoringRules: z
    .array(z.object({ when: z.string().min(1).max(500), points: z.number().int() }))
    .optional()
    .default([]),
  successCriteria: z.string().max(2000).optional().default(''),
  maxTurnSec: z.number().int().min(30).max(1800).optional().default(900),
});

const ScheduleDto = z
  .object({
    startAt: z.coerce.date().optional(),
    workingHours: z
      .object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
        timezone: z.string().default('UTC'),
      })
      .optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  })
  .optional()
  .default({});

const RetryRulesDto = z
  .object({
    maxRetries: z.number().int().min(0).max(10).default(3),
    retryAfterHours: z.number().int().min(1).max(168).default(24),
  })
  .optional()
  .default({});

export const CreateCampaignDto = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['phone_call', 'whatsapp_call', 'whatsapp_chat', 'hybrid']),
  primaryChannel: ObjectId.optional(),
  fallbackChannels: z.array(ObjectId).max(10).optional(),
  customerListId: ObjectId,
  aiProviderId: ObjectId,
  voiceProfileId: ObjectId,
  agent: AgentDto,
  schedule: ScheduleDto,
  retryRules: RetryRulesDto,
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignDto>;

export const UpdateCampaignDto = CreateCampaignDto.partial();
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignDto>;
