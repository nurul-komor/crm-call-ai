import { useState } from 'react';
import {
  Download,
  Plus,
  Phone,
  MessageCircle,
  Zap,
  TrendingUp,
  DollarSign,
  Clock,
  BarChart2,
  Pause,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PageHeader } from '@/components/ui/PageHeader';
import { Waveform } from '@/components/Waveform';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const kpis = [
  {
    label: 'Total Conversations',
    value: '24,892',
    sub: '+18.4% vs last week',
    color: '#3B82F6',
    icon: MessageCircle,
    spark: [40, 55, 48, 62, 70, 68, 82, 89, 76, 94, 88, 100],
  },
  {
    label: 'Connected Calls',
    value: '16,780',
    sub: '67.4% rate · +5.2%',
    color: '#22C55E',
    icon: Phone,
    spark: [60, 58, 72, 68, 80, 78, 85, 90, 82, 92, 88, 95],
  },
  {
    label: 'Qualified Leads',
    value: '4,218',
    sub: 'Score A+/A · +12%',
    color: '#F59E0B',
    icon: Zap,
    spark: [30, 42, 38, 55, 48, 62, 58, 70, 68, 75, 82, 78],
  },
  {
    label: 'Conversion Rate',
    value: '34.2%',
    sub: '+12.0% improvement',
    color: '#EC4899',
    icon: TrendingUp,
    spark: [25, 28, 30, 28, 32, 31, 33, 32, 34, 33, 35, 34],
  },
  {
    label: 'Revenue Attributed',
    value: '$482K',
    sub: 'ARR pipeline · +24%',
    color: '#3B82F6',
    icon: DollarSign,
    spark: [50, 55, 52, 60, 65, 68, 72, 78, 82, 85, 92, 98],
  },
  {
    label: 'Avg. Call Duration',
    value: '3.42 min',
    sub: '+0.28 min vs avg',
    color: '#60A5FA',
    icon: Clock,
    spark: [60, 62, 58, 65, 68, 64, 70, 68, 72, 75, 70, 72],
  },
  {
    label: 'Active Campaigns',
    value: '6',
    sub: '2 starting today',
    color: '#22C55E',
    icon: BarChart2,
    spark: [3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6],
  },
  {
    label: 'WhatsApp Convos',
    value: '8,942',
    sub: '36% of total volume',
    color: '#25D366',
    icon: MessageCircle,
    spark: [40, 45, 42, 50, 55, 52, 60, 65, 62, 70, 75, 80],
  },
];

const volumePoints = [22, 28, 35, 32, 42, 48, 52, 58, 55, 65, 70, 68, 75, 82, 78, 88, 92, 86, 95, 98];

const channels = [
  { name: 'Phone Calls', value: 12420, pct: 50, color: '#2563EB' },
  { name: 'WhatsApp Voice', value: 5200, pct: 21, color: '#25D366' },
  { name: 'WhatsApp Chat', value: 4800, pct: 19, color: '#34D399' },
  { name: 'Inbound', value: 2472, pct: 10, color: '#F59E0B' },
];

const convos = [
  { name: 'Maria Santos', campaign: 'Q4 Enterprise', channel: 'Phone', duration: '2:34', score: 'A+', img: 5 },
  { name: 'James Chen', campaign: 'Beta Onboarding', channel: 'WhatsApp Voice', duration: '1:12', score: 'B+', img: 13 },
  { name: 'Aisha Patel', campaign: 'Q4 Enterprise', channel: 'WhatsApp Chat', duration: '5:01', score: 'A', img: 47 },
  { name: 'Carlos Rivera', campaign: 'LATAM Outreach', channel: 'Phone', duration: '0:45', score: '—', img: 33 },
  { name: 'Emma Wilson', campaign: 'EU Renewals', channel: 'WhatsApp Voice', duration: '3:18', score: 'A−', img: 44 },
];

const acts = [
  { text: 'Lead qualified — Maria Santos', meta: 'A+ score · Q4 Enterprise', time: '2m', color: '#22C55E', tone: 'success' as const },
  { text: 'Campaign completed — Beta Onboarding', meta: '892 customers · 34% converted', time: '14m', color: '#3B82F6', tone: 'accent' as const },
  { text: 'Appointment booked', meta: 'Carlos Rivera · Tomorrow 2:00 PM', time: '28m', color: '#3B82F6', tone: 'accent' as const },
  { text: 'Callback requested', meta: 'James Chen · in 1h', time: '45m', color: '#F59E0B', tone: 'warning' as const },
  { text: 'AI escalated to human agent', meta: 'Sarah Kim · Complex pricing question', time: '1h', color: '#EF4444', tone: 'danger' as const },
  { text: 'New lead imported', meta: 'EU Renewals · 1,200 contacts added', time: '2h', color: '#22C55E', tone: 'success' as const },
];

const campaigns = [
  { name: 'Q4 Enterprise Outreach', status: 'Live', calls: 8420, conv: 38, prog: 84 },
  { name: 'Beta Onboarding', status: 'Live', calls: 4218, conv: 34, prog: 62 },
  { name: 'LATAM Outreach', status: 'Live', calls: 3120, conv: 29, prog: 51 },
  { name: 'EU Renewals', status: 'Live', calls: 2980, conv: 42, prog: 73 },
  { name: 'APAC Discovery', status: 'Draft', calls: 0, conv: 0, prog: 0 },
];

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80;
  const h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

// ─── Volume Area Chart ────────────────────────────────────────────────────────

function VolumeChart({ data }: { data: number[] }) {
  const w = 600;
  const h = 160;
  const max = Math.max(...data);
  const min = 0;
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 12);
    return { x, y };
  });
  const linePts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPts = [
    `0,${h}`,
    ...pts.map(p => `${p.x},${p.y}`),
    `${w},${h}`,
  ].join(' ');

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 24}`} className="overflow-visible">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = h - t * (h - 12);
        const val = Math.round(min + t * range);
        return (
          <g key={t}>
            <line x1={0} y1={y} x2={w} y2={y} stroke="hsl(240 4% 16%)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={0} y={y - 4} fontSize="10" fill="hsl(240 5% 45%)">{val}K</text>
          </g>
        );
      })}
      {/* Area fill */}
      <polygon points={areaPts} fill="url(#areaGrad)" />
      {/* Line */}
      <polyline
        points={linePts}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots on last point */}
      {pts.length > 0 && (
        <>
          <circle cx={pts[pts.length - 1]!.x} cy={pts[pts.length - 1]!.y} r="4" fill="#3B82F6" />
          <circle cx={pts[pts.length - 1]!.x} cy={pts[pts.length - 1]!.y} r="7" fill="#3B82F6" fillOpacity="0.2" />
        </>
      )}
      {/* X labels */}
      {pts.filter((_, i) => i % 3 === 0).map((p, idx) => (
        <text key={idx} x={p.x} y={h + 18} textAnchor="middle" fontSize="10" fill="hsl(240 5% 45%)">
          {labels[idx * 3]}
        </text>
      ))}
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ data }: { data: typeof channels }) {
  const size = 140;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map((d) => {
    const dash = (d.pct / 100) * circ;
    const gap = circ - dash;
    const slice = { ...d, dash, gap, offset };
    offset += dash + 2;
    return slice;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(240 4% 16%)" strokeWidth="18" />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="18"
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={circ / 4 - s.offset}
          strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="hsl(0 0% 98%)">24.9K</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="hsl(240 5% 45%)">total</text>
    </svg>
  );
}

// ─── Score chip helper ────────────────────────────────────────────────────────

function scoreTone(score: string): 'success' | 'accent' | 'warning' | 'neutral' {
  if (score === 'A+' || score === 'A') return 'success';
  if (score === 'A−' || score === 'B+') return 'accent';
  if (score === 'B') return 'warning';
  return 'neutral';
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = '#2563EB' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[hsl(240_4%_16%)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardHomePage() {
  const [_activeConvo, setActiveConvo] = useState<number | null>(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <PageHeader
        eyebrow="Operations"
        title={greeting}
        description="Here's what's happening across your AI workforce right now."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => console.log('export')}>
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button size="sm" onClick={() => console.log('new campaign')}>
              <Plus className="w-3.5 h-3.5" />
              New Campaign
            </Button>
          </>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card flex flex-col gap-3">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${kpi.color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <Sparkline data={kpi.spark} color={kpi.color} />
              </div>
              {/* Value */}
              <div>
                <div className="text-2xl font-bold tracking-tight text-text">{kpi.value}</div>
                <div className="text-[11px] text-text-tertiary mt-0.5 truncate">{kpi.label}</div>
              </div>
              {/* Sub */}
              <div className="text-[11px] font-medium" style={{ color: kpi.color }}>
                {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume area chart — 2fr */}
        <div className="lg:col-span-2 dash-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold text-text">Conversation Volume</div>
              <div className="text-xs text-text-tertiary mt-0.5">Last 20 days · all channels</div>
            </div>
            <div className="flex gap-2">
              {['7d', '14d', '30d'].map((r) => (
                <button
                  key={r}
                  className="text-xs px-2.5 py-1 rounded-md border border-border text-text-tertiary hover:text-text hover:border-border-light transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <VolumeChart data={volumePoints} />
        </div>

        {/* Channel donut — 1fr */}
        <div className="dash-card p-5 flex flex-col">
          <div className="text-sm font-semibold text-text mb-1">Channel Breakdown</div>
          <div className="text-xs text-text-tertiary mb-5">Volume by channel this week</div>
          <div className="flex flex-col items-center gap-5 flex-1 justify-center">
            <DonutChart data={channels} />
            <div className="w-full space-y-2.5">
              {channels.map((ch) => (
                <div key={ch.name} className="flex items-center gap-2.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: ch.color }}
                  />
                  <span className="text-xs text-text-secondary flex-1 truncate">{ch.name}</span>
                  <span className="text-xs font-semibold text-text tabular-nums">{ch.pct}%</span>
                  <span className="text-xs text-text-tertiary tabular-nums">
                    {ch.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live + Activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live conversations — 2fr */}
        <div className="lg:col-span-2 dash-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="live-dot" />
              <span className="text-sm font-semibold text-text">Live Conversations</span>
              <span className="chip text-xs text-success bg-success/10 border-success/30">
                {convos.length} active
              </span>
            </div>
            <Button variant="ghost" size="sm">
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Table head */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-5 py-2.5 border-b border-border">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Contact</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-24 text-center">Channel</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-14 text-center">Time</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-10 text-center">Score</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-24 text-center">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {convos.map((c, i) => (
              <div
                key={i}
                className="row-hover grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-5 py-3 items-center cursor-pointer"
                onClick={() => setActiveConvo(i)}
              >
                {/* Contact */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={`https://i.pravatar.cc/64?img=${c.img}`}
                    alt={c.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-success/40"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text truncate">{c.name}</div>
                    <div className="text-xs text-text-tertiary truncate">{c.campaign}</div>
                  </div>
                </div>

                {/* Channel */}
                <div className="w-24 flex justify-center">
                  <Chip tone={c.channel === 'Phone' ? 'accent' : 'success'} className="text-[11px]">
                    {c.channel === 'Phone' ? (
                      <Phone className="w-2.5 h-2.5 inline mr-1" />
                    ) : (
                      <MessageCircle className="w-2.5 h-2.5 inline mr-1" />
                    )}
                    {c.channel === 'WhatsApp Chat' ? 'WA Chat' : c.channel === 'WhatsApp Voice' ? 'WA Voice' : 'Phone'}
                  </Chip>
                </div>

                {/* Duration */}
                <div className="w-14 text-center text-sm font-mono text-text-secondary">
                  {c.duration}
                </div>

                {/* Score */}
                <div className="w-10 flex justify-center">
                  {c.score !== '—' ? (
                    <Chip tone={scoreTone(c.score)} className="text-[11px] font-bold">
                      {c.score}
                    </Chip>
                  ) : (
                    <span className="text-text-tertiary text-sm">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="w-24 flex items-center justify-center gap-1.5">
                  <Waveform
                    bars={5}
                    height={18}
                    active
                    color="#22C55E"
                    className="mr-1"
                  />
                  <button
                    className="h-6 w-6 flex items-center justify-center rounded-md border border-border text-text-tertiary hover:text-text hover:border-border-light transition-colors"
                    title="Listen"
                    onClick={(e) => { e.stopPropagation(); console.log('listen', c.name); }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    className="h-6 w-6 flex items-center justify-center rounded-md border border-border text-text-tertiary hover:text-warning hover:border-warning/40 transition-colors"
                    title="Pause"
                    onClick={(e) => { e.stopPropagation(); console.log('pause', c.name); }}
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed — 1fr */}
        <div className="dash-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-sm font-semibold text-text">Activity Feed</span>
            <Button variant="ghost" size="sm">
              All
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {acts.map((a, i) => (
              <div key={i} className="row-hover flex gap-3 px-5 py-3.5 cursor-pointer">
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: a.color }}
                  />
                  {i < acts.length - 1 && (
                    <span className="w-px flex-1 mt-1.5" style={{ backgroundColor: `${a.color}30` }} />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-text leading-snug">{a.text}</p>
                    <span className="text-[11px] text-text-tertiary shrink-0">{a.time}</span>
                  </div>
                  <p className="text-[11px] text-text-tertiary mt-0.5 leading-snug">{a.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Campaigns table */}
      <div className="dash-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="text-sm font-semibold text-text">Campaign Performance</div>
            <div className="text-xs text-text-tertiary mt-0.5">All active and draft campaigns</div>
          </div>
          <Button variant="outline" size="sm">
            Manage campaigns
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_auto_auto_auto_auto] gap-x-6 px-5 py-2.5 border-b border-border">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Campaign</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-16 text-center">Status</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-20 text-right">Calls</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-40">Progress</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary w-20 text-right">Conv.</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {campaigns.map((camp, i) => (
            <div
              key={i}
              className="row-hover grid grid-cols-[2fr_auto_auto_auto_auto] gap-x-6 px-5 py-3.5 items-center cursor-pointer"
            >
              {/* Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-1.5 h-8 rounded-full shrink-0"
                  style={{
                    backgroundColor: camp.status === 'Live' ? '#22C55E' : 'hsl(240 4% 26%)',
                  }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text truncate">{camp.name}</div>
                </div>
              </div>

              {/* Status */}
              <div className="w-16 flex justify-center">
                <Chip
                  tone={camp.status === 'Live' ? 'success' : 'neutral'}
                  dot
                  pulse={camp.status === 'Live'}
                  className="text-[11px]"
                >
                  {camp.status}
                </Chip>
              </div>

              {/* Calls */}
              <div className="w-20 text-right text-sm tabular-nums text-text-secondary">
                {camp.calls > 0 ? camp.calls.toLocaleString() : '—'}
              </div>

              {/* Progress bar */}
              <div className="w-40 space-y-1">
                <ProgressBar value={camp.prog} color={camp.status === 'Live' ? '#2563EB' : 'hsl(240 4% 26%)'} />
                <div className="text-[11px] text-text-tertiary text-right">{camp.prog}%</div>
              </div>

              {/* Conversion */}
              <div className="w-20 text-right">
                {camp.conv > 0 ? (
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: camp.conv >= 35 ? '#22C55E' : camp.conv >= 25 ? '#F59E0B' : 'hsl(0 0% 98%)' }}
                  >
                    {camp.conv}%
                  </span>
                ) : (
                  <span className="text-sm text-text-tertiary">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
