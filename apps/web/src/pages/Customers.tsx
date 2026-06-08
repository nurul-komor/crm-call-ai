import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { del, getJson, postJson } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import { cn } from '@/lib/cn';

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

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'success' | 'warning' | 'danger'> = {
  active: 'success',
  qualified: 'success',
  contacted: 'accent',
  pending: 'warning',
  failed: 'danger',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
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

  const items = list.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Customers"
        description="Your contact universe — import, segment, and dispatch outbound conversations."
        actions={
          <>
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
              <span
                role="button"
                tabIndex={0}
                className={cn(
                  'inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-transparent text-base font-semibold text-text hover:bg-[hsl(var(--hover-overlay-strong))] hover:border-border-light transition-colors',
                  importing && 'opacity-50 pointer-events-none',
                )}
              >
                <Upload size={14} />
                {importing ? 'Importing…' : 'Import CSV'}
              </span>
            </label>
            <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
              <Plus size={14} />
              {showForm ? 'Cancel' : 'New customer'}
            </Button>
          </>
        }
      />

      {showForm && (
        <Card>
          <CardContent>
            <form
              className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
              onSubmit={form.handleSubmit(async (values) => {
                await create.mutateAsync(values);
                form.reset();
                setShowForm(false);
              })}
            >
              <Field label="Name">
                <Input placeholder="Jane Smith" {...form.register('name', { required: true })} />
              </Field>
              <Field label="Phone">
                <Input placeholder="+1 415 555 0100" {...form.register('phone')} />
              </Field>
              <Field label="Email">
                <Input placeholder="jane@acme.co" type="email" {...form.register('email')} />
              </Field>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Saving…' : 'Save customer'}
                </Button>
                {create.error && (
                  <span className="text-xs text-danger">{(create.error as Error).message}</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <Input
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-text-tertiary">
          {items.length} {items.length === 1 ? 'customer' : 'customers'}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <p className="p-10 text-center text-text-tertiary">Loading…</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add a contact manually or import a CSV to get started."
              action={
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus size={14} /> New customer
                </Button>
              }
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-2xs uppercase tracking-wider text-text-tertiary border-b border-border">
                  <th className="text-left font-semibold px-5 py-3 w-12"></th>
                  <th className="text-left font-semibold px-2 py-3">Name</th>
                  <th className="text-left font-semibold px-2 py-3">Phone</th>
                  <th className="text-left font-semibold px-2 py-3">Email</th>
                  <th className="text-left font-semibold px-2 py-3">Status</th>
                  <th className="px-5 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c._id}
                    className="row-hover border-b border-border last:border-b-0"
                  >
                    <td className="px-5 py-3.5">
                      <div className="h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-xs font-semibold text-text-secondary">
                        {initials(c.name)}
                      </div>
                    </td>
                    <td className="px-2 py-3.5 font-semibold text-text">{c.name}</td>
                    <td className="px-2 py-3.5 text-text-secondary font-mono text-sm">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={11} className="text-text-tertiary" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3.5 text-text-secondary text-sm">
                      {c.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={11} className="text-text-tertiary" />
                          {c.email}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3.5">
                      <Chip tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Chip>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(c._id)}
                        disabled={remove.isPending}
                        title="Delete"
                        className="hover:text-danger"
                      >
                        <Trash2 size={14} />
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
