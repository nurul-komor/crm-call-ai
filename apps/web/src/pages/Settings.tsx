import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <ChannelsSection />
      <VoiceProfilesSection />
      <AiProvidersSection />
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact channels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
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
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('type')}
            defaultValue="phone"
          >
            <option value="phone">phone</option>
            <option value="whatsapp">whatsapp</option>
          </select>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('provider')}
            defaultValue="twilio"
          >
            <option value="twilio">twilio</option>
            <option value="meta">meta</option>
            <option value="vonage">vonage</option>
            <option value="plivo">plivo</option>
          </select>
          <Input placeholder="+14155551234" {...register('number', { required: true })} />
          <Button type="submit" disabled={create.isPending}>
            Add channel
          </Button>
          {err && <p className="md:col-span-4 text-sm text-destructive">{err}</p>}
        </form>
        <table className="w-full text-sm">
          <tbody>
            {list.data?.map((c) => (
              <tr key={c._id} className="border-b last:border-b-0">
                <td className="py-2">
                  <span className="font-medium">{c.number}</span>{' '}
                  <span className="text-muted-foreground">
                    ({c.type} · {c.provider})
                  </span>
                </td>
                <td className="py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(c._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Voice profiles (ElevenLabs)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
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
          <Input placeholder="Display name" {...register('name', { required: true })} />
          <Input placeholder="ElevenLabs voiceId" {...register('voiceId', { required: true })} />
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('gender')}
            defaultValue=""
          >
            <option value="">— gender —</option>
            <option value="female">female</option>
            <option value="male">male</option>
            <option value="neutral">neutral</option>
          </select>
          <Button type="submit" disabled={create.isPending}>
            Add voice
          </Button>
          {err && <p className="md:col-span-4 text-sm text-destructive">{err}</p>}
        </form>
        <table className="w-full text-sm">
          <tbody>
            {list.data?.map((v) => (
              <tr key={v._id} className="border-b last:border-b-0">
                <td className="py-2">
                  <span className="font-medium">{v.name}</span>{' '}
                  <span className="text-muted-foreground">({v.voiceId})</span>
                </td>
                <td className="py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(v._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI providers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
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
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('provider')}
            defaultValue="openai"
          >
            <option value="openai">openai</option>
            <option value="claude">claude</option>
            <option value="gemini">gemini</option>
            <option value="openrouter">openrouter</option>
          </select>
          <Input placeholder="model (e.g. gpt-4o-mini)" {...register('model', { required: true })} />
          <Input
            type="password"
            placeholder="API key"
            autoComplete="off"
            {...register('apiKey', { required: true })}
          />
          <Button type="submit" disabled={create.isPending}>
            Add provider
          </Button>
          {err && <p className="md:col-span-4 text-sm text-destructive">{err}</p>}
        </form>
        <table className="w-full text-sm">
          <tbody>
            {list.data?.map((p) => (
              <tr key={p.id} className="border-b last:border-b-0">
                <td className="py-2">
                  <span className="font-medium">{p.provider}</span>{' '}
                  <span className="text-muted-foreground">
                    ({p.model} · {p.keyHint})
                  </span>
                </td>
                <td className="py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(p.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
