import { Types } from 'mongoose';

import { AppError } from '../../lib/errors.js';
import { decryptFromStorage, encryptForStorage } from '../../lib/encryptedField.js';

import { AiProviderModel } from './model.js';

import type { CreateAiProviderInput, UpdateAiProviderInput } from './dto.js';

/** Shape returned over REST — never includes the api key. */
export interface AiProviderPublic {
  id: string;
  provider: string;
  model: string;
  label?: string;
  isActive: boolean;
  isDefault: boolean;
  /** Masked hint so the UI can show "sk-…ab12" */
  keyHint: string;
  createdAt?: Date;
  updatedAt?: Date;
}

function maskKey(plain: string): string {
  if (plain.length <= 8) return '••••';
  return `${plain.slice(0, 3)}…${plain.slice(-4)}`;
}

interface PersistedDoc {
  _id: Types.ObjectId;
  provider: string;
  modelName: string;
  label?: string;
  isActive: boolean;
  isDefault: boolean;
  apiKey?: { ciphertext: string; iv: string; tag: string; v: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export class AiProviderService {
  constructor(private readonly companyId: string) {}

  async create(input: CreateAiProviderInput): Promise<AiProviderPublic> {
    if (input.isDefault) await this.clearDefault(input.provider);
    const encrypted = encryptForStorage(input.apiKey);
    const doc = (await AiProviderModel.create({
      companyId: this.companyId,
      provider: input.provider,
      apiKey: encrypted,
      modelName: input.model,
      label: input.label,
      isDefault: input.isDefault ?? false,
      isActive: input.isActive ?? true,
    })) as unknown as PersistedDoc;
    return this.toPublic(doc, input.apiKey);
  }

  async list(): Promise<AiProviderPublic[]> {
    const docs = (await AiProviderModel.find({ companyId: this.companyId })
      .select('+apiKey')
      .sort({ createdAt: -1 })
      .lean()) as unknown as PersistedDoc[];
    return docs.map((d) => this.toPublic(d, decryptFromStorage(d.apiKey ?? null)));
  }

  async update(id: string, input: UpdateAiProviderInput): Promise<AiProviderPublic> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const update: Record<string, unknown> = {};
    if (input.apiKey) update.apiKey = encryptForStorage(input.apiKey);
    if (input.model !== undefined) update.modelName = input.model;
    if (input.label !== undefined) update.label = input.label;
    if (input.isActive !== undefined) update.isActive = input.isActive;

    if (input.isDefault === true) {
      const existing = await AiProviderModel.findOne({
        _id: id,
        companyId: this.companyId,
      }).lean();
      if (!existing) throw new AppError('not_found', 'AI provider not found', 404);
      await this.clearDefault(existing.provider, id);
      update.isDefault = true;
    } else if (input.isDefault === false) {
      update.isDefault = false;
    }

    const doc = (await AiProviderModel.findOneAndUpdate(
      { _id: id, companyId: this.companyId },
      { $set: update },
      { new: true, projection: '+apiKey' },
    ).lean()) as unknown as PersistedDoc | null;
    if (!doc) throw new AppError('not_found', 'AI provider not found', 404);
    return this.toPublic(doc, decryptFromStorage(doc.apiKey ?? null));
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const res = await AiProviderModel.deleteOne({ _id: id, companyId: this.companyId });
    if (res.deletedCount === 0) throw new AppError('not_found', 'AI provider not found', 404);
  }

  /**
   * Decrypt and return the API key for a specific provider record.
   * INTERNAL — never exposed via REST. Called by workers when they
   * need to use the credential (e.g. to invoke OpenAI).
   */
  async getDecryptedKey(id: string): Promise<{ provider: string; model: string; apiKey: string }> {
    if (!Types.ObjectId.isValid(id)) throw new AppError('bad_request', 'Invalid id', 400);
    const doc = (await AiProviderModel.findOne({ _id: id, companyId: this.companyId })
      .select('+apiKey')
      .lean()) as unknown as PersistedDoc | null;
    if (!doc) throw new AppError('not_found', 'AI provider not found', 404);
    return {
      provider: doc.provider,
      model: doc.modelName,
      apiKey: decryptFromStorage(doc.apiKey ?? null),
    };
  }

  private async clearDefault(provider: string, excludeId?: string): Promise<void> {
    const filter: Record<string, unknown> = {
      companyId: this.companyId,
      provider,
      isDefault: true,
    };
    if (excludeId) filter._id = { $ne: excludeId };
    await AiProviderModel.updateMany(filter, { $set: { isDefault: false } });
  }

  private toPublic(d: PersistedDoc, plainKey: string): AiProviderPublic {
    return {
      id: String(d._id),
      provider: d.provider,
      model: d.modelName,
      label: d.label,
      isActive: d.isActive,
      isDefault: d.isDefault,
      keyHint: maskKey(plainKey),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
