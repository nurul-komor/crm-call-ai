import { Download } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

// ─── Mock data ────────────────────────────────────────────────────────────────

const usageMeters = [
  { label: 'AI Conversations', used: 3284, total: 5000, color: 'hsl(var(--accent-light))' },
  { label: 'Call Minutes', used: 12450, total: 20000, color: 'hsl(var(--success))' },
  { label: 'WhatsApp Messages', used: 8942, total: 15000, color: '#25D366' },
];

const aiCosts = [
  { name: 'Claude 3.5', val: '$1,240', color: '#D4A574' },
  { name: 'GPT-4o', val: '$890', color: '#10A37F' },
  { name: 'Gemini Pro', val: '$310', color: '#4285F4' },
  { name: 'OpenRouter', val: '$48', color: '#FF6B35' },
];

const invoices = [
  { id: 'INV-2025-12', date: 'Dec 15, 2025', amount: '$349.00', status: 'Paid' },
  { id: 'INV-2025-11', date: 'Nov 15, 2025', amount: '$349.00', status: 'Paid' },
  { id: 'INV-2025-10', date: 'Oct 15, 2025', amount: '$349.00', status: 'Paid' },
  { id: 'INV-2025-09', date: 'Sep 15, 2025', amount: '$249.00', status: 'Paid' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function UsageMeter({
  label,
  used,
  total,
  color,
}: {
  label: string;
  used: number;
  total: number;
  color: string;
}) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
          {label}
        </span>
        <span className="text-xs font-semibold" style={{ color: 'hsl(var(--text-tertiary))' }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div
        className="text-xs"
        style={{ color: 'hsl(var(--text-tertiary))' }}
      >
        {used.toLocaleString()} / {total.toLocaleString()}
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 5, background: 'hsl(var(--border))' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PlanCard() {
  return (
    <div
      className="dash-card relative overflow-hidden p-6 flex flex-col gap-6"
    >
      {/* Top-right radial gradient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 320,
          height: 320,
          background: 'radial-gradient(circle at top right, rgba(37,99,235,0.12), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between relative">
        <div className="flex flex-col gap-1">
          <p
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'hsl(var(--accent-light))' }}
          >
            Current Plan
          </p>
          <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--text))' }}>
            Professional
          </h2>
          <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
            $349/mo · Billed monthly · Renews Jan 15, 2026
          </p>
        </div>
        <Button size="sm">Upgrade to Enterprise</Button>
      </div>

      {/* Usage meters */}
      <div className="grid grid-cols-1 gap-5 relative">
        {usageMeters.map((m) => (
          <UsageMeter key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}

function AiCostCard() {
  return (
    <div className="dash-card p-5 flex flex-col gap-5">
      {/* Summary */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--text-tertiary))' }}>
          This month AI cost
        </p>
        <p className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--text))' }}>
          $2,488.40
        </p>
        <p className="text-xs font-medium" style={{ color: 'hsl(var(--success))' }}>
          ↓ 12% vs last month
        </p>
      </div>

      {/* Provider cost rows */}
      <div
        className="border-t flex flex-col gap-3 pt-4"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        {aiCosts.map((c) => (
          <div key={c.name} className="flex items-center gap-2.5">
            <span
              className="flex-shrink-0 rounded-full"
              style={{ width: 8, height: 8, background: c.color }}
            />
            <span className="flex-1 text-sm font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
              {c.name}
            </span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'hsl(var(--text))' }}>
              {c.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicesTable() {
  return (
    <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <p className="text-base font-semibold" style={{ color: 'hsl(var(--text))' }}>
          Recent Invoices
        </p>
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
            <th className="text-left font-semibold px-5 py-3">Invoice</th>
            <th className="text-left font-semibold px-5 py-3">Date</th>
            <th className="text-left font-semibold px-5 py-3">Amount</th>
            <th className="text-left font-semibold px-5 py-3">Status</th>
            <th className="px-5 py-3 w-24" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="row-hover"
              style={{ borderBottom: `1px solid hsl(var(--border))` }}
            >
              <td className="px-5 py-3.5">
                <span className="font-mono text-sm" style={{ color: 'hsl(var(--text))' }}>
                  {inv.id}
                </span>
              </td>
              <td className="px-5 py-3.5" style={{ color: 'hsl(var(--text-secondary))' }}>
                {inv.date}
              </td>
              <td
                className="px-5 py-3.5 font-semibold tabular-nums"
                style={{ color: 'hsl(var(--text))' }}
              >
                {inv.amount}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className="chip"
                  style={{ color: 'hsl(var(--success))', borderColor: 'hsl(var(--success) / 0.35)', background: 'hsl(var(--success) / 0.08)' }}
                >
                  {inv.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  className="text-xs font-semibold transition-colors hover:underline"
                  style={{ color: 'hsl(var(--accent-light))' }}
                >
                  Download →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Billing & Usage"
        description="Monitor usage, manage your plan, and view invoices."
        actions={
          <Button variant="secondary" size="sm" className="gap-2">
            <Download size={14} />
            Download Invoices
          </Button>
        }
      />

      {/* Row 1: Plan card (2fr) + AI Cost card (1fr) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <PlanCard />
        <AiCostCard />
      </div>

      {/* Row 2: Invoices table */}
      <InvoicesTable />
    </div>
  );
}
