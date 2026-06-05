import { Schema, Types, model, type Model } from 'mongoose';

// All schemas use strict:false so they tolerate fields written by the api.
// Each model registers against the SAME collection name as the api's model.

const passthrough = (): Schema => new Schema({}, { strict: false, timestamps: true });

interface CallDoc {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  campaignId: Types.ObjectId;
  campaignRunId: Types.ObjectId;
  callJobId: string;
  status: string;
  transcript?: Array<{ role: string; text: string; at: Date }>;
  summary?: string;
  sentiment?: string;
  extractedData?: Record<string, unknown>;
  leadScore?: number;
  leadQualification?: string;
}
export const Call: Model<CallDoc> = model<CallDoc>('Call', passthrough());

interface CampaignRunDoc {
  _id: Types.ObjectId;
  campaignSnapshot: {
    agent?: {
      extractionFields?: Array<{ key: string; type: string; description?: string; enumValues?: string[] }>;
      leadScoringRules?: Array<{ when: string; points: number }>;
    };
    aiProviderId?: Types.ObjectId;
  };
}
export const CampaignRun: Model<CampaignRunDoc> = model<CampaignRunDoc>(
  'CampaignRun',
  passthrough(),
);

interface AiProviderDoc {
  _id: Types.ObjectId;
  modelName: string;
  apiKey: { ciphertext: string; iv: string; tag: string; v: number };
}
export const AiProvider: Model<AiProviderDoc> = model<AiProviderDoc>(
  'AiProvider',
  passthrough(),
);
