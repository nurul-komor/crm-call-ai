import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { del, getJson, postJson } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  tags?: string[];
  status: string;
}

interface ListResponse {
  items: Customer[];
  nextCursor: string | null;
}

interface NewCustomerForm {
  name: string;
  phone?: string;
  email?: string;
}

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getJson<ListResponse>('customers', { search }),
  });

  const create = useMutation({
    mutationFn: (input: NewCustomerForm) => postJson<Customer>('customers', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  const form = useForm<NewCustomerForm>();
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);

  async function onImport(file: File) {
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const token = useAuthStore.getState().accessToken ?? '';
      const res = await fetch('/api/v1/customers/import', {
        method: 'POST',
        body: fd,
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Import failed: ${res.status}`);
      qc.invalidateQueries({ queryKey: ['customers'] });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
              }}
            />
            <Button variant="outline" disabled={importing}>
              {importing ? 'Importing…' : 'Import CSV'}
            </Button>
          </label>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New customer'}
          </Button>
        </div>
      </header>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add a customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
              onSubmit={form.handleSubmit(async (values) => {
                await create.mutateAsync(values);
                form.reset();
                setShowForm(false);
              })}
            >
              <Input placeholder="Name" {...form.register('name', { required: true })} />
              <Input placeholder="Phone (+1...)" {...form.register('phone')} />
              <Input placeholder="Email" type="email" {...form.register('email')} />
              <div className="md:col-span-3">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Saving…' : 'Save'}
                </Button>
                {create.error && (
                  <span className="ml-3 text-sm text-destructive">
                    {(create.error as Error).message}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex">
        <Input
          placeholder="Search customers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : !list.data || list.data.items.length === 0 ? (
            <p className="p-6 text-muted-foreground">
              No customers yet. Add one above or import a CSV.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((c) => (
                  <tr key={c._id} className="border-b last:border-b-0">
                    <td className="px-6 py-3 font-medium">{c.name}</td>
                    <td className="px-6 py-3">{c.phone ?? '—'}</td>
                    <td className="px-6 py-3">{c.email ?? '—'}</td>
                    <td className="px-6 py-3">{c.status}</td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove.mutate(c._id)}
                        disabled={remove.isPending}
                      >
                        Delete
                      </Button>
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

