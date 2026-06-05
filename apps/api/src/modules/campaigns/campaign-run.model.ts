import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const CampaignRunSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    /** Snapshot of the campaign config at launch time */
    campaignSnapshot: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'paused', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    totalCustomers: { type: Number, default: 0 },
    enqueuedCalls: { type: Number, default: 0 },
    completedCalls: { type: Number, default: 0 },
    failedCalls: { type: Number, default: 0 },
    qualifiedLeads: { type: Number, default: 0 },
    startedAt: { type: Date, default: () => new Date() },
    endedAt: Date,
    launchedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type CampaignRun = InferSchemaType<typeof CampaignRunSchema> & { _id: Types.ObjectId };

export const CampaignRunModel: Model<CampaignRun> = model<CampaignRun>(
  'CampaignRun',
  CampaignRunSchema,
);
