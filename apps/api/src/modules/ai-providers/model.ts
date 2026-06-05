import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

import { EncryptedFieldMongooseSchema } from '../../lib/encryptedField.js';

const AiProviderSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    provider: {
      type: String,
      enum: ['openai', 'claude', 'gemini', 'openrouter'],
      required: true,
    },
    /** Encrypted-at-rest API key. Never returned in REST responses. */
    apiKey: { type: EncryptedFieldMongooseSchema, required: true, select: false },
    modelName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    /** Optional friendly label */
    label: String,
  },
  { timestamps: true },
);
AiProviderSchema.index({ companyId: 1, provider: 1, isDefault: 1 });

export type AiProvider = InferSchemaType<typeof AiProviderSchema> & {
  _id: Types.ObjectId;
};

export const AiProviderModel: Model<AiProvider> = model<AiProvider>(
  'AiProvider',
  AiProviderSchema,
);
