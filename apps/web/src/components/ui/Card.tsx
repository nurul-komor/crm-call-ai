import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('dash-card overflow-hidden', className)} {...props} />
  ),
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 px-5 py-4 border-b border-border',
      className,
    )}
    {...p}
  />
);

export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <h3
    className={cn(
      'text-md font-semibold tracking-tight text-text',
      className,
    )}
    {...p}
  />
);

export const CardDescription = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <p className={cn('text-sm text-text-secondary', className)} {...p} />
);

export const CardContent = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...p} />
);

export const CardFooter = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center px-5 py-4 border-t border-border', className)} {...p} />
);
