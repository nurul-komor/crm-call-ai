import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { getJson } from '@/lib/api';

interface Call {
  _id: string;
  status: string;
  callJobId: string;
  durationSec?: number;
  summary?: string;
  leadScore?: number;
  leadQualification?: 'cold' | 'warm' | 'hot';
  createdAt: string;
}

interface CallsResponse {
  items: Call[];
  nextCursor: string | null;
}

const QUAL_TONE: Record<string, 'accent' | 'warning' | 'danger'> = {
  cold: 'accent',
  warm: 'warning',
  hot: 'danger',
};

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  in_progress: 'accent',
  failed: 'danger',
  no_answer: 'warning',
  busy: 'warning',
  queued: 'neutral',
};

function fmtDuration(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function CallsPage() {
  const list = useQuery({ queryKey: ['calls'], queryFn: () => getJson<CallsResponse>('calls') });
  const items = list.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Calls"
        description="Every outbound conversation, with summary, lead score and transcript."
      />

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <p className="p-10 text-center text-text-tertiary">Loading…</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Headphones}
              title="No calls yet"
              description="As soon as a campaign dispatches its first call, it'll appear here."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-2xs uppercase tracking-wider text-text-tertiary border-b border-border">
                  <th className="text-left font-semibold px-5 py-3">Started</th>
                  <th className="text-left font-semibold px-2 py-3">Status</th>
                  <th className="text-left font-semibold px-2 py-3">Duration</th>
                  <th className="text-left font-semibold px-2 py-3">Lead</th>
                  <th className="text-left font-semibold px-2 py-3">Summary</th>
                  <th className="px-5 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c._id}
                    className="row-hover border-b border-border last:border-b-0"
                  >
                    <td className="px-5 py-4 text-text-secondary text-sm whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-4">
                      <Chip tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Chip>
                    </td>
                    <td className="px-2 py-4 font-mono text-sm tabular-nums">
                      {fmtDuration(c.durationSec)}
                    </td>
                    <td className="px-2 py-4">
                      {c.leadQualification ? (
                        <Chip tone={QUAL_TONE[c.leadQualification]}>
                          {c.leadQualification} · {c.leadScore}
                        </Chip>
                      ) : (
                        <span className="text-text-tertiary text-sm">—</span>
                      )}
                    </td>
                    <td className="px-2 py-4 text-text-secondary text-sm line-clamp-2 max-w-xl">
                      {c.summary ?? <span className="text-text-tertiary">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/calls/${c._id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-accent-light hover:text-accent"
                      >
                        Details
                        <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
