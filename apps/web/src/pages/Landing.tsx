import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  Headphones,
  KeyRound,
  MessageSquare,
  PhoneCall,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

import { Sparkline } from '@/components/Sparkline';
import { Waveform } from '@/components/Waveform';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useAuthStore } from '@/lib/authStore';

const HERO_STATS: Array<[string, string]> = [
  ['98.4%', 'Pickup rate'],
  ['2.1s', 'First-token latency'],
  ['44%', 'Lift in conversion'],
];

const FEATURES = [
  {
    icon: PhoneCall,
    title: 'Real-time voice agent',
    body: 'Sub-second VAD, barge-in, and natural ElevenLabs voices. Conversations that don’t feel scripted.',
  },
  {
    icon: Radio,
    title: 'Live call monitor',
    body: 'Watch every campaign as it happens. Stream transcripts, sentiment, and AI intent classifications in real time.',
  },
  {
    icon: BarChart3,
    title: 'Auto lead scoring',
    body: 'Every call is summarized, classified, and scored. Hot leads route to your CRM, warm replies go to your team.',
  },
  {
    icon: MessageSquare,
    title: 'Multi-channel reach',
    body: 'Voice, WhatsApp, and SMS from one campaign. Pick the channel each prospect actually responds on.',
  },
  {
    icon: KeyRound,
    title: 'Bring your own keys',
    body: 'Plug in OpenAI, Anthropic, Gemini, or your own LLM endpoint. We never lock you to a single model.',
  },
  {
    icon: ShieldCheck,
    title: 'Tenant-isolated by design',
    body: 'Workspaces, role-based access, audit logs, and per-tenant data residency. Built for regulated teams.',
  },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Connect a number',
    body: 'Bring a Twilio number or buy one in two clicks. We provision the voice + media WebSocket automatically.',
  },
  {
    n: '02',
    title: 'Describe the campaign',
    body: 'Write your goal in plain English. VoiceFlow tunes the agent prompt, picks a voice, and drafts objections.',
  },
  {
    n: '03',
    title: 'Dispatch & monitor',
    body: 'Upload a CSV or sync from your CRM. Watch the live monitor, hand off the warmest leads to your team.',
  },
] as const;

const PARTNER_LOGOS = ['Twilio', 'ElevenLabs', 'OpenAI', 'Anthropic', 'Gemini', 'Deepgram'];

function NavBar({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/70 backdrop-blur-glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="text-md font-semibold tracking-tight">VoiceFlow AI</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {['Product', 'Features', 'Pricing', 'Changelog'].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text"
            >
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Link to="/customers">
              <Button size="sm">
                Open dashboard <ArrowRight size={14} />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">
                  Start free <ArrowRight size={14} />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 60% at 50% 0%, hsl(var(--accent) / 0.22), transparent 65%), radial-gradient(40% 50% at 80% 20%, hsl(294 75% 50% / 0.12), transparent 60%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pb-32 lg:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-2/60 px-3 py-1.5 text-xs font-semibold text-text-secondary backdrop-blur">
              <Sparkles size={12} className="text-accent-light" />
              Voice agent v2 — sub-2s response, fluent barge-in
            </div>
            <h1 className="text-[44px] font-bold leading-[1.05] tracking-tightest sm:text-[56px] lg:text-[64px]">
              AI conversations
              <br />
              <span className="bg-gradient-to-r from-accent-light via-accent to-accent-dark bg-clip-text text-transparent">
                that convert.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-text-secondary">
              Launch outbound voice, WhatsApp, and SMS campaigns from one workspace. Watch every
              call live, auto-score every lead, and hand your team only the warmest replies.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={isAuthed ? '/customers' : '/signup'}>
                <Button size="lg">
                  {isAuthed ? 'Open dashboard' : 'Start free trial'} <ArrowRight size={16} />
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="outline">
                  <Headphones size={16} />
                  Listen to a live call
                </Button>
              </a>
            </div>

            <div className="grid max-w-md grid-cols-3 gap-6 pt-4">
              {HERO_STATS.map(([value, label]) => (
                <div key={label} className="space-y-1">
                  <div className="font-mono text-2xl font-bold tabular-nums text-text">{value}</div>
                  <div className="text-2xs uppercase tracking-wider text-text-tertiary">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <LiveCallCard />
        </div>
      </div>
    </section>
  );
}

function LiveCallCard() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-6 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(40% 60% at 60% 40%, hsl(var(--accent) / 0.35), transparent 65%)',
        }}
      />
      <div className="glass-surface rounded-2xl border border-border-light/40 p-1">
        <div className="rounded-[18px] bg-surface/80 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="live-dot" />
              <span className="text-xs font-semibold uppercase tracking-widest text-success">
                Live call
              </span>
              <span className="text-xs text-text-tertiary">· 00:47</span>
            </div>
            <Chip tone="accent">Acme Co. campaign</Chip>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white flex items-center justify-center font-semibold">
              SH
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-md font-semibold text-text">Sarah Henderson</div>
              <div className="text-xs text-text-tertiary">VP Operations · +1 (415) 555-0142</div>
            </div>
            <Waveform bars={18} height={28} className="text-accent-light" />
          </div>

          <div className="mt-5 space-y-2.5">
            <TranscriptLine role="agent" name="Agent" text="Hi Sarah — quick question on your inbound flow. Sounds good?" />
            <TranscriptLine role="user" name="Sarah" text="Sure, I have a couple of minutes." />
            <TranscriptLine
              role="agent"
              name="Agent"
              text="Perfect. Are you handling more than 200 demo requests a week right now?"
            />
            <TranscriptLine role="user" name="Sarah" text="Closer to 400 — that’s the bottleneck." typing />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <Metric label="Sentiment" value="Positive" tone="success" />
            <Metric label="Intent" value="Demo ↑" tone="accent" />
            <Metric label="Lead score" value="92 / 100" tone="warning" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TranscriptLine({
  role,
  name,
  text,
  typing,
}: {
  role: 'agent' | 'user';
  name: string;
  text: string;
  typing?: boolean;
}) {
  const isAgent = role === 'agent';
  return (
    <div className={`flex gap-2.5 ${isAgent ? '' : 'flex-row-reverse'}`}>
      <div
        className={`mt-1 h-6 w-6 shrink-0 rounded-full text-2xs font-semibold flex items-center justify-center ${
          isAgent
            ? 'bg-accent/15 text-accent-light border border-accent/25'
            : 'bg-surface-2 text-text-secondary border border-border'
        }`}
      >
        {isAgent ? <Bot size={12} /> : name[0]}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
          isAgent
            ? 'bg-accent/10 text-text border border-accent/20'
            : 'bg-surface-2 text-text-secondary border border-border'
        }`}
      >
        <div className="text-2xs uppercase tracking-wider opacity-60 mb-0.5">{name}</div>
        <span>{text}</span>
        {typing && (
          <span className="ml-1 inline-flex items-center gap-0.5 align-middle">
            <span className="h-1 w-1 animate-pulse rounded-full bg-current opacity-70" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-current opacity-70 [animation-delay:150ms]" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-current opacity-70 [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'accent' | 'warning';
}) {
  const colors = {
    success: 'text-success',
    accent: 'text-accent-light',
    warning: 'text-warning',
  } as const;
  return (
    <div className="space-y-1">
      <div className="text-2xs uppercase tracking-wider text-text-tertiary">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${colors[tone]}`}>{value}</div>
    </div>
  );
}

function PartnerStrip() {
  return (
    <section className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-7">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-text-tertiary">
          <span className="text-xs uppercase tracking-widest">Powered by</span>
          {PARTNER_LOGOS.map((logo) => (
            <span key={logo} className="text-md font-semibold text-text-secondary/80">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <Chip tone="accent" className="mx-auto">
          <Zap size={11} />
          Built for outbound teams
        </Chip>
        <h2 className="mt-5 text-4xl font-bold tracking-tightest sm:text-[44px]">
          Everything you need to run a voice channel.
        </h2>
        <p className="mt-4 text-lg text-text-secondary">
          Voice infra, LLM orchestration, and post-call analytics in one product. No more stitching
          Twilio, your STT vendor, your prompt store, and your CRM together.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group dash-card relative overflow-hidden p-6 transition-all hover:border-border-light"
          >
            <div
              className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.18), transparent)',
              }}
            />
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent-light">
                <Icon size={18} />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="product" className="relative border-y border-border/60 bg-surface/30">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-5">
            <Chip tone="neutral">
              <Sparkles size={11} className="text-accent-light" />
              How it works
            </Chip>
            <h2 className="text-4xl font-bold tracking-tightest sm:text-[44px]">
              Ship a campaign before your coffee’s cold.
            </h2>
            <p className="text-lg text-text-secondary">
              Three steps from a clean Twilio number to live conversations. No agencies, no
              integration consultants, no SDR fiddling with CSV exports.
            </p>
            <div className="pt-2">
              <Link to="/signup">
                <Button variant="outline">
                  See the full walkthrough <ArrowUpRight size={14} />
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="dash-card flex gap-5 p-5"
                style={{ transform: `translateX(${i % 2 === 0 ? '0' : '12px'})` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border-light bg-surface-2 font-mono text-md font-semibold text-accent-light">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-md font-semibold text-text">{s.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <Chip tone="success">
            <BarChart3 size={11} />
            Outcomes, not vanity metrics
          </Chip>
          <h2 className="text-4xl font-bold tracking-tightest sm:text-[44px]">
            See what every dollar of outbound is doing.
          </h2>
          <p className="text-lg text-text-secondary">
            VoiceFlow scores every call against your ICP, attributes booked meetings back to
            campaign &amp; agent prompt, and gives you a real funnel — not a transcript dump.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              'Per-prompt A/B with statistical significance',
              'Webhook every “interested” lead to your CRM',
              'Replay any call with synced transcript + sentiment',
            ].map((b) => (
              <li key={b} className="flex items-start gap-3 text-md text-text-secondary">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check size={12} strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-card p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="text-2xs uppercase tracking-widest text-text-tertiary">
                Campaign · last 7 days
              </div>
              <div className="mt-1 text-md font-semibold">Acme — Q2 outbound</div>
            </div>
            <Chip tone="success" dot>
              Healthy
            </Chip>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-5">
            {[
              { label: 'Calls placed', value: '4,812', trend: [3, 5, 4, 7, 6, 9, 8] },
              { label: 'Connected', value: '4,733', trend: [4, 6, 5, 7, 8, 9, 10] },
              { label: 'Meetings', value: '317', trend: [2, 3, 5, 4, 6, 8, 9] },
            ].map((m) => (
              <div key={m.label} className="space-y-2">
                <div className="text-2xs uppercase tracking-wider text-text-tertiary">
                  {m.label}
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-text">{m.value}</div>
                <Sparkline points={m.trend} width={100} height={26} stroke="hsl(var(--accent-light))" />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: 'Interested', pct: 62, tone: 'bg-success' },
              { label: 'Callback', pct: 18, tone: 'bg-accent' },
              { label: 'Not now', pct: 14, tone: 'bg-warning' },
              { label: 'No', pct: 6, tone: 'bg-danger' },
            ].map((row) => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{row.label}</span>
                  <span className="font-mono tabular-nums text-text-tertiary">{row.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="dash-card relative overflow-hidden p-10 lg:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(70% 80% at 0% 50%, hsl(var(--accent) / 0.18), transparent 60%)',
          }}
        />
        <div className="relative space-y-6">
          <div className="flex gap-1 text-warning">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill="currentColor" stroke="none" />
            ))}
          </div>
          <p className="text-2xl font-semibold leading-snug tracking-tight text-text sm:text-3xl">
            “We replaced four SDRs and a whole stack of dialers with one VoiceFlow campaign.
            Pickup is up 3×, and our team only ever talks to people who already said yes.”
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white flex items-center justify-center text-sm font-semibold">
              MR
            </div>
            <div>
              <div className="text-md font-semibold text-text">Maya Rivera</div>
              <div className="text-xs text-text-tertiary">Head of Growth, Northwind Logistics</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection({ isAuthed }: { isAuthed: boolean }) {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 70% at 50% 100%, hsl(var(--accent) / 0.28), transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <h2 className="text-4xl font-bold tracking-tightest sm:text-[52px]">
          Start dialing in
          <br className="hidden sm:block" /> under five minutes.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-text-secondary">
          14-day free trial, no credit card. Your first 200 calls are on us.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to={isAuthed ? '/customers' : '/signup'}>
            <Button size="lg">
              {isAuthed ? 'Open dashboard' : 'Create your workspace'} <ArrowRight size={16} />
            </Button>
          </Link>
          <a href="mailto:sales@voiceflow.ai">
            <Button size="lg" variant="outline">
              Talk to sales
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold">
                V
              </div>
              <span className="text-md font-semibold tracking-tight">VoiceFlow AI</span>
            </Link>
            <p className="max-w-xs text-sm text-text-tertiary">
              AI voice infrastructure for outbound teams. Built on Twilio, ElevenLabs, and your
              favourite LLM.
            </p>
          </div>
          {[
            { title: 'Product', items: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { title: 'Company', items: ['About', 'Customers', 'Careers', 'Contact'] },
            { title: 'Resources', items: ['Docs', 'API reference', 'Status', 'Security'] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-2xs uppercase tracking-widest text-text-tertiary">
                {col.title}
              </div>
              <ul className="mt-3 space-y-2">
                {col.items.map((i) => (
                  <li key={i}>
                    <a
                      href="#"
                      className="text-sm text-text-secondary transition-colors hover:text-text"
                    >
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} VoiceFlow AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-text-secondary">Privacy</a>
            <a href="#" className="hover:text-text-secondary">Terms</a>
            <a href="#" className="hover:text-text-secondary">DPA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  return (
    <div className="min-h-screen bg-bg text-text">
      <NavBar isAuthed={isAuthed} />
      <main id="demo">
        <Hero isAuthed={isAuthed} />
        <PartnerStrip />
        <FeatureGrid />
        <HowItWorks />
        <MetricsShowcase />
        <Testimonial />
        <CtaSection isAuthed={isAuthed} />
      </main>
      <SiteFooter />
    </div>
  );
}
