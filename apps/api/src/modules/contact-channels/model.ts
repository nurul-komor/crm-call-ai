import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const ContactChannelSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    type: { type: String, enum: ['phone', 'whatsapp'], required: true },
    provider: {
      type: String,
      enum: ['twilio', 'meta', 'vonage', 'plivo'],
      required: true,
    },
    number: { type: String, required: true, trim: true },
    friendlyName: { type: String, trim: true },
    twilioSid: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  },
  { timestamps: true },
);
ContactChannelSchema.index({ companyId: 1, number: 1 }, { unique: true });

export type ContactChannel = InferSchemaType<typeof ContactChannelSchema> & {
  _id: Types.ObjectId;
};

export const ContactChannelModel: Model<ContactChannel> = model<ContactChannel>(
  'ContactChannel',
  ContactChannelSchema,
);
