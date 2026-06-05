import { AppError } from '../../lib/errors.js';
import { getRedis } from '../../lib/redis.js';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string | null;
  labels?: Record<string, string>;
  preview_url?: string | null;
}

export interface ElevenLabsVoiceCatalogEntry {
  voiceId: string;
  name: string;
  category?: string;
  description?: string;
  language?: string;
  gender?: string;
  previewUrl?: string;
}

const BASE = 'https://api.elevenlabs.io';
const CACHE_KEY = 'elevenlabs:voices:catalog';
const CACHE_TTL_SEC = 600;

/** Injection seam for tests. */
let fetchImpl: typeof fetch = fetch;
export function __setElevenLabsFetch(f: typeof fetch | undefined): void {
  fetchImpl = f ?? fetch;
}

export async function listVoices(apiKey?: string): Promise<ElevenLabsVoiceCatalogEntry[]> {
  const redis = getRedis();
  const cached = await redis.get(CACHE_KEY);
  if (cached) return JSON.parse(cached) as ElevenLabsVoiceCatalogEntry[];

  // Read process.env directly: this is a non-validated passthrough and may be
  // rotated at runtime; the cached env() loader would not pick up changes.
  const key = apiKey ?? process.env.ELEVENLABS_API_KEY ?? '';
  if (!key) {
    throw new AppError(
      'bad_request',
      'ELEVENLABS_API_KEY not configured (set globally or per-tenant)',
      400,
    );
  }
  const res = await fetchImpl(`${BASE}/v1/voices`, {
    headers: { 'xi-api-key': key, accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AppError(
      'internal_error',
      `ElevenLabs catalog fetch failed: ${res.status} ${body.slice(0, 200)}`,
      502,
    );
  }
  const data = (await res.json()) as { voices?: ElevenLabsVoice[] };
  const out = (data.voices ?? []).map(toCatalogEntry);
  await redis.setex(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(out));
  return out;
}

function toCatalogEntry(v: ElevenLabsVoice): ElevenLabsVoiceCatalogEntry {
  const language = v.labels?.['language'];
  const gender = v.labels?.['gender'];
  const entry: ElevenLabsVoiceCatalogEntry = {
    voiceId: v.voice_id,
    name: v.name,
  };
  if (v.category) entry.category = v.category;
  if (v.description) entry.description = v.description;
  if (language) entry.language = language;
  if (gender) entry.gender = gender;
  if (v.preview_url) entry.previewUrl = v.preview_url;
  return entry;
}

export async function clearCatalogCache(): Promise<void> {
  await getRedis().del(CACHE_KEY);
}
