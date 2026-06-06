import { useQuery } from '@tanstack/react-query';
import { Bot, Mic, Phone, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
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

const SECTIONS = [
  { id: 'basics', label: 'Basics', icon: Sparkles },
  { id: 'audience', label: 'Channel & audience', icon: Users },
  { id: 'ai', label: 'AI provider', icon: Bot },
  { id: 'voice', label: 'Voice & script', icon: Mic },
];

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
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="New campaign"
        description="Configure a new outbound conversation program in 4 quick steps."
        actions={
          <>
            <Button variant="outline" type="button" onClick={() => navigate('/campaigns')}>
              Cancel
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden lg:block">
          <ol className="space-y-1 sticky top-24">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="group flex items-center gap-3 px-3 py-2 rounded-md text-base text-text-secondary hover:bg-[hsl(var(--hover-overlay))] hover:text-text transition-colors"
                >
                  <span className="h-6 w-6 rounded-full bg-surface-2 border border-border text-xs font-semibold flex items-center justify-center text-text-secondary group-hover:border-accent group-hover:text-accent-light">
                    {i + 1}
                  </span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card id="basics">
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} className="text-accent-light" />
                  Basics
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Campaign name">
                <Input
                  placeholder="Q3 Outbound — Demo bookings"
                  {...register('name', { required: true })}
                />
              </Field>
              <Field label="Description" hint="Internal note. Customers don't see this.">
                <Input
                  placeholder="What this campaign is for…"
                  {...register('description')}
                />
              </Field>
              <Field label="Channel type">
                <Select {...register('type')}>
                  <option value="phone_call">Phone call</option>
                  <option value="whatsapp_call">WhatsApp voice (Phase 3)</option>
                  <option value="whatsapp_chat">WhatsApp chat (Phase 2)</option>
                  <option value="hybrid">Hybrid (Phase 4)</option>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card id="audience">
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Users size={14} className="text-success" />
                  Channel & audience
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Outbound number">
                <Select {...register('primaryChannel')}>
                  <option value="">— Pick a contact channel —</option>
                  {channels.data?.map((c) => (
                    <option key={c._id ?? c.id} value={c._id ?? c.id}>
                      {c.number}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Customer list">
                <Select {...register('customerListId', { required: true })}>
                  <option value="">— Pick a customer list —</option>
                  {lists.data?.map((l) => (
                    <option key={l._id ?? l.id} value={l._id ?? l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card id="ai">
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Bot size={14} className="text-warning" />
                  AI provider
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Model">
                <Select {...register('aiProviderId', { required: true })}>
                  <option value="">— Pick an AI provider —</option>
                  {providers.data?.map((p) => (
                    <option key={p.id ?? p._id} value={p.id ?? p._id}>
                      {p.modelName ?? p.model}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card id="voice">
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <Mic size={14} className="text-accent-light" />
                  Voice & script
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Voice profile">
                <Select {...register('voiceProfileId', { required: true })}>
                  <option value="">— Pick a voice —</option>
                  {voices.data?.map((v) => (
                    <option key={v._id ?? v.id} value={v._id ?? v.id}>
                      {v.name} ({v.voiceId})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Agent language" hint="ISO code, e.g. en, es, fr">
                <Input placeholder="en" {...register('agent.language')} />
              </Field>
              <Field
                label="System prompt"
                hint="Describe the agent's persona, goal, required questions, length cap, tone."
              >
                <Textarea
                  rows={8}
                  placeholder="You are a friendly sales agent for Acme. Your goal is to qualify the lead by asking about company size, use case, and timeline. Keep responses under 25 words. End by booking a demo at acme.co/demo."
                  {...register('agent.systemPrompt', { required: true, minLength: 10 })}
                />
              </Field>
            </CardContent>
          </Card>

          {err && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {err}
            </div>
          )}

          <div className="flex items-center gap-3 sticky bottom-4 z-10">
            <Button type="submit" size="lg" className="gap-2">
              <Phone size={14} />
              Create campaign
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/campaigns')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
