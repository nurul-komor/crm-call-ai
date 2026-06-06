import type { LabelHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export function Label({ className, ...p }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs font-semibold text-text-secondary tracking-wide', className)}
      {...p}
    />
  );
}
