import { useState } from 'react';
import {
  FileText,
  Globe,
  HelpCircle,
  Settings,
  Search,
  Upload,
  Link2,
  ShieldCheck,
  ChevronDown,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

interface DocSource {
  name: string;
  type: 'PDF' | 'DOCX' | 'FAQ' | 'Website' | 'Markdown';
  size: string;
  date: string;
  chunks: number;
}

const DOCS: DocSource[] = [
  { name: 'Product Overview 2025.pdf', type: 'PDF', size: '2.4 MB', date: '2 days ago', chunks: 142 },
  { name: 'Pricing & Plans', type: 'FAQ', size: '24 items', date: '1 week ago', chunks: 48 },
  { name: 'Security & Compliance.docx', type: 'DOCX', size: '1.1 MB', date: '2 weeks ago', chunks: 86 },
  { name: 'voiceflow.ai (crawled)', type: 'Website', size: '342 pages', date: '1 hr ago', chunks: 1820 },
  { name: 'API Reference', type: 'Markdown', size: '184 KB', date: '3 days ago', chunks: 412 },
  { name: 'Customer Case Studies.pdf', type: 'PDF', size: '4.8 MB', date: '5 days ago', chunks: 96 },
];

const TYPE_COLOR: Record<DocSource['type'], string> = {
  PDF: '#EF4444',
  DOCX: '#3B82F6',
  FAQ: '#F59E0B',
  Website: '#22C55E',
  Markdown: '#3B82F6',
};

const TYPE_ABBR: Record<DocSource['type'], string> = {
  PDF: 'PDF',
  DOCX: 'DOC',
  FAQ: 'FAQ',
  Website: 'WEB',
  Markdown: 'MD',
};

const TYPE_ICON: Record<DocSource['type'], typeof FileText> = {
  PDF: FileText,
  DOCX: FileText,
  FAQ: HelpCircle,
  Website: Globe,
  Markdown: FileText,
};

type CrawlDepth = 'single' | 'section' | 'entire';

const CRAWL_DEPTHS: { key: CrawlDepth; label: string }[] = [
  { key: 'single', label: 'Single page' },
  { key: 'section', label: 'This section' },
  { key: 'entire', label: 'Entire site' },
];

export function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [crawlOpen, setCrawlOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlDepth, setCrawlDepth] = useState<CrawlDepth>('section');
  const [dragOver, setDragOver] = useState(false);

  const filtered = DOCS.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Knowledge"
        title="Knowledge Base"
        description="Documents, FAQs, and crawled sites your AI agents can reference."
        actions={
          <>
            <Button variant="secondary" onClick={() => setCrawlOpen(true)} className="gap-2">
              <Globe size={14} />
              Crawl Site
            </Button>
            <Button onClick={() => setUploadOpen(true)} className="gap-2">
              <Upload size={14} />
              Upload Document
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Documents', value: '86' },
          { label: 'Total Chunks', value: '12,488' },
          { label: 'Avg. Retrieval', value: '128ms' },
          { label: 'Storage', value: '486 MB' },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card py-4 px-5">
            <div className="text-3xl font-extrabold tabular-nums text-text">{kpi.value}</div>
            <div className="text-xs text-text-tertiary mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Doc table */}
      <div className="dash-card overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">Knowledge Sources</h2>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-md bg-surface-2 border border-border text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-light transition-colors w-52"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-2xs uppercase tracking-wider text-text-tertiary border-b border-border">
              <th className="text-left font-semibold px-5 py-3 w-14">Type</th>
              <th className="text-left font-semibold px-3 py-3">Name</th>
              <th className="text-left font-semibold px-3 py-3 hidden md:table-cell">Size</th>
              <th className="text-left font-semibold px-3 py-3 hidden sm:table-cell">Chunks</th>
              <th className="text-left font-semibold px-3 py-3 hidden lg:table-cell">Added</th>
              <th className="px-5 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => {
              const color = TYPE_COLOR[doc.type];
              const abbr = TYPE_ABBR[doc.type];
              const Icon = TYPE_ICON[doc.type];
              return (
                <tr
                  key={i}
                  className="row-hover border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-3.5">
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}26` }}
                    >
                      <span
                        className="text-[9px] font-[800] tracking-tight leading-none"
                        style={{ color }}
                      >
                        {abbr}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon size={14} className="text-text-tertiary shrink-0" />
                      <span className="text-sm font-medium text-text truncate">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell text-sm text-text-secondary tabular-nums">
                    {doc.size}
                  </td>
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <span className="chip text-text-secondary border-border">
                      {doc.chunks.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell text-sm text-text-tertiary whitespace-nowrap">
                    {doc.date}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="h-7 w-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-text hover:bg-[hsl(var(--hover-overlay-strong))] transition-colors ml-auto">
                      <Settings size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-text-tertiary">
                  No documents match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Crawl Site Modal */}
      {crawlOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCrawlOpen(false)}
        >
          <div
            className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl shadow-[var(--shadow-lift)] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-accent-light" />
                <h2 className="text-base font-semibold text-text">Crawl Site</h2>
              </div>
              <button
                onClick={() => setCrawlOpen(false)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-text hover:bg-[hsl(var(--hover-overlay-strong))] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">
              {/* URL input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  URL
                </label>
                <div className="relative">
                  <Link2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                  />
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    className="h-10 w-full pl-9 pr-3 rounded-lg bg-surface-2 border border-border text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-border-light transition-colors"
                  />
                </div>
              </div>

              {/* Depth selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Depth
                </label>
                <div className="flex gap-2">
                  {CRAWL_DEPTHS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setCrawlDepth(d.key)}
                      className="flex-1 h-9 px-3 rounded-full text-xs font-semibold border transition-all duration-150"
                      style={
                        crawlDepth === d.key
                          ? {
                              backgroundColor: 'hsl(var(--accent) / 0.15)',
                              borderColor: 'hsl(var(--accent))',
                              color: 'hsl(var(--accent-light))',
                            }
                          : {
                              backgroundColor: 'transparent',
                              borderColor: 'hsl(var(--border))',
                              color: 'hsl(var(--text-secondary))',
                            }
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* robots.txt notice */}
              <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 border border-border px-4 py-3">
                <ShieldCheck size={14} className="text-success shrink-0" />
                <span className="text-xs text-text-secondary">
                  We respect <code className="font-mono text-text-tertiary">robots.txt</code> and
                  crawl at a polite rate to avoid overloading servers.
                </span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setCrawlOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!crawlUrl.trim()}
                onClick={() => setCrawlOpen(false)}
                className="gap-2"
              >
                <Globe size={13} />
                Start crawl
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {uploadOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setUploadOpen(false)}
        >
          <div
            className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-2xl shadow-[var(--shadow-lift)] w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Upload size={16} className="text-accent-light" />
                <h2 className="text-base font-semibold text-text">Upload Document</h2>
              </div>
              <button
                onClick={() => setUploadOpen(false)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-text-tertiary hover:text-text hover:bg-[hsl(var(--hover-overlay-strong))] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 transition-colors cursor-pointer"
                style={{
                  borderColor: dragOver
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--border-light))',
                  backgroundColor: dragOver
                    ? 'hsl(var(--accent) / 0.05)'
                    : 'hsl(var(--surface-2))',
                }}
              >
                <div className="h-12 w-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                  <Upload size={20} className="text-text-tertiary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-text">
                    Drop files here or{' '}
                    <span className="text-accent-light cursor-pointer hover:underline">browse</span>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    PDF, DOCX, TXT, MD — up to 50 MB per file
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-text-tertiary text-center">
                Files are automatically chunked, embedded, and indexed. Processing typically takes
                under 60 seconds.
              </p>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="ghost" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setUploadOpen(false)} className="gap-2">
                <Upload size={13} />
                Upload
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
