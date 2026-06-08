import { Cpu, Settings } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

interface AIProvider {
  name: string;
  model: string;
  usage: string;
  cost: string;
  health: string;
  latency: string;
  color: string;
  logo: string;
}

const PROVIDERS: AIProvider[] = [
  { name: 'Anthropic Claude', model: 'Claude 3.5 Sonnet',    usage: '52%', cost: '$1,240/mo', health: '99.8%', latency: '380ms', color: '#D4A574', logo: 'A' },
  { name: 'OpenAI',           model: 'GPT-4o',               usage: '34%', cost: '$890/mo',   health: '99.9%', latency: '420ms', color: '#10A37F', logo: 'O' },
  { name: 'Google',           model: 'Gemini Pro 1.5',       usage: '12%', cost: '$310/mo',   health: '99.6%', latency: '510ms', color: '#4285F4', logo: 'G' },
  { name: 'OpenRouter',       model: 'Multi-model gateway',  usage: '2%',  cost: '$48/mo',    health: '99.9%', latency: '450ms', color: '#FF6B35', logo: 'R' },
];

const STATS: { label: string; key: keyof AIProvider }[] = [
  { label: 'Usage',     key: 'usage'   },
  { label: 'Cost (mo)', key: 'cost'    },
  { label: 'Health',    key: 'health'  },
  { label: 'Latency',   key: 'latency' },
];

function ProviderCard({ provider }: { provider: AIProvider }) {
  const usagePct = parseFloat(provider.usage);

  return (
    <div className="dash-card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Logo box */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl font-extrabold"
          style={{
            background: `${provider.color}26`,
            border: `1px solid ${provider.color}40`,
            color: provider.color,
          }}
        >
          {provider.logo}
        </div>

        {/* Name + model */}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-[hsl(var(--text))] leading-tight">{provider.name}</p>
          <p className="text-xs text-[hsl(var(--text-secondary))] truncate mt-0.5">{provider.model}</p>
        </div>

        {/* Connected chip */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="chip" style={{ color: 'hsl(var(--success))', borderColor: 'hsl(var(--success) / 0.35)', background: 'hsl(var(--success) / 0.12)' }}>
            <span className="live-dot" />
            Connected
          </span>
        </div>

        {/* Settings icon */}
        <button
          type="button"
          aria-label={`Settings for ${provider.name}`}
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--hover-overlay))] hover:text-[hsl(var(--text-secondary))]"
        >
          <Settings size={15} />
        </button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-4 gap-2">
        {STATS.map(({ label, key }) => (
          <div
            key={key}
            className="flex flex-col gap-1 rounded-lg px-2.5 py-2"
            style={{ background: 'hsl(var(--bg))', border: '1px solid hsl(var(--border))' }}
          >
            <span className="text-[10px] font-medium text-[hsl(var(--text-tertiary))] leading-none whitespace-nowrap">
              {label}
            </span>
            <span className="text-xs font-semibold text-[hsl(var(--text))] leading-tight tabular-nums">
              {provider[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Usage progress bar */}
      <div
        className="h-1 w-full overflow-hidden rounded-full"
        style={{ background: 'hsl(var(--border))' }}
        role="progressbar"
        aria-valuenow={usagePct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${provider.name} usage ${provider.usage}`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${usagePct}%`, background: provider.color }}
        />
      </div>
    </div>
  );
}

export function AIProvidersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configure"
        title="AI Providers"
        description="Connect, monitor, and manage AI models across providers."
        actions={
          <Button variant="default" size="sm">
            <Cpu size={14} />
            Add Provider
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <ProviderCard key={provider.name} provider={provider} />
        ))}
      </div>
    </div>
  );
}
