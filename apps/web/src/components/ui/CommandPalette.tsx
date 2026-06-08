import {
  Activity,
  BarChart3,
  Cpu,
  CreditCard,
  Headphones,
  Megaphone,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Upload,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Item = { name: string; Icon: LucideIcon; to?: string; kbd?: string; onAction?: () => void };
type Group = { label: string; items: Item[] };

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const groups: Group[] = [
    {
      label: 'Jump to',
      items: [
        { name: 'Customers', Icon: Users, to: '/customers', kbd: 'G U' },
        { name: 'Campaigns', Icon: Megaphone, to: '/campaigns', kbd: 'G C' },
        { name: 'Live monitor', Icon: Activity, to: '/monitor', kbd: 'G V' },
        { name: 'Calls', Icon: Headphones, to: '/calls' },
        { name: 'Settings', Icon: SettingsIcon, to: '/settings' },
        { name: 'Voice profiles', Icon: Sparkles, to: '/settings#voice' },
        { name: 'AI providers', Icon: Cpu, to: '/settings#providers' },
        { name: 'Billing', Icon: CreditCard, to: '/settings#billing' },
        { name: 'Analytics', Icon: BarChart3, to: '/calls' },
      ],
    },
    {
      label: 'Actions',
      items: [
        { name: 'Create new campaign', Icon: Sparkles, to: '/campaigns/new', kbd: '⌘ N' },
        { name: 'Import customers from CSV', Icon: Upload, to: '/customers' },
        { name: 'Add AI provider', Icon: Cpu, to: '/settings#providers' },
        { name: 'Create automation rule', Icon: Zap, to: '/settings' },
      ],
    },
  ];
  const q = query.toLowerCase();
  const filtered = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !q || i.name.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);

  function go(item: Item) {
    if (item.to) navigate(item.to);
    item.onAction?.();
    onClose();
  }

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search size={18} className="text-text-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns, customers, settings…"
            className="flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-tertiary"
          />
          <span className="kbd">ESC</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-text-tertiary">
              No results for "{query}"
            </div>
          ) : (
            filtered.map((g) => (
              <div key={g.label}>
                <div className="px-3 pb-1 pt-2.5 text-2xs font-bold uppercase tracking-widest text-text-tertiary">
                  {g.label}
                </div>
                {g.items.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => go(item)}
                    className="row-hover flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-base"
                  >
                    <item.Icon size={15} className="text-text-tertiary" />
                    <span className="flex-1">{item.name}</span>
                    {item.kbd && <span className="kbd">{item.kbd}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-4 border-t border-border px-4 py-2.5 text-2xs text-text-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <span className="kbd">↑↓</span> navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="kbd">↵</span> select
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="kbd">ESC</span> close
          </span>
        </div>
      </div>
    </div>
  );
}
