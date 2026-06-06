import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Edit3,
  Megaphone,
  Pause,
  Play,
  Plus,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sparkline } from '@/components/Sparkline';
import { getJson, postJson } from '@/lib/api';

interface Campaign {
  _id: string;
  name: string;
  type: string;
  status: string;
  stats?: { totalCustomers?: number; completedCalls?: number; qualifiedLeads?: number };
}

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  scheduled: 'accent',
  running: 'success',
  paused: 'warning',
  completed: 'neutral',
  failed: 'danger',
};

const STATS = [
  {
    label: 'Active campaigns',
    icon: Megaphone,
    color: 'text-accent-light',
    sparkSeed: [3, 4, 6, 5, 7, 6, 8],
  },
  {
    label: 'Reached',
    icon: Users,
    color: 'text-success',
    sparkSeed: [120, 150, 180, 230, 290, 310, 380],
  },
  {
    label: 'Avg conversion',
    icon: TrendingUp,
    color: 'text-warning',
    sparkSeed: [0.12, 0.14, 0.18, 0.21, 0.24, 0.26, 0.28],
  },
  {
    label: 'Pipeline',
    icon: Zap,
    color: 'text-accent',
    sparkSeed: [4, 6, 7, 9, 11, 14, 18],
  },
];

function progressFor(c: Campaign): number {
  const total = c.stats?.totalCustomers ?? 0;
  const done = c.stats?.completedCalls ?? 0;
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export function CampaignsPage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => getJson<Campaign[]>('campaigns'),
  });

  const launch = useMutation({
    mutationFn: (id: string) => postJson(`campaigns/${id}/launch`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
  const pause = useMutation({
    mutationFn: (id: string) => postJson(`campaigns/${id}/pause`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
  const resume = useMutation({
    mutationFn: (id: string) => postJson(`campaigns/${id}/resume`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const data = list.data ?? [];
  const activeCount = data.filter((c) => c.status === 'running' || c.status === 'scheduled').length;
  const totalReached = data.reduce((sum, c) => sum + (c.stats?.completedCalls ?? 0), 0);
  const totalQualified = data.reduce((sum, c) => sum + (c.stats?.qualifiedLeads ?? 0), 0);
  const conv = totalReached ? (totalQualified / totalReached) * 100 : 0;
  const values = [
    activeCount.toString(),
    totalReached.toLocaleString(),
    `${conv.toFixed(1)}%`,
    `${totalQualified}`,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Outbound conversation programs. Launch, pause, and monitor lifetime performance."
        actions={
          <Link to="/campaigns/new">
            <Button className="gap-2">
              <Plus size={14} />
              New campaign
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center ${s.color}`}
                >
                  <s.icon size={14} strokeWidth={1.75} />
                </div>
                <Sparkline points={s.sparkSeed} className={s.color} />
              </div>
              <div className="text-3xl font-extrabold tabular-nums">{values[i]}</div>
              <div className="text-xs text-text-tertiary mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {list.isLoading ? (
        <Card>
          <CardContent className="p-10 text-center text-text-tertiary">Loading…</CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              description="Create a campaign to start dispatching AI calls to your customer lists."
              action={
                <Link to="/campaigns/new">
                  <Button className="gap-2">
                    <Plus size={14} />
                    New campaign
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((c) => {
            const total = c.stats?.totalCustomers ?? 0;
            const done = c.stats?.completedCalls ?? 0;
            const qualified = c.stats?.qualifiedLeads ?? 0;
            const pct = progressFor(c);
            return (
              <Card key={c._id} className="row-hover">
                <CardContent className="p-5">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Chip
                          tone={STATUS_TONE[c.status] ?? 'neutral'}
                          dot
                          pulse={c.status === 'running'}
                        >
                          {c.status}
                        </Chip>
                        <span className="text-xs text-text-tertiary uppercase tracking-wider">
                          {c.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-text truncate">{c.name}</h3>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <div className="text-2xs uppercase tracking-wider text-text-tertiary">
                        Reached
                      </div>
                      <div className="font-semibold text-text tabular-nums">
                        {done.toLocaleString()}{' '}
                        <span className="text-text-tertiary font-normal">/ {total}</span>
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <div className="text-2xs uppercase tracking-wider text-text-tertiary">
                        Qualified
                      </div>
                      <div className="font-semibold text-success tabular-nums inline-flex items-center gap-1.5">
                        <CheckCircle2 size={12} />
                        {qualified.toLocaleString()}
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-2">
                      <div className="text-2xs uppercase tracking-wider text-text-tertiary mb-1.5">
                        Progress
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-text-tertiary mt-1 tabular-nums">{pct}%</div>
                    </div>

                    <div className="col-span-12 md:col-span-2 flex justify-end gap-1">
                      {c.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => launch.mutate(c._id)}
                          disabled={launch.isPending}
                          className="gap-1.5"
                        >
                          <Play size={12} />
                          Launch
                        </Button>
                      )}
                      {(c.status === 'scheduled' || c.status === 'running') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pause.mutate(c._id)}
                          disabled={pause.isPending}
                          className="gap-1.5"
                        >
                          <Pause size={12} />
                          Pause
                        </Button>
                      )}
                      {c.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resume.mutate(c._id)}
                          disabled={resume.isPending}
                          className="gap-1.5"
                        >
                          <Play size={12} />
                          Resume
                        </Button>
                      )}
                      <Link to={`/campaigns/${c._id}/edit`}>
                        <Button variant="ghost" size="icon" title="Edit">
                          <Edit3 size={14} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
