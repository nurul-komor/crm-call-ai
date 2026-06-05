import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const ScoringRuleSchema = new Schema(
  {
    /** Safe boolean expression evaluated against extractedData (expr-eval) */
    when: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false },
);

const ExtractionFieldSchema = new Schema(
  {
    key: { type: String, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'date', 'enum'], required: true },
    description: String,
    enumValues: [String],
    required: { type: Boolean, default: false },
  },
  { _id: false },
);

const AgentConfigSchema = new Schema(
  {
    name: { type: String, default: '' },
    personality: { type: String, default: '' },
    systemPrompt: { type: String, required: true },
    language: { type: String, default: 'en' },
    requiredQuestions: { type: [String], default: [] },
    /** Extraction schema: list of fields */
    extractionFields: { type: [ExtractionFieldSchema], default: [] },
    leadScoringRules: { type: [ScoringRuleSchema], default: [] },
    successCriteria: { type: String, default: '' },
    maxTurnSec: { type: Number, default: 900 },
  },
  { _id: false },
);

const ScheduleSchema = new Schema(
  {
    startAt: Date,
    workingHours: {
      start: String, // HH:MM
      end: String,   // HH:MM
      timezone: { type: String, default: 'UTC' },
    },
    daysOfWeek: { type: [Number], default: undefined }, // 0..6
  },
  { _id: false },
);

const RetryRulesSchema = new Schema(
  {
    maxRetries: { type: Number, default: 3, min: 0, max: 10 },
    retryAfterHours: { type: Number, default: 24, min: 1, max: 168 },
  },
  { _id: false },
);

const StatsSchema = new Schema(
  {
    totalCustomers: { type: Number, default: 0 },
    enqueuedCalls: { type: Number, default: 0 },
    completedCalls: { type: Number, default: 0 },
    failedCalls: { type: Number, default: 0 },
    qualifiedLeads: { type: Number, default: 0 },
  },
  { _id: false },
);

const CampaignSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    type: {
      type: String,
      enum: ['phone_call', 'whatsapp_call', 'whatsapp_chat', 'hybrid'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed'],
      default: 'draft',
      index: true,
    },
    primaryChannel: { type: Schema.Types.ObjectId, ref: 'ContactChannel' },
    fallbackChannels: { type: [Schema.Types.ObjectId], default: [] }, // populated in Phase 4
    customerListId: { type: Schema.Types.ObjectId, ref: 'CustomerList', required: true },
    aiProviderId: { type: Schema.Types.ObjectId, ref: 'AiProvider', required: true },
    voiceProfileId: { type: Schema.Types.ObjectId, ref: 'VoiceProfile', required: true },
    agent: { type: AgentConfigSchema, required: true },
    schedule: { type: ScheduleSchema, default: {} },
    retryRules: { type: RetryRulesSchema, default: {} },
    stats: { type: StatsSchema, default: {} },
    lastLaunchedAt: Date,
  },
  { timestamps: true },
);
CampaignSchema.index({ companyId: 1, status: 1, createdAt: -1 });

export type Campaign = InferSchemaType<typeof CampaignSchema> & { _id: Types.ObjectId };

export const CampaignModel: Model<Campaign> = model<Campaign>('Campaign', CampaignSchema);
