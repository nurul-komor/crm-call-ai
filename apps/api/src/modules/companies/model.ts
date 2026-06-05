import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const CompanySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    settings: {
      defaultAiProviderId: { type: Schema.Types.ObjectId, ref: 'AiProvider' },
      defaultVoiceProfileId: { type: Schema.Types.ObjectId, ref: 'VoiceProfile' },
      defaultContactChannelId: { type: Schema.Types.ObjectId, ref: 'ContactChannel' },
    },
  },
  { timestamps: true },
);

export type Company = InferSchemaType<typeof CompanySchema> & { _id: Types.ObjectId };

export const CompanyModel: Model<Company> = model<Company>('Company', CompanySchema);
