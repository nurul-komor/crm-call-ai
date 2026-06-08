import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-6">
      <div className="space-y-1">
        {eyebrow && (
          <div className="text-2xs font-semibold uppercase tracking-[0.1em] text-accent-light">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tightest leading-tight text-text">
          {title}
        </h1>
        {description && (
          <p className="text-base text-text-secondary max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
