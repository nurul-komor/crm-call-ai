import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/Card';
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

const QUAL_TONE: Record<string, string> = {
  cold: 'bg-blue-100 text-blue-800',
  warm: 'bg-yellow-100 text-yellow-800',
  hot: 'bg-red-100 text-red-800',
};

export function CallsPage() {
  const list = useQuery({ queryKey: ['calls'], queryFn: () => getJson<CallsResponse>('calls') });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calls</h1>
      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : !list.data?.items.length ? (
            <p className="p-6 text-muted-foreground">No calls yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Started</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                  <th className="px-6 py-3 font-medium">Lead</th>
                  <th className="px-6 py-3 font-medium">Summary</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((c) => (
                  <tr key={c._id} className="border-b last:border-b-0">
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">{c.status}</td>
                    <td className="px-6 py-3">
                      {c.durationSec ? `${c.durationSec}s` : '—'}
                    </td>
                    <td className="px-6 py-3">
                      {c.leadQualification ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${QUAL_TONE[c.leadQualification]}`}
                        >
                          {c.leadQualification} · {c.leadScore}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground line-clamp-2 max-w-md">
                      {c.summary ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        to={`/calls/${c._id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        Details →
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
