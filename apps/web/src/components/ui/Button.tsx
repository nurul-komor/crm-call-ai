import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  default:
    'bg-accent text-white border border-transparent hover:bg-accent-dark hover:shadow-accent-glow',
  outline:
    'border border-border bg-transparent text-text hover:bg-[hsl(var(--hover-overlay-strong))] hover:border-border-light',
  secondary:
    'border border-border bg-surface-2 text-text hover:bg-[hsl(var(--hover-overlay-strong))]',
  ghost: 'border border-transparent text-text-secondary hover:bg-[hsl(var(--hover-overlay))] hover:text-text',
  destructive: 'bg-danger text-white border border-transparent hover:bg-danger/90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-base gap-2',
  lg: 'h-11 px-6 text-md gap-2',
  icon: 'h-9 w-9 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
