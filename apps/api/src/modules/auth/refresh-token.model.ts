import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const RefreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    jti: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    replacedByJti: { type: String },
  },
  { timestamps: true },
);
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshToken = InferSchemaType<typeof RefreshTokenSchema> & { _id: Types.ObjectId };

export const RefreshTokenModel: Model<RefreshToken> = model<RefreshToken>(
  'RefreshToken',
  RefreshTokenSchema,
);
