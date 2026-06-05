import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetToken = InferSchemaType<typeof PasswordResetTokenSchema> & {
  _id: Types.ObjectId;
};

export const PasswordResetTokenModel: Model<PasswordResetToken> = model<PasswordResetToken>(
  'PasswordResetToken',
  PasswordResetTokenSchema,
);
