import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import { cn } from '@/lib/cn';

export type DropdownItem =
  | { divider: true }
  | { label: string; divider?: false; name?: never }
  | {
      name: string;
      icon?: ReactNode;
      meta?: ReactNode;
      kbd?: string;
      danger?: boolean;
      checked?: boolean;
      onClick?: () => void;
    };

export function Dropdown({
  trigger,
  items,
  align = 'left',
  width = 220,
  className,
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div
        onClick={(e: ReactMouseEvent) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          className="absolute z-50 mt-1.5 rounded-xl border border-border-light bg-surface p-1.5 shadow-lift"
          style={{
            width,
            [align]: 0,
          }}
        >
          {items.map((it, i) => {
            if ('divider' in it && it.divider) {
              return <div key={i} className="my-1 border-t border-border" />;
            }
            if ('label' in it && it.label) {
              return (
                <div
                  key={i}
                  className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-text-tertiary"
                >
                  {it.label}
                </div>
              );
            }
            const item = it as Exclude<
              DropdownItem,
              { divider: true } | { label: string }
            >;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  'row-hover flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-base font-medium',
                  item.danger
                    ? 'text-danger hover:text-danger'
                    : 'text-text hover:text-text',
                )}
              >
                {item.icon && (
                  <span
                    className={cn(
                      'shrink-0',
                      item.danger ? 'text-danger' : 'text-text-tertiary',
                    )}
                  >
                    {item.icon}
                  </span>
                )}
                <span className="flex-1 truncate">{item.name}</span>
                {item.meta && (
                  <span className="text-2xs text-text-tertiary">{item.meta}</span>
                )}
                {item.checked && (
                  <span className="text-accent-light" aria-hidden>
                    ✓
                  </span>
                )}
                {item.kbd && <span className="kbd">{item.kbd}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
