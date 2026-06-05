import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { socket } from '@/lib/socket';

interface CallEvent {
  type: 'call.started' | 'call.turn' | 'call.ended' | 'call.failed';
  callId?: string;
  callJobId: string;
  role?: 'agent' | 'customer';
  text?: string;
  status?: string;
  at?: string;
}

interface ActiveCall {
  callJobId: string;
  callId?: string;
  status: string;
  turns: Array<{ role: string; text: string; at: string }>;
}

export function LiveMonitorPage() {
  const [calls, setCalls] = useState<Record<string, ActiveCall>>({});

  useEffect(() => {
    const s = socket();
    function onTurn(ev: CallEvent) {
      setCalls((cur) => ({
        ...cur,
        [ev.callJobId]: {
          callJobId: ev.callJobId,
          callId: ev.callId,
          status: cur[ev.callJobId]?.status ?? 'in_progress',
          turns: [
            ...(cur[ev.callJobId]?.turns ?? []),
            { role: ev.role ?? 'agent', text: ev.text ?? '', at: ev.at ?? new Date().toISOString() },
          ],
        },
      }));
    }
    function onEnded(ev: CallEvent) {
      setCalls((cur) => {
        if (!cur[ev.callJobId]) return cur;
        return {
          ...cur,
          [ev.callJobId]: { ...cur[ev.callJobId]!, status: ev.status ?? 'completed' },
        };
      });
    }
    s.on('call.turn', onTurn);
    s.on('call.ended', onEnded);
    s.on('call.failed', onEnded);
    return () => {
      s.off('call.turn', onTurn);
      s.off('call.ended', onEnded);
      s.off('call.failed', onEnded);
    };
  }, []);

  const sorted = Object.values(calls).sort((a, b) =>
    (b.turns.at(-1)?.at ?? '').localeCompare(a.turns.at(-1)?.at ?? ''),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Live monitor</h1>
        <p className="text-sm text-muted-foreground">
          Real-time transcripts via Socket.IO. Events arrive as soon as the call worker emits them.
        </p>
      </header>
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No active calls. Launch a campaign and they'll show up here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map((c) => (
            <Card key={c.callJobId}>
              <CardHeader>
                <CardTitle className="text-base font-mono truncate">{c.callJobId}</CardTitle>
                <p className="text-xs text-muted-foreground">{c.status}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {c.turns.map((t, i) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
