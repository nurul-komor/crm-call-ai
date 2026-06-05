import OpenAI from 'openai';

import { decrypt } from '@voiceflow/shared-utils';

import { env } from './config.js';
import { AiProvider } from './models.js';

interface ProviderCfg {
  model: string;
  client: OpenAI;
}

/** Decrypt the campaign's configured AI provider and return a ready OpenAI client + model. */
export async function loadProvider(aiProviderId: string): Promise<ProviderCfg> {
  const doc = await AiProvider.findById(aiProviderId).lean();
  if (!doc) throw new Error(`AiProvider ${aiProviderId} not found`);
  const masterKey = Buffer.from(env().ENCRYPTION_MASTER_KEY, 'base64');
  const apiKey = decrypt(doc.apiKey, masterKey);
  const client = new OpenAI({ apiKey });
  return { model: doc.modelName, client };
}

export interface ExtractionField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  description?: string;
  enumValues?: string[];
}

export async function summarize(
  provider: ProviderCfg,
  transcript: string,
): Promise<{ summary: string; sentiment: 'positive' | 'neutral' | 'negative' }> {
  const res = await provider.client.chat.completions.create({
    model: provider.model,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Summarise this call transcript in 1-3 sentences and classify the customer sentiment. JSON: {"summary":"...","sentiment":"positive|neutral|negative"}.',
      },
      { role: 'user', content: transcript.slice(0, 12_000) },
    ],
  });
  const raw = res.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { summary?: string; sentiment?: string };
  const sentiment =
    parsed.sentiment === 'positive' || parsed.sentiment === 'negative'
      ? parsed.sentiment
      : 'neutral';
  return { summary: parsed.summary ?? '', sentiment };
}

export async function extract(
  provider: ProviderCfg,
  transcript: string,
  fields: ExtractionField[],
): Promise<Record<string, unknown>> {
  if (!fields?.length) return {};
  const desc = fields
    .map((f) => {
      const e = f.enumValues?.length ? ` one of [${f.enumValues.join('|')}]` : '';
      return `- ${f.key} (${f.type}${e}): ${f.description ?? ''}`;
    })
    .join('\n');
  const res = await provider.client.chat.completions.create({
    model: provider.model,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Extract these fields from the transcript as JSON keyed by field key. Omit fields you can't extract.\n\n${desc}`,
      },
      { role: 'user', content: transcript.slice(0, 12_000) },
    ],
  });
  const raw = res.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return coerce(parsed, fields);
}

function coerce(
  raw: Record<string, unknown>,
  fields: ExtractionField[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = raw[f.key];
    if (v === undefined || v === null) continue;
    switch (f.type) {
      case 'string':
        out[f.key] = String(v);
        break;
      case 'number': {
        const n = Number(v);
        if (!Number.isNaN(n)) out[f.key] = n;
        break;
      }
      case 'boolean':
        out[f.key] = typeof v === 'boolean' ? v : v === 'true' || v === 1;
        break;
      case 'date':
        out[f.key] = new Date(String(v)).toISOString();
        break;
      case 'enum':
        if (f.enumValues?.includes(String(v))) out[f.key] = String(v);
        break;
    }
  }
  return out;
}
