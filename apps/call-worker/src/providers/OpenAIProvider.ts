import OpenAI from 'openai';

import type {
  AIProvider,
  CompleteStreamParams,
  ExtractionField,
  ChatMessage,
} from './AIProvider.js';

export interface OpenAIProviderOptions {
  apiKey: string;
  model: string;
  /** For tests: inject a fake client. */
  client?: OpenAI;
}

/**
 * OpenAI-backed AIProvider.
 *
 * completeStream() yields tokens as they arrive (immediate forwarding to TTS).
 * summarize() returns { summary, sentiment }.
 * extract() forces JSON-mode and validates field types lightly.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  readonly model: string;
  private readonly client: OpenAI;

  constructor(opts: OpenAIProviderOptions) {
    this.client = opts.client ?? new OpenAI({ apiKey: opts.apiKey });
    this.model = opts.model;
  }

  async *completeStream(params: CompleteStreamParams): AsyncIterable<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: params.systemPrompt },
      ...params.history,
      { role: 'user', content: params.userInput },
    ];
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
      max_tokens: params.maxTokens ?? 300,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async summarize(
    transcript: string,
  ): Promise<{ summary: string; sentiment: 'positive' | 'neutral' | 'negative' }> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Summarise the call transcript in 1-3 sentences and classify the customer sentiment. Respond as JSON {"summary":"...","sentiment":"positive|neutral|negative"}.',
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

  async extract<T extends Record<string, unknown>>(
    transcript: string,
    fields: ExtractionField[],
  ): Promise<T> {
    if (fields.length === 0) return {} as T;
    const fieldDescriptor = fields
      .map((f) => {
        const enumPart = f.enumValues?.length ? ` one of [${f.enumValues.join('|')}]` : '';
        return `- ${f.key} (${f.type}${enumPart}${f.required ? ', required' : ''}): ${f.description ?? ''}`;
      })
      .join('\n');
    const res = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Extract the following fields from the call transcript. Return a JSON object whose keys exactly match the field keys. If a field cannot be confidently extracted, omit it.\n\nFields:\n${fieldDescriptor}`,
        },
        { role: 'user', content: transcript.slice(0, 12_000) },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return coerceFields(parsed, fields) as T;
  }
}

function coerceFields(
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
        const n = typeof v === 'number' ? v : Number(v);
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
