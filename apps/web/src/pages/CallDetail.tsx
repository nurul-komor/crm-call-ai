import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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

export function CallDetailPage() {
  const { id } = useParams();
  const call = useQuery({
    queryKey: ['call', id],
    queryFn: () => getJson<CallDetail>(`calls/${id}`),
    enabled: !!id,
    refetchInterval: 5000,
  });

  if (call.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!call.data) return <p className="text-destructive">Call not found</p>;
  const c = call.data;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call detail</h1>
          <p className="font-mono text-sm text-muted-foreground">{c.callJobId}</p>
        </div>
        <Link to="/calls">
          <Button variant="outline">← Back</Button>
        </Link>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {!c.transcript?.length ? (
                <p className="text-muted-foreground">No transcript yet.</p>
              ) : (
                c.transcript.map((t, i) => (
                  <div key={i} className="text-sm">
                    <span
                      className={
                        t.role === 'agent'
                          ? 'text-blue-700 font-medium'
                          : 'text-green-700 font-medium'
                      }
                    >
                      {t.role}:
                    </span>{' '}
                    {t.text}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {c.summary ? (
                <p className="text-sm">{c.summary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Pending post-call processing.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row k="Status" v={c.status} />
              <Row k="Duration" v={c.durationSec ? `${c.durationSec}s` : '—'} />
              <Row k="Sentiment" v={c.sentiment ?? '—'} />
              <Row
                k="Lead"
                v={
                  c.leadQualification ? `${c.leadQualification} · ${c.leadScore}` : '—'
                }
              />
              {c.recordingUrl && (
                <Row k="Recording" v={<a href={c.recordingUrl}>Play</a>} />
              )}
            </CardContent>
          </Card>
          {c.extractedData && Object.keys(c.extractedData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extracted data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(c.extractedData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
