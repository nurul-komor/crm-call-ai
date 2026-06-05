import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const TranscriptTurnSchema = new Schema(
  {
    role: { type: String, enum: ['agent', 'customer', 'system'], required: true },
    text: { type: String, required: true },
    at: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const CallSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    campaignRunId: { type: Schema.Types.ObjectId, ref: 'CampaignRun', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    contactChannelId: { type: Schema.Types.ObjectId, ref: 'ContactChannel', required: true },
    direction: { type: String, enum: ['outbound', 'inbound'], default: 'outbound' },
    callJobId: { type: String, required: true, unique: true },
    callSid: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: [
        'initiated',
        'ringing',
        'answered',
        'in_progress',
        'completed',
        'failed',
        'no_answer',
        'busy',
        'answering_machine',
        'disconnected_worker_crash',
      ],
      default: 'initiated',
      index: true,
    },
    answeredBy: String,
    startedAt: { type: Date, default: () => new Date() },
    answeredAt: Date,
    endedAt: Date,
    durationSec: Number,
    recordingUrl: String,
    transcript: { type: [TranscriptTurnSchema], default: [] },
    summary: String,
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    extractedData: { type: Schema.Types.Mixed },
    leadScore: Number,
    leadQualification: { type: String, enum: ['cold', 'warm', 'hot'] },
    outcome: String,
    retryCount: { type: Number, default: 0 },
    error: { code: String, message: String },
    costBreakdown: {
      twilioCents: Number,
      ttsCents: Number,
      llmCents: Number,
      sttCents: Number,
    },
  },
  { timestamps: true },
);
CallSchema.index({ companyId: 1, campaignId: 1, createdAt: -1 });
CallSchema.index({ companyId: 1, leadQualification: 1 });

export type Call = InferSchemaType<typeof CallSchema> & { _id: Types.ObjectId };

export const CallModel: Model<Call> = model<Call>('Call', CallSchema);
