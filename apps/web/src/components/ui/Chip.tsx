import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'text-text-secondary bg-surface-2 border-border',
  accent: 'text-accent-light bg-accent/10 border-accent/30',
  success: 'text-success bg-success/10 border-success/30',
  warning: 'text-warning bg-warning/10 border-warning/30',
  danger: 'text-danger bg-danger/10 border-danger/30',
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
}

export function Chip({
  tone = 'neutral',
  dot = false,
  pulse = false,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span className={cn('chip', tones[tone], className)} {...rest}>
      {dot && (
        <span
          className={cn('inline-block w-1.5 h-1.5 rounded-full bg-current', pulse && 'live-dot')}
          style={{ backgroundColor: pulse ? undefined : 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}
