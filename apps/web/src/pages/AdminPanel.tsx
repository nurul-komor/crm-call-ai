import { Shield } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

// ─── Mock data ────────────────────────────────────────────────────────────────

const kpis = [
  { label: 'MRR', val: '$248K', change: '+18%' },
  { label: 'ARR', val: '$2.98M', change: '+22%' },
  { label: 'Total Companies', val: '482', change: '+34' },
  { label: 'Active Users', val: '12,418', change: '+842' },
  { label: 'Calls (24h)', val: '486K', change: '+18%' },
  { label: 'Provider Cost', val: '$12.4K', change: '-8%' },
];

const companies = [
  { name: 'TechCorp Inc.', plan: 'Enterprise', users: 84, calls: '142K', revenue: '$8.4K', status: 'Active', img: 1 },
  { name: 'Innovate Labs', plan: 'Professional', users: 24, calls: '52K', revenue: '$3.2K', status: 'Active', img: 13 },
  { name: 'GrowthCo', plan: 'Enterprise', users: 142, calls: '218K', revenue: '$14.8K', status: 'Active', img: 47 },
  { name: 'Scale Mexico', plan: 'Starter', users: 8, calls: '12K', revenue: '$890', status: 'Trial', img: 33 },
  { name: 'FinServ UK', plan: 'Professional', users: 32, calls: '68K', revenue: '$4.1K', status: 'Active', img: 44 },
  { name: 'Apex Tokyo', plan: 'Enterprise', users: 56, calls: '98K', revenue: '$9.2K', status: 'Active', img: 60 },
];

const services = [
  { name: 'OpenAI API', status: 'Healthy', latency: '420ms', uptime: 99.99 },
  { name: 'Anthropic API', status: 'Healthy', latency: '380ms', uptime: 99.98 },
  { name: 'Google AI', status: 'Healthy', latency: '510ms', uptime: 99.94 },
  { name: 'Twilio Voice', status: 'Healthy', latency: '120ms', uptime: 100 },
  { name: 'ElevenLabs', status: 'Degraded', latency: '820ms', uptime: 98.4 },
  { name: 'WhatsApp Cloud', status: 'Healthy', latency: '180ms', uptime: 99.92 },
  { name: 'Webhook Queue', status: 'Healthy', latency: '8ms', uptime: 100 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiGrid() {
  return (
    <div className="grid grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const isNegativeChange = kpi.change.startsWith('-');
        return (
          <div key={kpi.label} className="kpi-card">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'hsl(var(--text-tertiary))' }}
            >
              {kpi.label}
            </p>
            <p
              className="text-xl font-bold tracking-tight"
              style={{ color: 'hsl(var(--text))' }}
            >
              {kpi.val}
            </p>
            <p
              className="text-xs font-medium mt-1"
              style={{
                color: isNegativeChange
                  ? 'hsl(var(--danger))'
                  : 'hsl(var(--success))',
              }}
            >
              {kpi.change}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CompaniesTable() {
  return (
    <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div>
          <p className="text-base font-semibold" style={{ color: 'hsl(var(--text))' }}>
            Companies
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-tertiary))' }}>
            482 total · sorted by revenue
          </p>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-[11px] uppercase tracking-wider"
            style={{
              borderBottom: `1px solid hsl(var(--border))`,
              color: 'hsl(var(--text-tertiary))',
            }}
          >
            <th className="text-left font-semibold px-5 py-3 w-10" />
            <th className="text-left font-semibold px-2 py-3">Company</th>
            <th className="text-left font-semibold px-2 py-3">Plan</th>
            <th className="text-left font-semibold px-2 py-3">Users</th>
            <th className="text-left font-semibold px-2 py-3">Calls</th>
            <th className="text-left font-semibold px-2 py-3">Revenue</th>
            <th className="text-left font-semibold px-2 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((co) => (
            <tr
              key={co.name}
              className="row-hover"
              style={{ borderBottom: `1px solid hsl(var(--border))` }}
            >
              {/* Avatar */}
              <td className="px-5 py-3">
                <img
                  src={`https://i.pravatar.cc/64?img=${co.img}`}
                  alt={co.name}
                  width={28}
                  height={28}
                  className="rounded-md object-cover flex-shrink-0"
                  style={{ width: 28, height: 28 }}
                />
              </td>
              {/* Company name */}
              <td className="px-2 py-3 font-semibold" style={{ color: 'hsl(var(--text))' }}>
                {co.name}
              </td>
              {/* Plan */}
              <td className="px-2 py-3">
                <span
                  className="text-xs font-bold"
                  style={{ color: 'hsl(var(--accent-light))' }}
                >
                  {co.plan}
                </span>
              </td>
              {/* Users */}
              <td className="px-2 py-3 tabular-nums" style={{ color: 'hsl(var(--text-secondary))' }}>
                {co.users}
              </td>
              {/* Calls */}
              <td className="px-2 py-3 tabular-nums" style={{ color: 'hsl(var(--text-secondary))' }}>
                {co.calls}
              </td>
              {/* Revenue */}
              <td
                className="px-2 py-3 font-semibold tabular-nums"
                style={{ color: 'hsl(var(--text))' }}
              >
                {co.revenue}
              </td>
              {/* Status chip */}
              <td className="px-2 py-3">
                {co.status === 'Active' ? (
                  <span
                    className="chip"
                    style={{
                      color: 'hsl(var(--success))',
                      borderColor: 'hsl(var(--success) / 0.35)',
                      background: 'hsl(var(--success) / 0.08)',
                    }}
                  >
                    {co.status}
                  </span>
                ) : (
                  <span
                    className="chip"
                    style={{
                      color: 'hsl(var(--warning))',
                      borderColor: 'hsl(var(--warning) / 0.35)',
                      background: 'hsl(var(--warning) / 0.08)',
                    }}
                  >
                    {co.status}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const isHealthy = status === 'Healthy';
  const color = isHealthy ? 'hsl(var(--success))' : 'hsl(var(--warning))';
  return (
    <span
      className="flex-shrink-0 rounded-full"
      style={{
        width: 8,
        height: 8,
        background: color,
        boxShadow: `0 0 6px 1px ${color}`,
        display: 'inline-block',
      }}
    />
  );
}

function SystemStatusCard() {
  return (
    <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <p className="text-base font-semibold" style={{ color: 'hsl(var(--text))' }}>
          System Status
        </p>
        <span
          className="text-xs font-medium"
          style={{ color: 'hsl(var(--success))' }}
        >
          All systems operational
        </span>
      </div>

      <div className="flex flex-col">
        {services.map((svc, i) => (
          <div
            key={svc.name}
            className="row-hover flex items-center gap-3 px-5 py-3"
            style={{
              borderBottom:
                i < services.length - 1 ? `1px solid hsl(var(--border))` : undefined,
            }}
          >
            <StatusDot status={svc.status} />
            <span
              className="flex-1 text-sm font-medium"
              style={{ color: 'hsl(var(--text))' }}
            >
              {svc.name}
            </span>
            <div className="flex flex-col items-end gap-0.5">
              <span
                className="text-xs tabular-nums"
                style={{ color: 'hsl(var(--text-tertiary))' }}
              >
                {svc.uptime}% · {svc.latency}
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{
                  color:
                    svc.status === 'Healthy'
                      ? 'hsl(var(--success))'
                      : 'hsl(var(--warning))',
                }}
              >
                {svc.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function AdminPanelPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Admin Panel"
        description="Global platform monitoring and company management."
        actions={
          <Button size="sm" className="gap-2">
            <Shield size={14} />
            System Health
          </Button>
        }
      />

      {/* 6-col KPI grid */}
      <KpiGrid />

      {/* Row: Companies table (2fr) + System Status (1fr) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <CompaniesTable />
        <SystemStatusCard />
      </div>
    </div>
  );
}
