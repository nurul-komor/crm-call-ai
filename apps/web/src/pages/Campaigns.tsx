import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getJson, postJson } from '@/lib/api';

interface Campaign {
  _id: string;
  name: string;
  type: string;
  status: string;
  stats?: { totalCustomers?: number; completedCalls?: number; qualifiedLeads?: number };
}

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800',
  running: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-muted text-muted-foreground',
  failed: 'bg-red-100 text-red-800',
};

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

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Link to="/campaigns/new">
          <Button>New campaign</Button>
        </Link>
      </header>
      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : !list.data || list.data.length === 0 ? (
            <p className="p-6 text-muted-foreground">
              No campaigns yet. Create one to start dispatching AI calls.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Stats</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((c) => (
                  <tr key={c._id} className="border-b last:border-b-0">
                    <td className="px-6 py-3 font-medium">{c.name}</td>
                    <td className="px-6 py-3">{c.type}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_TONE[c.status] ?? 'bg-muted'}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {c.stats?.completedCalls ?? 0} / {c.stats?.totalCustomers ?? 0} calls ·{' '}
                      {c.stats?.qualifiedLeads ?? 0} qualified
                    </td>
                    <td className="px-6 py-3 text-right space-x-1">
                      {c.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => launch.mutate(c._id)}
                          disabled={launch.isPending}
                        >
                          Launch
                        </Button>
                      )}
                      {(c.status === 'scheduled' || c.status === 'running') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pause.mutate(c._id)}
                          disabled={pause.isPending}
                        >
                          Pause
                        </Button>
                      )}
                      {c.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resume.mutate(c._id)}
                          disabled={resume.isPending}
                        >
                          Resume
                        </Button>
                      )}
                      <Link to={`/campaigns/${c._id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
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
