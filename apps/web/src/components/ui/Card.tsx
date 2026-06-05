import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...p} />
);

export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...p} />
);

export const CardDescription = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...p} />
);

export const CardContent = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0', className)} {...p} />
);

export const CardFooter = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...p} />
);
