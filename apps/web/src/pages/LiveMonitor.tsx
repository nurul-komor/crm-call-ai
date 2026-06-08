import { Activity, Bot, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Waveform } from '@/components/Waveform';
import { socket } from '@/lib/socket';
import { cn } from '@/lib/cn';

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

const STATUS_TONE: Record<string, 'success' | 'neutral' | 'danger' | 'warning'> = {
  in_progress: 'success',
  completed: 'neutral',
  failed: 'danger',
  no_answer: 'warning',
};

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
            {
              role: ev.role ?? 'agent',
              text: ev.text ?? '',
              at: ev.at ?? new Date().toISOString(),
            },
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

  const liveCount = sorted.filter((c) => c.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Live monitor"
        description="Real-time transcripts via Socket.IO. Events arrive as soon as the call worker emits them."
        actions={
          <Chip tone="success" dot pulse>
            {liveCount} {liveCount === 1 ? 'live call' : 'live calls'}
          </Chip>
        }
      />

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Activity}
              title="No active calls"
              description="Launch a campaign and live transcripts will stream into this view in real time."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {sorted.map((c) => (
            <Card key={c.callJobId}>
              <CardHeader>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent-light shrink-0">
                    <Phone size={14} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="font-mono text-sm truncate">{c.callJobId}</CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Chip
                        tone={STATUS_TONE[c.status] ?? 'neutral'}
                        dot
                        pulse={c.status === 'in_progress'}
                      >
                        {c.status}
                      </Chip>
                      <span className="text-2xs text-text-tertiary">
                        {c.turns.length} turn{c.turns.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>
                <Waveform
                  bars={20}
                  height={24}
                  active={c.status === 'in_progress'}
                  className={c.status === 'in_progress' ? 'text-success' : 'text-text-tertiary'}
                />
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {c.turns.map((t, i) => {
                    const isAgent = t.role === 'agent';
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex gap-2.5 px-5 py-2.5',
                          isAgent ? 'flex-row' : 'flex-row-reverse text-right',
                        )}
                      >
                        <div
                          className={cn(
                            'h-6 w-6 rounded-md flex items-center justify-center shrink-0',
                            isAgent
                              ? 'bg-accent/15 text-accent-light'
                              : 'bg-success/15 text-success',
                          )}
                        >
                          {isAgent ? <Bot size={12} /> : <User size={12} />}
                        </div>
                        <p className="text-base text-text-secondary flex-1">{t.text}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
