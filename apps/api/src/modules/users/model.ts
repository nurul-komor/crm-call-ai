import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const UserSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'invited', 'disabled'], default: 'active' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });

export type User = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };

export const UserModel: Model<User> = model<User>('User', UserSchema);
