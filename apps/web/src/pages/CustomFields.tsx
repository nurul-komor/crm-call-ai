import { Check, ChevronDown, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

type FieldType =
  | 'Text'
  | 'Number'
  | 'Email'
  | 'URL'
  | 'Date'
  | 'Dropdown'
  | 'Multi-select'
  | 'Long text';

interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  token: string;
  coverage: number; // 0–100
}

const MOCK_FIELDS: CustomField[] = [
  { id: '1', name: 'Industry', type: 'Dropdown', required: true, token: '{{lead.industry}}', coverage: 78 },
  { id: '2', name: 'Annual Revenue', type: 'Number', required: false, token: '{{lead.annual_revenue}}', coverage: 42 },
  { id: '3', name: 'Team Size', type: 'Number', required: false, token: '{{lead.team_size}}', coverage: 61 },
  { id: '4', name: 'Timezone', type: 'Text', required: false, token: '{{lead.timezone}}', coverage: 89 },
  { id: '5', name: 'Internal Notes', type: 'Long text', required: false, token: '{{lead.internal_notes}}', coverage: 23 },
];

const FIELD_TYPES: FieldType[] = [
  'Text',
  'Number',
  'Email',
  'URL',
  'Date',
  'Dropdown',
  'Multi-select',
  'Long text',
];

function typeChipStyle(type: FieldType): React.CSSProperties {
  switch (type) {
    case 'Dropdown':
      return {
        color: 'hsl(var(--accent-light))',
        borderColor: 'hsl(var(--accent-light) / 0.4)',
        backgroundColor: 'hsl(var(--accent-light) / 0.08)',
      };
    case 'Number':
      return {
        color: 'hsl(var(--success))',
        borderColor: 'hsl(var(--success) / 0.4)',
        backgroundColor: 'hsl(var(--success) / 0.08)',
      };
    default:
      return {
        color: 'hsl(var(--text-secondary))',
        borderColor: 'hsl(var(--border-light))',
        backgroundColor: 'hsl(var(--surface-2))',
      };
  }
}

function CoverageBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm tabular-nums text-[hsl(var(--text-secondary))] w-9 text-right">
        {value}%
      </span>
      <div
        className="rounded-full bg-[hsl(var(--border))]"
        style={{ width: 60, height: 3, flexShrink: 0 }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundColor:
              value >= 70
                ? 'hsl(var(--success))'
                : value >= 40
                  ? 'hsl(var(--accent-light))'
                  : 'hsl(var(--warning))',
          }}
        />
      </div>
    </div>
  );
}

interface AddFieldFormProps {
  onSave: (field: Omit<CustomField, 'id' | 'token' | 'coverage'>) => void;
  onCancel: () => void;
}

function AddFieldForm({ onSave, onCancel }: AddFieldFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('Text');
  const [required, setRequired] = useState(false);

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), type, required });
  }

  return (
    <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2)/0.5)] px-5 py-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Field name */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-2xs font-semibold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">
            Field name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Company Size"
            className="h-9 px-3 rounded-md bg-[hsl(var(--bg))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--text))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:border-[hsl(var(--accent-light))] transition-colors"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>

        {/* Type selector */}
        <div className="flex flex-col gap-1">
          <label className="text-2xs font-semibold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">
            Type
          </label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
              className="h-9 pl-3 pr-8 rounded-md bg-[hsl(var(--bg))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--text))] focus:outline-none focus:border-[hsl(var(--accent-light))] appearance-none cursor-pointer transition-colors"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))]"
            />
          </div>
        </div>

        {/* Required toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-2xs font-semibold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">
            Required
          </label>
          <button
            type="button"
            onClick={() => setRequired((v) => !v)}
            className={[
              'h-9 w-14 flex items-center justify-center rounded-md border text-xs font-semibold transition-colors',
              required
                ? 'bg-[hsl(var(--success)/0.12)] border-[hsl(var(--success)/0.4)] text-[hsl(var(--success))]'
                : 'bg-[hsl(var(--bg))] border-[hsl(var(--border))] text-[hsl(var(--text-tertiary))] hover:border-[hsl(var(--border-light))]',
            ].join(' ')}
          >
            {required ? 'Yes' : 'No'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pb-0.5">
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>(MOCK_FIELDS);
  const [showAddForm, setShowAddForm] = useState(false);

  function handleAddField(data: Omit<CustomField, 'id' | 'token' | 'coverage'>) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '_');
    const newField: CustomField = {
      id: String(Date.now()),
      name: data.name,
      type: data.type,
      required: data.required,
      token: `{{lead.${slug}}}`,
      coverage: 0,
    };
    setFields((prev) => [...prev, newField]);
    setShowAddForm(false);
  }

  function handleDelete(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lead capture"
        title="Custom Fields"
        description="Define extra fields on leads beyond name, phone, and email."
        actions={
          <Button
            className="gap-2"
            onClick={() => setShowAddForm((v) => !v)}
          >
            <Plus size={14} />
            Add Field
          </Button>
        }
      />

      <div className="dash-card" style={{ padding: 0 }}>
        {/* Add field inline form */}
        {showAddForm && (
          <AddFieldForm
            onSave={handleAddField}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="text-2xs uppercase tracking-wider text-[hsl(var(--text-tertiary))] border-b border-[hsl(var(--border))]">
              <th className="text-left font-semibold px-5 py-3">Field Name</th>
              <th className="text-left font-semibold px-4 py-3">Type</th>
              <th className="text-left font-semibold px-4 py-3">Required</th>
              <th className="text-left font-semibold px-4 py-3">Template Token</th>
              <th className="text-left font-semibold px-4 py-3">Coverage</th>
              <th className="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr
                key={field.id}
                className={[
                  'row-hover',
                  i < fields.length - 1 ? 'border-b border-[hsl(var(--border))]' : '',
                ].join(' ')}
              >
                {/* Field Name */}
                <td className="px-5 py-3.5 font-semibold text-[hsl(var(--text))] text-sm">
                  {field.name}
                </td>

                {/* Type */}
                <td className="px-4 py-3.5">
                  <span className="chip" style={typeChipStyle(field.type)}>
                    {field.type}
                  </span>
                </td>

                {/* Required */}
                <td className="px-4 py-3.5">
                  {field.required ? (
                    <Check size={15} className="text-[hsl(var(--success))]" />
                  ) : (
                    <Minus size={15} className="text-[hsl(var(--text-tertiary))]" />
                  )}
                </td>

                {/* Template Token */}
                <td className="px-4 py-3.5">
                  <code
                    className="font-mono text-xs text-[hsl(var(--text-secondary))] bg-[hsl(var(--bg))] border border-[hsl(var(--border))] rounded px-2 py-0.5"
                  >
                    {field.token}
                  </code>
                </td>

                {/* Coverage */}
                <td className="px-4 py-3.5">
                  <CoverageBar value={field.coverage} />
                </td>

                {/* Actions */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-md text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--hover-overlay-strong))] transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.08)] transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {fields.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[hsl(var(--text-tertiary))]">
                  No custom fields yet.{' '}
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-[hsl(var(--accent-light))] hover:underline"
                  >
                    Add your first field
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
