import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const VoiceProfileSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    provider: { type: String, enum: ['elevenlabs'], default: 'elevenlabs', required: true },
    voiceId: { type: String, required: true, trim: true },
    language: { type: String, default: 'en' },
    gender: { type: String, enum: ['male', 'female', 'neutral'] },
    description: String,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);
VoiceProfileSchema.index({ companyId: 1, voiceId: 1 }, { unique: true });

export type VoiceProfile = InferSchemaType<typeof VoiceProfileSchema> & {
  _id: Types.ObjectId;
};

export const VoiceProfileModel: Model<VoiceProfile> = model<VoiceProfile>(
  'VoiceProfile',
  VoiceProfileSchema,
);
