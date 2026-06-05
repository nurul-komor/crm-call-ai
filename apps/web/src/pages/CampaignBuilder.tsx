import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getJson, postJson } from '@/lib/api';

interface CampaignForm {
  name: string;
  description?: string;
  type: 'phone_call' | 'whatsapp_call' | 'whatsapp_chat' | 'hybrid';
  primaryChannel: string;
  customerListId: string;
  aiProviderId: string;
  voiceProfileId: string;
  agent: {
    systemPrompt: string;
    language: string;
  };
}

interface ListItem {
  _id?: string;
  id?: string;
  name?: string;
  modelName?: string;
  model?: string;
  number?: string;
  voiceId?: string;
}

export function CampaignBuilderPage() {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  const channels = useQuery({
    queryKey: ['contact-channels'],
    queryFn: () => getJson<ListItem[]>('contact-channels'),
  });
  const lists = useQuery({
    queryKey: ['customer-lists'],
    queryFn: () => getJson<ListItem[]>('customer-lists'),
  });
  const providers = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => getJson<ListItem[]>('ai-providers'),
  });
  const voices = useQuery({
    queryKey: ['voice-profiles'],
    queryFn: () => getJson<ListItem[]>('voice-profiles'),
  });

  const { register, handleSubmit } = useForm<CampaignForm>({
    defaultValues: { type: 'phone_call', agent: { language: 'en', systemPrompt: '' } },
  });

  async function onSubmit(values: CampaignForm) {
    setErr(null);
    try {
      await postJson<{ _id: string }>('campaigns', values);
      navigate('/campaigns');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">New campaign</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Name" {...register('name', { required: true })} />
            <Input placeholder="Description (optional)" {...register('description')} />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('type')}
            >
              <option value="phone_call">Phone call</option>
              <option value="whatsapp_call">WhatsApp voice (Phase 3)</option>
              <option value="whatsapp_chat">WhatsApp chat (Phase 2)</option>
              <option value="hybrid">Hybrid (Phase 4)</option>
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel + AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('primaryChannel')}
            >
              <option value="">— Pick a contact channel —</option>
              {channels.data?.map((c) => (
                <option key={c._id ?? c.id} value={c._id ?? c.id}>
                  {c.number} ({c._id ?? c.id})
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('customerListId', { required: true })}
            >
              <option value="">— Pick a customer list —</option>
              {lists.data?.map((l) => (
                <option key={l._id ?? l.id} value={l._id ?? l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('aiProviderId', { required: true })}
            >
              <option value="">— Pick an AI provider —</option>
              {providers.data?.map((p) => (
                <option key={p.id ?? p._id} value={p.id ?? p._id}>
                  {p.modelName ?? p.model}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('voiceProfileId', { required: true })}
            >
              <option value="">— Pick a voice —</option>
              {voices.data?.map((v) => (
                <option key={v._id ?? v.id} value={v._id ?? v.id}>
                  {v.name} ({v.voiceId})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              placeholder="System prompt — describe the agent's persona, goal, required questions, length cap, tone."
              className="flex w-full min-h-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('agent.systemPrompt', { required: true, minLength: 10 })}
            />
            <Input placeholder="Language code (en)" {...register('agent.language')} />
          </CardContent>
        </Card>

        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-3">
          <Button type="submit">Create campaign</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/campaigns')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
