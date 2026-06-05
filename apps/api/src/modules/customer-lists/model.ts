import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

const CustomerListSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    type: { type: String, enum: ['static', 'dynamic'], required: true },
    /** populated for type=static */
    staticIds: { type: [Schema.Types.ObjectId], default: undefined },
    /** populated for type=dynamic — same shape as list-customers filter */
    filter: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
CustomerListSchema.index({ companyId: 1, name: 1 }, { unique: true });

export type CustomerList = InferSchemaType<typeof CustomerListSchema> & {
  _id: Types.ObjectId;
};

export const CustomerListModel: Model<CustomerList> = model<CustomerList>(
  'CustomerList',
  CustomerListSchema,
);
