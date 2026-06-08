import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bot, Download, User } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { getJson } from '@/lib/api';

interface CallDetail {
  _id: string;
  status: string;
  callJobId: string;
  callSid?: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  recordingUrl?: string;
  transcript?: Array<{ role: string; text: string; at: string }>;
  summary?: string;
  sentiment?: string;
  extractedData?: Record<string, unknown>;
  leadScore?: number;
  leadQualification?: string;
}

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'success' | 'warning' | 'danger'> = {
  completed: 'success',
  in_progress: 'accent',
  failed: 'danger',
  no_answer: 'warning',
};

const QUAL_TONE: Record<string, 'accent' | 'warning' | 'danger'> = {
  cold: 'accent',
  warm: 'warning',
  hot: 'danger',
};

function fmtDuration(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function CallDetailPage() {
  const { id } = useParams();
  const call = useQuery({
    queryKey: ['call', id],
    queryFn: () => getJson<CallDetail>(`calls/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  });

  if (call.isLoading) {
    return <p className="text-text-tertiary">Loading…</p>;
  }
  if (!call.data) {
    return <p className="text-danger">Call not found</p>;
  }
  const c = call.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Call detail"
        description={<span className="font-mono text-sm text-text-tertiary">{c.callJobId}</span>}
        actions={
          <Link to="/calls">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={14} />
              Back to calls
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
              <Chip tone={STATUS_TONE[c.status] ?? 'neutral'} dot pulse={c.status === 'in_progress'}>
                {c.status}
              </Chip>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto p-0">
              {!c.transcript?.length ? (
                <p className="p-6 text-text-tertiary text-sm">No transcript yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {c.transcript.map((t, i) => {
                    const isAgent = t.role === 'agent';
                    return (
                      <li
                        key={i}
                        className={cn(
                          'flex gap-3 px-5 py-3.5',
                          isAgent ? 'flex-row' : 'flex-row-reverse text-right',
                        )}
                      >
                        <div
                          className={cn(
                            'h-7 w-7 rounded-md flex items-center justify-center shrink-0',
                            isAgent
                              ? 'bg-accent/15 text-accent-light'
                              : 'bg-success/15 text-success',
                          )}
                        >
                          {isAgent ? <Bot size={13} /> : <User size={13} />}
                        </div>
                        <div className={cn('flex-1', !isAgent && 'flex flex-col items-end')}>
                          <div className="text-2xs uppercase tracking-wider text-text-tertiary font-semibold">
                            {isAgent ? 'AI' : 'Customer'}
                          </div>
                          <p className="text-base text-text mt-0.5 max-w-prose">{t.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {c.summary ? (
                <p className="text-base text-text leading-relaxed">{c.summary}</p>
              ) : (
                <p className="text-sm text-text-tertiary">Pending post-call processing.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row k="Status" v={<Chip tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Chip>} />
              <Row k="Duration" v={fmtDuration(c.durationSec)} mono />
              <Row k="Sentiment" v={c.sentiment ?? '—'} />
              <Row
                k="Lead"
                v={
                  c.leadQualification ? (
                    <Chip tone={QUAL_TONE[c.leadQualification] ?? 'accent'}>
                      {c.leadQualification} · {c.leadScore}
                    </Chip>
                  ) : (
                    '—'
                  )
                }
              />
              {c.recordingUrl && (
                <Row
                  k="Recording"
                  v={
                    <a
                      href={c.recordingUrl}
                      className="inline-flex items-center gap-1.5 text-accent-light hover:text-accent text-sm font-semibold"
                    >
                      <Download size={12} /> Download
                    </a>
                  }
                />
              )}
            </CardContent>
          </Card>

          {c.extractedData && Object.keys(c.extractedData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(c.extractedData).map(([k, v]) => (
                  <Row
                    key={k}
                    k={k}
                    v={typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3 text-sm">
      <span className="text-text-tertiary uppercase tracking-wider text-2xs">{k}</span>
      <span
        className={cn('text-right font-medium text-text', mono && 'font-mono tabular-nums')}
      >
        {v}
      </span>
    </div>
  );
}
