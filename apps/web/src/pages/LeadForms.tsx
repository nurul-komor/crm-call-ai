import { Code, Copy, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

interface LeadForm {
  id: string;
  name: string;
  submissions: number;
  status: 'Live' | 'Draft';
  fields: number;
  url: string;
}

const MOCK_FORMS: LeadForm[] = [
  {
    id: '1',
    name: 'Enterprise Demo Request',
    submissions: 284,
    status: 'Live',
    fields: 6,
    url: 'forms.calls.ai/acme/enterprise-demo',
  },
  {
    id: '2',
    name: 'Webinar Registration',
    submissions: 156,
    status: 'Live',
    fields: 4,
    url: 'forms.calls.ai/acme/webinar',
  },
  {
    id: '3',
    name: 'Product Feedback',
    submissions: 42,
    status: 'Draft',
    fields: 8,
    url: 'forms.calls.ai/acme/feedback',
  },
  {
    id: '4',
    name: 'Contact Sales',
    submissions: 0,
    status: 'Draft',
    fields: 5,
    url: 'forms.calls.ai/acme/contact-sales',
  },
];

function EmbedModal({ form, onClose }: { form: LeadForm; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const snippet = `<iframe\n  src="https://${form.url}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allow="clipboard-write"\n></iframe>`;

  function handleCopy() {
    void navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="dash-card w-full max-w-lg mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--text))]">Embed code</h2>
            <p className="text-sm text-[hsl(var(--text-secondary))] mt-0.5">{form.name}</p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--hover-overlay-strong))] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-sm text-[hsl(var(--text-secondary))]">
          Paste this snippet into any page to embed the form.
        </p>

        <div className="relative">
          <pre className="bg-[hsl(var(--bg))] border border-[hsl(var(--border))] rounded-lg p-4 text-xs font-mono text-[hsl(var(--text-secondary))] overflow-x-auto leading-relaxed">
            {snippet}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text))] hover:border-[hsl(var(--border-light))] transition-colors"
          >
            <Copy size={11} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: 'Live' | 'Draft' }) {
  if (status === 'Live') {
    return (
      <span
        className="chip"
        style={{ color: 'hsl(var(--success))', borderColor: 'hsl(var(--success) / 0.4)', backgroundColor: 'hsl(var(--success) / 0.08)' }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'hsl(var(--success))' }}
        />
        Live
      </span>
    );
  }
  return (
    <span
      className="chip"
      style={{ color: 'hsl(var(--warning))', borderColor: 'hsl(var(--warning) / 0.4)', backgroundColor: 'hsl(var(--warning) / 0.08)' }}
    >
      Draft
    </span>
  );
}

export function LeadFormsPage() {
  const [embedForm, setEmbedForm] = useState<LeadForm | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lead capture"
        title="Lead Forms"
        description="Build shareable forms that capture leads directly into your CRM."
        actions={
          <Button className="gap-2">
            <Plus size={14} />
            New Form
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_FORMS.map((form) => (
          <div key={form.id} className="dash-card p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-[hsl(var(--text))] leading-snug">{form.name}</h3>
              <StatusChip status={form.status} />
            </div>

            {/* Submissions count */}
            <div>
              <div className="text-4xl font-bold tabular-nums text-[hsl(var(--text))] leading-none">
                {form.submissions.toLocaleString()}
              </div>
              <div className="text-sm text-[hsl(var(--text-tertiary))] mt-1">submissions</div>
            </div>

            {/* Meta */}
            <div className="space-y-1.5">
              <div className="text-sm text-[hsl(var(--text-secondary))]">
                <span className="font-medium text-[hsl(var(--text))]">{form.fields}</span> fields
              </div>
              <div
                className="text-xs font-mono text-[hsl(var(--text-tertiary))] truncate"
                title={form.url}
              >
                {form.url}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-[hsl(var(--border))]">
              <Button variant="secondary" size="sm">
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setEmbedForm(form)}
              >
                <Code size={13} />
                Get embed code
              </Button>
            </div>
          </div>
        ))}
      </div>

      {embedForm && <EmbedModal form={embedForm} onClose={() => setEmbedForm(null)} />}
    </div>
  );
}
