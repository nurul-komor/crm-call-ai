import { useState } from 'react';
import { Settings, Zap, X, Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

interface Automation {
  name: string;
  trigger: string;
  action: string;
  status: 'Active' | 'Paused';
  runs: number;
  color: string;
}

const AUTOMATIONS: Automation[] = [
  {
    name: 'Qualified lead → WhatsApp follow-up',
    trigger: 'Lead qualified (A or A+)',
    action: 'Send WhatsApp message',
    status: 'Active',
    runs: 482,
    color: '#22C55E',
  },
  {
    name: 'Missed call → Retry in 24h',
    trigger: 'Call not answered',
    action: 'Schedule retry after 24h',
    status: 'Active',
    runs: 218,
    color: '#3B82F6',
  },
  {
    name: 'Appointment booked → Slack team',
    trigger: 'Appointment booked',
    action: 'Post to #sales channel',
    status: 'Active',
    runs: 64,
    color: '#3B82F6',
  },
  {
    name: 'Negative sentiment → Escalate',
    trigger: 'Sentiment < -0.5',
    action: 'Route to human agent',
    status: 'Active',
    runs: 12,
    color: '#EF4444',
  },
  {
    name: 'Churn risk → CSM outreach',
    trigger: 'Churn signal detected',
    action: 'Notify CSM + create task',
    status: 'Paused',
    runs: 38,
    color: '#F59E0B',
  },
];

export function AutomationsPage() {
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [newOpen, setNewOpen] = useState(false);

  function toggleStatus(index: number) {
    setAutomations((prev) =>
      prev.map((a, i) =>
        i === index
          ? { ...a, status: a.status === 'Active' ? 'Paused' : 'Active' }
          : a,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workflows"
        title="Automations"
        description="Trigger actions automatically based on conversation events."
        actions={
          <Button onClick={() => setNewOpen(true)} className="gap-2">
            <Zap size={14} />
            New Automation
          </Button>
        }
      />

      {/* Automation cards */}
      <div className="space-y-3">
        {automations.map((auto, i) => (
          <div key={i} className="dash-card p-5 flex items-center gap-5">
            {/* Icon box */}
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${auto.color}20` }}
            >
              <Zap
                size={18}
                strokeWidth={2}
                style={{ color: auto.color }}
                fill={auto.color}
                fillOpacity={0.25}
              />
            </div>

            {/* Center: name + chip + trigger→action */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-text truncate">{auto.name}</span>
                {/* Status chip */}
                <span
                  className="chip shrink-0"
                  style={
                    auto.status === 'Active'
                      ? {
                          color: 'hsl(var(--success))',
                          borderColor: 'hsl(var(--success) / 0.4)',
                          backgroundColor: 'hsl(var(--success) / 0.08)',
                        }
                      : {
                          color: 'hsl(var(--warning))',
                          borderColor: 'hsl(var(--warning) / 0.4)',
                          backgroundColor: 'hsl(var(--warning) / 0.08)',
                        }
                  }
                >
                  {auto.status === 'Active' && (
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: 'hsl(var(--success))' }}
                    />
                  )}
                  {auto.status}
                </span>
              </div>
              <p className="text-xs text-text-tertiary truncate">
                When{' '}
                <span className="text-text-secondary font-medium">{auto.trigger}</span>
                {' → '}
                <span className="text-text-secondary font-medium">{auto.action}</span>
              </p>
            </div>

            {/* Right: run count + settings */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-extrabold tabular-nums text-text leading-none">
                  {auto.runs.toLocaleString()}
                </div>
                <div className="text-xs text-text-tertiary mt-0.5">runs this week</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStatus(i)}
                  className="h-8 px-3 rounded-md text-xs font-semibold border transition-all duration-150"
                  style={
                    auto.status === 'Active'
                      ? {
                          color: 'hsl(var(--warning))',
                          borderColor: 'hsl(var(--warning) / 0.4)',
                          backgroundColor: 'hsl(var(--warning) / 0.07)',
                        }
                      : {
                          color: 'hsl(var(--success))',
                          borderColor: 'hsl(var(--success) / 0.4)',
                          backgroundColor: 'hsl(var(--success) / 0.07)',
                        }
                  }
                >
                  {auto.status === 'Active' ? 'Pause' : 'Activate'}
                </button>
                <button className="h-8 w-8 rounded-md flex items-center justify-center text-text-tertiary hover:text-text hover:bg-[hsl(var(--hover-overlay-strong))] transition-colors">
                  <Settings size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Automation Modal */}
      {newOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setNewOpen(false)}
        >
          <div
            className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl shadow-[var(--shadow-lift)] w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-accent-light" />
                <h2 className="text-base font-semibold text-text">New Automation</h2>
              </div>
              <button
                onClick={() => setNewOpen(false)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-text hover:bg-[hsl(var(--hover-overlay-strong))] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Qualified lead → Slack alert"
                  className="h-10 w-full px-3 rounded-lg bg-surface-2 border border-border text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-light transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Trigger event
                </label>
                <div className="relative">
                  <select className="h-10 w-full px-3 pr-8 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-light transition-colors appearance-none cursor-pointer">
                    <option value="">Select a trigger…</option>
                    <option>Lead qualified (A or A+)</option>
                    <option>Call not answered</option>
                    <option>Appointment booked</option>
                    <option>Sentiment &lt; threshold</option>
                    <option>Churn signal detected</option>
                    <option>Campaign completed</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                    <ChevronDownIcon size={13} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Action
                </label>
                <div className="relative">
                  <select className="h-10 w-full px-3 pr-8 rounded-lg bg-surface-2 border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-light transition-colors appearance-none cursor-pointer">
                    <option value="">Select an action…</option>
                    <option>Send WhatsApp message</option>
                    <option>Schedule retry call</option>
                    <option>Post to Slack channel</option>
                    <option>Route to human agent</option>
                    <option>Notify CSM + create task</option>
                    <option>Send email</option>
                    <option>Webhook POST</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                    <ChevronDownIcon size={13} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-surface-2 border border-border px-4 py-3">
                <p className="text-xs text-text-tertiary">
                  Automations run in real-time as calls complete. You can pause or edit them at any
                  time without disrupting active campaigns.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setNewOpen(false)} className="gap-2">
                <Plus size={13} />
                Create Automation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tiny inline icon component to avoid importing an extra icon just for select chevrons
function ChevronDownIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
