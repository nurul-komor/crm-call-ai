import { cn } from '@/lib/cn';

export function Waveform({
  bars = 28,
  height = 32,
  active = true,
  color = 'currentColor',
  className,
}: {
  bars?: number;
  height?: number;
  active?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('inline-flex items-center gap-[3px]', className)}
      style={{ height, color }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="block w-[3px] rounded-full bg-current origin-center"
          style={{
            height: '60%',
            animation: active
              ? `waveBar ${0.7 + (i % 5) * 0.12}s ease-in-out infinite ${i * 35}ms`
              : 'none',
            opacity: active ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}
