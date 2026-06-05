import { Schema, Types, model, type InferSchemaType, type Model } from 'mongoose';

export const DEFAULT_ROLE_NAMES = [
  'super_admin',
  'company_admin',
  'campaign_manager',
  'agent',
  'viewer',
] as const;

export type DefaultRoleName = (typeof DEFAULT_ROLE_NAMES)[number];

/**
 * Permission tokens have the shape `<resource>:<action>`. Examples:
 *   campaigns:create, campaigns:launch, calls:listen, customers:export.
 * Stored as a flat string set on each role.
 */
const RoleSchema = new Schema(
  {
    /** null for built-in super_admin; otherwise a company tenant */
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);
RoleSchema.index({ companyId: 1, name: 1 }, { unique: true });

export type Role = InferSchemaType<typeof RoleSchema> & { _id: Types.ObjectId };

export const RoleModel: Model<Role> = model<Role>('Role', RoleSchema);

export const DEFAULT_ROLE_PERMISSIONS: Record<DefaultRoleName, string[]> = {
  super_admin: ['*:*'],
  company_admin: [
    'company:read',
    'company:update',
    'users:*',
    'roles:*',
    'customers:*',
    'customer-lists:*',
    'contact-channels:*',
    'voice-profiles:*',
    'ai-providers:*',
    'campaigns:*',
    'calls:*',
    'analytics:read',
  ],
  campaign_manager: [
    'customers:read',
    'customers:create',
    'customer-lists:*',
    'voice-profiles:read',
    'contact-channels:read',
    'campaigns:*',
    'calls:read',
    'calls:listen',
    'calls:stop',
    'analytics:read',
  ],
  agent: ['customers:read', 'campaigns:read', 'calls:read', 'calls:listen'],
  viewer: ['campaigns:read', 'calls:read', 'analytics:read'],
};
