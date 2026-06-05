/**
 * Minimal Call model for the worker process. The authoritative schema lives in
 * apps/api/src/modules/calls/model.ts; this is a subset of the same fields
 * the worker actually reads/writes, bound to the same MongoDB collection by
 * model name. Mongoose lets each process register its own schema as long as
 * the collection name matches.
 */

import { Schema, Types, model, type Model } from 'mongoose';

const CallSchema = new Schema(
  {
    companyId: Schema.Types.ObjectId,
    campaignId: Schema.Types.ObjectId,
    campaignRunId: Schema.Types.ObjectId,
    customerId: Schema.Types.ObjectId,
    contactChannelId: Schema.Types.ObjectId,
    callJobId: { type: String, unique: true },
    callSid: String,
    status: String,
    answeredBy: String,
    startedAt: Date,
    answeredAt: Date,
    endedAt: Date,
    durationSec: Number,
    recordingUrl: String,
    transcript: { type: Array, default: [] },
    error: { code: String, message: String },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false }, // strict: false allows fields the api writes
);

export interface CallDoc {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  campaignId: Types.ObjectId;
  campaignRunId: Types.ObjectId;
  customerId: Types.ObjectId;
  contactChannelId: Types.ObjectId;
  callJobId: string;
  callSid?: string;
  status: string;
}

export const Call: Model<CallDoc> = model<CallDoc>('Call', CallSchema);

const ContactChannelSchema = new Schema(
  {
    companyId: Schema.Types.ObjectId,
    number: String,
    type: String,
    provider: String,
    twilioSid: String,
  },
  { timestamps: true, strict: false },
);

export interface ChannelDoc {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  number: string;
  type: string;
  provider: string;
}

export const ContactChannel: Model<ChannelDoc> = model<ChannelDoc>(
  'ContactChannel',
  ContactChannelSchema,
);

const CustomerSchema = new Schema(
  {
    companyId: Schema.Types.ObjectId,
    name: String,
    phone: String,
  },
  { timestamps: true, strict: false },
);

export interface CustomerDoc {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
}

export const Customer: Model<CustomerDoc> = model<CustomerDoc>('Customer', CustomerSchema);
