import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cpu, Mic, Phone, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { del, getJson, postJson } from '@/lib/api';

interface ContactChannel {
  _id: string;
  type: string;
  provider: string;
  number: string;
  isDefault?: boolean;
}
interface VoiceProfile {
  _id: string;
  name: string;
  voiceId: string;
  gender?: string;
  isDefault?: boolean;
}
interface AiProvider {
  id: string;
  provider: string;
  model: string;
  keyHint: string;
  isDefault?: boolean;
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage contact channels, voice profiles, and AI provider credentials."
      />
      <div className="space-y-6">
        <ChannelsSection />
        <VoiceProfilesSection />
        <AiProvidersSection />
      </div>
    </div>
  );
}

function ChannelsSection() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['contact-channels'],
    queryFn: () => getJson<ContactChannel[]>('contact-channels'),
  });
  const create = useMutation({
    mutationFn: (input: Partial<ContactChannel>) => postJson('contact-channels', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-channels'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`contact-channels/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-channels'] }),
  });
  const { register, handleSubmit, reset } = useForm<{
    type: 'phone' | 'whatsapp';
    provider: 'twilio' | 'meta' | 'vonage' | 'plivo';
    number: string;
  }>();
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card id="channels">
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <Phone size={14} className="text-accent-light" />
            Contact channels
          </span>
        </CardTitle>
        <span className="text-xs text-text-tertiary">{list.data?.length ?? 0} configured</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid grid-cols-1 md:grid-cols-[120px_140px_1fr_auto] gap-3 items-end"
          onSubmit={handleSubmit(async (v) => {
            setErr(null);
            try {
              await create.mutateAsync(v);
              reset();
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Failed');
            }
          })}
        >
          <Field label="Type">
            <Select {...register('type')} defaultValue="phone">
              <option value="phone">phone</option>
              <option value="whatsapp">whatsapp</option>
            </Select>
          </Field>
          <Field label="Provider">
            <Select {...register('provider')} defaultValue="twilio">
              <option value="twilio">twilio</option>
              <option value="meta">meta</option>
              <option value="vonage">vonage</option>
              <option value="plivo">plivo</option>
            </Select>
          </Field>
          <Field label="Number">
            <Input placeholder="+14155551234" {...register('number', { required: true })} />
          </Field>
          <Button type="submit" disabled={create.isPending} className="gap-2">
            <Plus size={14} />
            Add
          </Button>
          {err && <p className="md:col-span-4 text-xs text-danger">{err}</p>}
        </form>

        {list.data && list.data.length > 0 && (
          <ul className="divide-y divide-border border border-border rounded-md overflow-hidden">
            {list.data.map((c) => (
              <li
                key={c._id}
                className="flex items-center justify-between gap-4 px-4 py-3 row-hover"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-7 w-7 rounded-md bg-surface-2 border border-border flex items-center justify-center text-text-tertiary">
                    <Phone size={12} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-text font-mono text-sm truncate">
                      {c.number}
                    </div>
                    <div className="text-2xs text-text-tertiary uppercase tracking-wider">
                      {c.type} · {c.provider}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-danger"
                  onClick={() => remove.mutate(c._id)}
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function VoiceProfilesSection() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['voice-profiles'],
    queryFn: () => getJson<VoiceProfile[]>('voice-profiles'),
  });
  const create = useMutation({
    mutationFn: (input: Partial<VoiceProfile>) => postJson('voice-profiles', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-profiles'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`voice-profiles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-profiles'] }),
  });
  const { register, handleSubmit, reset } = useForm<{
    name: string;
    voiceId: string;
    gender?: 'male' | 'female' | 'neutral';
  }>();
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card id="voice">
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <Mic size={14} className="text-accent-light" />
            Voice profiles
          </span>
        </CardTitle>
        <span className="text-xs text-text-tertiary">ElevenLabs</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_140px_auto] gap-3 items-end"
          onSubmit={handleSubmit(async (v) => {
            setErr(null);
            try {
              await create.mutateAsync(v);
              reset();
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Failed');
            }
          })}
        >
          <Field label="Display name">
            <Input placeholder="Sofia · Energetic" {...register('name', { required: true })} />
          </Field>
          <Field label="ElevenLabs voice ID">
            <Input
              placeholder="EXAVITQu4vr4xnSDxMaL"
              {...register('voiceId', { required: true })}
            />
          </Field>
          <Field label="Gender">
            <Select {...register('gender')} defaultValue="">
              <option value="">—</option>
              <option value="female">female</option>
              <option value="male">male</option>
              <option value="neutral">neutral</option>
            </Select>
          </Field>
          <Button type="submit" disabled={create.isPending} className="gap-2">
            <Plus size={14} />
            Add
          </Button>
          {err && <p className="md:col-span-4 text-xs text-danger">{err}</p>}
        </form>

        {list.data && list.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.data.map((v) => (
              <div
                key={v._id}
                className="relative overflow-hidden rounded-md border border-border bg-surface-2 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div
                  className="absolute -top-4 -right-4 h-16 w-16 rounded-full opacity-40 blur-2xl"
                  style={{ background: 'hsl(var(--accent) / 0.5)' }}
                />
                <div className="relative min-w-0">
                  <div className="font-semibold text-text truncate">{v.name}</div>
                  <div className="text-2xs text-text-tertiary font-mono truncate">
                    {v.voiceId} · {v.gender ?? 'unspecified'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:text-danger"
                  onClick={() => remove.mutate(v._id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AiProvidersSection() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => getJson<AiProvider[]>('ai-providers'),
  });
  const create = useMutation({
    mutationFn: (input: { provider: string; model: string; apiKey: string }) =>
      postJson('ai-providers', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-providers'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`ai-providers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-providers'] }),
  });
  const { register, handleSubmit, reset } = useForm<{
    provider: 'openai' | 'claude' | 'gemini' | 'openrouter';
    model: string;
    apiKey: string;
  }>();
  const [err, setErr] = useState<string | null>(null);

  return (
    <Card id="providers">
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <Cpu size={14} className="text-accent-light" />
            AI providers
          </span>
        </CardTitle>
        <span className="text-xs text-text-tertiary">Bring-your-own-key</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_auto] gap-3 items-end"
          onSubmit={handleSubmit(async (v) => {
            setErr(null);
            try {
              await create.mutateAsync(v);
              reset();
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Failed');
            }
          })}
        >
          <Field label="Provider">
            <Select {...register('provider')} defaultValue="openai">
              <option value="openai">openai</option>
              <option value="claude">claude</option>
              <option value="gemini">gemini</option>
              <option value="openrouter">openrouter</option>
            </Select>
          </Field>
          <Field label="Model">
            <Input placeholder="gpt-4o-mini" {...register('model', { required: true })} />
          </Field>
          <Field label="API key">
            <Input
              type="password"
              placeholder="sk-…"
              autoComplete="off"
              {...register('apiKey', { required: true })}
            />
          </Field>
          <Button type="submit" disabled={create.isPending} className="gap-2">
            <Plus size={14} />
            Add
          </Button>
          {err && <p className="md:col-span-4 text-xs text-danger">{err}</p>}
        </form>

        {list.data && list.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.data.map((p) => (
              <div
                key={p.id}
                className="rounded-md border border-border bg-surface-2 px-4 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-surface border border-border flex items-center justify-center text-text-secondary font-bold uppercase text-xs">
                    {p.provider.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-text capitalize">{p.provider}</div>
                    <div className="text-2xs text-text-tertiary font-mono truncate">
                      {p.model} · {p.keyHint}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone="success" dot>connected</Chip>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-danger"
                    onClick={() => remove.mutate(p.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
