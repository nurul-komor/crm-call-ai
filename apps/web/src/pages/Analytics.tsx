import { useState } from 'react';
import { Download, TrendingUp, Phone, Users, DollarSign, Clock, BarChart2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

// ─── Mock data ────────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Total Conversations', value: '24,892', change: '+18.4%', positive: true, icon: BarChart2 },
  { label: 'Connected Calls',     value: '16,780', change: '+5.2%',  positive: true, icon: Phone },
  { label: 'Qualified Leads',     value: '4,218',  change: '+12%',   positive: true, icon: Users },
  { label: 'Conversion Rate',     value: '34.2%',  change: '+12.0%', positive: true, icon: TrendingUp },
  { label: 'Avg Call Duration',   value: '3.42 min', change: '+0.28', positive: true, icon: Clock },
  { label: 'Revenue Attributed',  value: '$482K',  change: '+24%',   positive: true, icon: DollarSign },
];

const trendPoints = [22, 28, 35, 32, 42, 48, 52, 58, 55, 65, 70, 68, 75, 82, 78, 88, 92, 86, 95, 98];
const trendDayLabels = ['Jun 2', 'Jun 5', 'Jun 8', 'Jun 11', 'Jun 14', 'Jun 17', 'Jun 20'];

const sentiments = [
  { label: 'Positive', value: 68, color: '#22C55E' },
  { label: 'Neutral',  value: 22, color: '#F59E0B' },
  { label: 'Negative', value: 10, color: '#EF4444' },
];

const channels = [
  { name: 'Phone Calls',    conversations: 12420, connected: '74.2%', qualified: '31.8%', conversion: '28.4%' },
  { name: 'WhatsApp Voice', conversations: 5200,  connected: '82.1%', qualified: '38.5%', conversion: '35.2%' },
  { name: 'WhatsApp Chat',  conversations: 4800,  connected: '94.8%', qualified: '42.3%', conversion: '39.1%' },
  { name: 'Inbound',        conversations: 2472,  connected: '91.2%', qualified: '28.9%', conversion: '26.5%' },
];

const DATE_RANGES = ['24H', '7D', '30D', '90D'] as const;
type DateRange = (typeof DATE_RANGES)[number];

const TABS = ['Overview', 'Campaigns', 'Channels', 'AI Performance'] as const;
type Tab = (typeof TABS)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendChart() {
  const min = Math.min(...trendPoints);
  const max = Math.max(...trendPoints);
  const range = max - min || 1;

  // Map to SVG viewBox 0 0 100 100 (y-axis inverted)
  const pts = trendPoints.map((v, i) => {
    const x = (i / (trendPoints.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 80 - 10; // 10px padding top/bottom
    return `${x},${y}`;
  });

  const polyline = pts.join(' ');
  const areaPath = `M${pts[0]} ${pts.slice(1).map((p) => `L${p}`).join(' ')} L100,100 L0,100 Z`;

  return (
    <div className="dash-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--text-tertiary))' }}>
            Conversion Trend
          </p>
          <p className="text-lg font-bold mt-0.5" style={{ color: 'hsl(var(--text))' }}>
            Last 20 Days
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-md"
          style={{ background: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))' }}>
          +18.4% vs prior period
        </span>
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        width="100%"
        height="180"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(221 83% 53%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[25, 50, 75].map((y) => (
          <line
            key={y}
            x1="0" y1={y} x2="100" y2={y}
            stroke="hsl(var(--border))"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="hsl(221 83% 53%)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* End dot */}
        <circle
          cx={pts[pts.length - 1]?.split(',')[0] ?? '100'}
          cy={pts[pts.length - 1]?.split(',')[1] ?? '0'}
          r="2"
          fill="hsl(221 83% 53%)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Day labels */}
      <div className="flex justify-between mt-2">
        {trendDayLabels.map((label) => (
          <span key={label} className="text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SentimentCard() {
  return (
    <div className="dash-card p-5 flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--text-tertiary))' }}>
          Sentiment Analysis
        </p>
        <p className="text-lg font-bold" style={{ color: 'hsl(var(--text))' }}>
          AI-Detected Tone
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {sentiments.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
                {s.label}
              </span>
              <span className="text-sm font-bold" style={{ color: 'hsl(var(--text))' }}>
                {s.value}%
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ background: 'hsl(var(--border))' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${s.value}%`, background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Donut-style summary row */}
      <div className="flex gap-3 pt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        {sentiments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[11px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChannelTable() {
  return (
    <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>
          Performance
        </p>
        <p className="text-lg font-bold" style={{ color: 'hsl(var(--text))' }}>
          Channel Breakdown
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid hsl(var(--border))` }}>
            {['Channel', 'Conversations', 'Connected', 'Qualified', 'Conversion'].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'hsl(var(--text-tertiary))' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map((ch) => (
            <tr
              key={ch.name}
              className="row-hover"
              style={{ borderBottom: `1px solid hsl(var(--border))` }}
            >
              <td className="px-5 py-3.5 font-medium" style={{ color: 'hsl(var(--text))' }}>
                {ch.name}
              </td>
              <td className="px-5 py-3.5" style={{ color: 'hsl(var(--text-secondary))' }}>
                {ch.conversations.toLocaleString()}
              </td>
              <td className="px-5 py-3.5" style={{ color: 'hsl(var(--text-secondary))' }}>
                {ch.connected}
              </td>
              <td className="px-5 py-3.5" style={{ color: 'hsl(var(--text-secondary))' }}>
                {ch.qualified}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={{ background: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))' }}
                >
                  {ch.conversion}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI grid */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  {kpi.label}
                </p>
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsl(var(--accent) / 0.12)' }}
                >
                  <Icon size={14} style={{ color: 'hsl(var(--accent-light))' }} />
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--text))' }}>
                {kpi.value}
              </p>
              <p
                className="text-xs font-medium mt-1"
                style={{ color: kpi.positive ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}
              >
                {kpi.change} <span style={{ color: 'hsl(var(--text-tertiary))' }}>vs last period</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <TrendChart />

      {/* Sentiment + Channel table */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <SentimentCard />
        <ChannelTable />
      </div>
    </div>
  );
}

function ComingSoonTab({ name }: { name: string }) {
  return (
    <div className="dash-card p-12 flex flex-col items-center justify-center text-center gap-3">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
        style={{ background: 'hsl(var(--accent) / 0.1)' }}
      >
        <BarChart2 size={22} style={{ color: 'hsl(var(--accent-light))' }} />
      </div>
      <p className="text-base font-semibold" style={{ color: 'hsl(var(--text))' }}>
        {name}
      </p>
      <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
        This section is coming soon.
      </p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [dateRange, setDateRange] = useState<DateRange>('7D');

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Track performance across all channels and campaigns."
        actions={
          <>
            {/* Date range chips */}
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'hsl(var(--surface-2))' }}>
              {DATE_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className="chip"
                  style={
                    dateRange === r
                      ? {
                          background: 'hsl(var(--accent))',
                          color: '#fff',
                          fontWeight: 600,
                          borderColor: 'transparent',
                        }
                      : { color: 'hsl(var(--text-secondary))' }
                  }
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Export button */}
            <Button variant="secondary" size="sm">
              <Download size={14} />
              Export
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div className="tab-row mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-btn${tab === t ? ' active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview'        && <OverviewTab />}
      {tab === 'Campaigns'       && <ComingSoonTab name="Campaigns Analytics" />}
      {tab === 'Channels'        && <ComingSoonTab name="Channels Analytics" />}
      {tab === 'AI Performance'  && <ComingSoonTab name="AI Performance Analytics" />}
    </div>
  );
}
