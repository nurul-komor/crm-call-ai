import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const CustomerSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, index: true },
    whatsappNumber: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    company: { type: String, trim: true },
    tags: { type: [String], default: [], index: true },
    customFields: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['active', 'do_not_contact'], default: 'active', index: true },
    notes: String,
  },
  { timestamps: true },
);
CustomerSchema.index({ companyId: 1, phone: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ companyId: 1, name: 'text', email: 'text' });

export type Customer = InferSchemaType<typeof CustomerSchema> & { _id: Types.ObjectId };

export const CustomerModel: Model<Customer> = model<Customer>('Customer', CustomerSchema);
