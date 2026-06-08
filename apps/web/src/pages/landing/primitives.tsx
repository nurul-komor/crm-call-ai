import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/cn';

/* ---------- useInView ---------- */
export function useInView<T extends HTMLElement = HTMLDivElement>(opts: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
} = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true);
          if (opts.once !== false) obs.unobserve(el);
        }
      },
      { threshold: opts.threshold ?? 0.05, rootMargin: opts.rootMargin ?? '0px 0px -8% 0px' },
    );
    obs.observe(el);
    const fallback = window.setTimeout(() => setInView(true), 2000);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, [opts.threshold, opts.rootMargin, opts.once]);
  return [ref, inView] as const;
}

/* ---------- AnimatedCounter ---------- */
export function AnimatedCounter({
  end,
  duration = 1800,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView<HTMLSpanElement>();
  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {decimals ? count.toFixed(decimals) : Math.round(count).toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------- ScrollReveal ---------- */
export function ScrollReveal({
  children,
  delay = 0,
  distance = 24,
  duration = 650,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [ref, shown] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Spotlight (section-wide) ---------- */
export function Spotlight({
  children,
  color = 'hsl(var(--accent) / 0.18)',
  size = 600,
  className,
  style,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999, active: false });
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top, active: true });
      }}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className={cn('relative overflow-hidden', className)}
      style={style}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 50%)`,
          opacity: pos.active ? 1 : 0,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/* ---------- CardSpotlight ---------- */
export function CardSpotlight({
  children,
  color = 'hsl(var(--accent) / 0.22)',
  size = 320,
  radius = 18,
  padding = 28,
  className,
  style,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  radius?: number;
  padding?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999, active: false });
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top, active: true });
      }}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className={cn(
        'relative overflow-hidden bg-surface border border-border transition-[border-color,transform] duration-300 hover:border-border-light',
        className,
      )}
      style={{ borderRadius: radius, padding, ...style }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 50%)`,
          opacity: pos.active ? 1 : 0,
        }}
      />
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
}

/* ---------- BackgroundGrid (dot or grid) ---------- */
export function BackgroundGrid({
  variant = 'dot',
  cellSize = 24,
  fadeMask = true,
  className,
}: {
  variant?: 'dot' | 'grid';
  cellSize?: number;
  fadeMask?: boolean;
  className?: string;
}) {
  const color = 'hsl(var(--border))';
  const bg =
    variant === 'dot'
      ? `radial-gradient(${color} 1px, transparent 1px)`
      : `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`;
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: bg,
        backgroundSize: `${cellSize}px ${cellSize}px`,
        opacity: 0.55,
        WebkitMaskImage: fadeMask
          ? 'radial-gradient(ellipse at center, #000 30%, transparent 75%)'
          : undefined,
        maskImage: fadeMask
          ? 'radial-gradient(ellipse at center, #000 30%, transparent 75%)'
          : undefined,
      }}
    />
  );
}

/* ---------- BackgroundBeams ---------- */
export function BackgroundBeams({
  count = 8,
  color = 'hsl(var(--accent-light) / 0.5)',
}: {
  count?: number;
  color?: string;
}) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0"
    >
      <defs>
        <linearGradient id="beam-grad-x" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: count }).map((_, i) => {
        const startY = (i / count) * 800;
        const endY = startY + 100 + (i % 3) * 60;
        const ctrlX = 400 + (i % 2 === 0 ? 200 : -200);
        const duration = 8 + (i % 4) * 3;
        const delay = (i * 0.7) % 8;
        return (
          <path
            key={i}
            d={`M -100 ${startY} Q ${ctrlX} ${(startY + endY) / 2} 900 ${endY}`}
            fill="none"
            stroke="url(#beam-grad-x)"
            strokeWidth={1 + (i % 3) * 0.5}
            strokeDasharray="200 1400"
            strokeDashoffset="1600"
            opacity="0.7"
            style={{ animation: `beamSweep ${duration}s ease-in-out ${delay}s infinite` }}
          />
        );
      })}
    </svg>
  );
}

/* ---------- Meteors ---------- */
export function Meteors({ count = 10 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = (i / count) * 100 + Math.random() * 10;
        const duration = 4 + Math.random() * 6;
        const delay = Math.random() * 10;
        return (
          <span
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-white/60"
            style={{
              top: 0,
              left: `${left}%`,
              boxShadow: '0 0 6px 1px rgba(255,255,255,0.4)',
              transform: 'rotate(215deg)',
              animation: `meteorFall ${duration}s linear ${delay}s infinite`,
            }}
          >
            <span
              className="absolute left-0 top-0 h-20 w-px origin-top"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)',
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

/* ---------- Sparkles ---------- */
export function Sparkles({
  count = 24,
  color = 'rgba(167, 139, 250, 0.55)',
}: {
  count?: number;
  color?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const size = 1 + Math.random() * 2;
        const duration = 8 + Math.random() * 12;
        const delay = Math.random() * 15;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              bottom: -10,
              left: `${left}%`,
              width: size,
              height: size,
              background: color,
              boxShadow: `0 0 ${size * 3}px ${color}`,
              animation: `sparkleFloat ${duration}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- MovingBorder (rotating conic gradient frame) ---------- */
export function MovingBorder({
  children,
  radius = 20,
  borderWidth = 2,
  duration = 6,
  color1 = '#2563EB',
  color2 = '#EC4899',
  className,
  style,
}: {
  children: ReactNode;
  radius?: number;
  borderWidth?: number;
  duration?: number;
  color1?: string;
  color2?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn('relative overflow-hidden isolate', className)}
      style={{ borderRadius: radius, padding: borderWidth, ...style }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `conic-gradient(from 0deg, transparent 0%, ${color1} 20%, ${color2} 40%, transparent 60%, ${color1} 80%, transparent 100%)`,
          animation: `borderSpin ${duration}s linear infinite`,
          zIndex: 0,
        }}
      />
      <div
        className="relative h-full bg-surface"
        style={{ borderRadius: Math.max(radius - borderWidth, 0), zIndex: 1 }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- ShimmerButton ---------- */
export function ShimmerButton({
  children,
  href,
  to,
  onClick,
  className,
  style,
}: {
  children: ReactNode;
  href?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const inner = (
    <>
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
      <span
        className="pointer-events-none absolute left-0 top-0 h-full w-[60%]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
          animation: 'shimmerSweep 3.2s ease-in-out infinite',
        }}
      />
    </>
  );
  const base =
    'relative inline-flex items-center gap-2 overflow-hidden rounded-full border-0 px-7 py-3.5 text-[15px] font-semibold text-white cursor-pointer no-underline';
  const baseStyle: CSSProperties = {
    background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-light)))',
    boxShadow:
      '0 8px 24px hsl(var(--accent) / 0.35), inset 0 0 0 1px rgba(255,255,255,0.15)',
    ...style,
  };
  if (to) {
    // Note: imported lazily to avoid making this primitive depend on router
    return (
      <a href={to} className={cn(base, className)} style={baseStyle} onClick={onClick}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <a href={href} className={cn(base, className)} style={baseStyle} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cn(base, className)} style={baseStyle} onClick={onClick}>
      {inner}
    </button>
  );
}

/* ---------- MagneticButton ---------- */
export function MagneticButton({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });
  return (
    <span
      ref={ref}
      className={cn('inline-block', className)}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        setT({ x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength });
      }}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
    >
      <span
        className="inline-block"
        style={{
          transform: `translate(${t.x}px, ${t.y}px)`,
          transition:
            t.x === 0 && t.y === 0
              ? 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'transform 0.15s ease-out',
        }}
      >
        {children}
      </span>
    </span>
  );
}

/* ---------- WordRotate ---------- */
export function WordRotate({
  words,
  interval = 2800,
  className,
  style,
}: {
  words: string[];
  interval?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (words.length < 2) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);
  return (
    <span className={cn('inline-block', className)} style={style}>
      <span
        key={idx}
        className="inline-block"
        style={{ animation: 'wordRotateIn 0.55s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {words[idx]}
      </span>
    </span>
  );
}

/* ---------- ContainerScroll (3D rotateX based on viewport progress) ---------- */
export function ContainerScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = r.height + vh;
      const distance = vh - r.top;
      const p = Math.max(0, Math.min(1, distance / total));
      setProgress(p);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  const rotateX = (1 - progress) * 20;
  const scale = 1.05 - progress * 0.05;
  return (
    <div ref={ref} style={{ perspective: 1200 }} className="relative">
      <div
        style={{
          transform: `rotateX(${rotateX}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.05s linear',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Theme management ---------- */
type Theme = 'dark' | 'light';
const THEME_KEY = 'vf-landing-theme';

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  if (theme === 'light') el.classList.add('light');
  else el.classList.remove('light');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });
  useLayoutEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, toggle };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative box-border inline-flex h-8 w-16 cursor-pointer items-center rounded-full border border-border bg-bg p-1 transition-colors',
        className,
      )}
    >
      <span
        className="relative flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300"
        style={{
          transform: isDark ? 'translateX(0)' : 'translateX(32px)',
          background: isDark ? '#27272A' : '#E4E4E7',
          color: isDark ? '#FFFFFF' : '#374151',
        }}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
      <span
        className="pointer-events-none absolute top-1 flex h-6 w-6 items-center justify-center rounded-full opacity-50 transition-transform duration-300"
        style={{
          transform: isDark ? 'translateX(32px)' : 'translateX(0)',
          color: isDark ? '#6B7280' : '#000000',
        }}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </span>
    </button>
  );
}

/* ---------- CustomCursor ---------- */
export function CustomCursor({
  size = 40,
  dotSize = 6,
  hoverScale = 1.8,
}: {
  size?: number;
  dotSize?: number;
  hoverScale?: number;
}) {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [touch, setTouch] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setTouch(!mq.matches);
    const fn = (e: MediaQueryListEvent) => setTouch(!e.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);

  useEffect(() => {
    if (touch) return;
    const move = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) {
        setHovered(false);
        return;
      }
      const interactive = el.closest(
        'a, button, input, textarea, select, [role="button"], [data-cursor-hover], label',
      );
      setHovered(!!interactive);
    };
    const leave = () => setVisible(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseleave', leave);
    };
  }, [touch, visible]);

  useEffect(() => {
    if (touch) return;
    let raf = 0;
    const tick = () => {
      const t = targetRef.current;
      const c = currentRef.current;
      c.x += (t.x - c.x) * 0.18;
      c.y += (t.y - c.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${c.x}px, ${c.y}px) translate(-50%, -50%) scale(${hovered ? hoverScale : 1})`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${t.x}px, ${t.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [touch, hovered, hoverScale]);

  useEffect(() => {
    if (touch) return;
    const update = () => {
      const h = document.documentElement;
      const scrollable = h.scrollHeight - h.clientHeight;
      setProgress(scrollable > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollable)) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [touch]);

  useEffect(() => {
    if (touch) return;
    const id = 'vf-custom-cursor-style';
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      el.textContent =
        'html, body, a, button, input, textarea, select, [role="button"] { cursor: none !important; }';
      document.head.appendChild(el);
    }
    return () => {
      el?.remove();
    };
  }, [touch]);

  if (touch) return null;

  const ringSize = size;
  const stroke = 2;
  const r = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <>
      <div
        ref={ringRef}
        className="fixed left-0 top-0 pointer-events-none z-[9999] transition-opacity duration-200"
        style={{
          width: ringSize,
          height: ringSize,
          opacity: visible ? 1 : 0,
          mixBlendMode: 'difference',
        }}
      >
        <svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={stroke}
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="#fff"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            style={{ transition: 'stroke-dashoffset 0.12s linear' }}
          />
        </svg>
      </div>
      <div
        ref={dotRef}
        className="fixed left-0 top-0 pointer-events-none z-[9999] rounded-full bg-white transition-opacity duration-200"
        style={{
          width: dotSize,
          height: dotSize,
          opacity: visible ? 1 : 0,
          mixBlendMode: 'difference',
        }}
      />
    </>
  );
}

/* ============================================================
   LiquidPill / LiquidTabs
   Floating translucent pill that springs between active targets
   ============================================================ */
interface LiquidPillRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function useLiquidPill(activeKey: string | number) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Record<string | number, HTMLElement>>({});
  const [rect, setRect] = useState<LiquidPillRect | null>(null);

  const measure = () => {
    const container = containerRef.current;
    const active = itemRefs.current[activeKey];
    if (!container || !active) return;
    const c = container.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    setRect({
      top: a.top - c.top + container.scrollTop,
      left: a.left - c.left + container.scrollLeft,
      width: a.width,
      height: a.height,
    });
  };

  useLayoutEffect(() => { measure(); }, [activeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRef = (key: string | number) => (el: HTMLElement | null) => {
    if (el) itemRefs.current[key] = el;
    else delete itemRefs.current[key];
  };

  return { containerRef, setRef, rect, measure };
}

export function LiquidPill({
  rect,
  className = '',
  style = {},
}: {
  rect: LiquidPillRect | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!rect) return null;
  return (
    <div
      className={`liquid-pill ${className}`}
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, ...style }}
    />
  );
}

interface LiquidTab {
  id: string;
  label: string;
  icon?: ((size: number) => React.ReactElement) | React.ReactElement;
  count?: number;
}

export function LiquidTabs({
  tabs,
  value,
  onChange,
  style,
}: {
  tabs: LiquidTab[];
  value: string;
  onChange: (id: string) => void;
  style?: React.CSSProperties;
}) {
  const { containerRef, setRef, rect } = useLiquidPill(value);
  return (
    <div
      className="liquid-tab-row"
      ref={containerRef as React.RefObject<HTMLDivElement>}
      style={style}
    >
      <LiquidPill rect={rect} className="liquid-pill-tab" />
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={setRef(t.id) as React.RefCallback<HTMLButtonElement>}
          className={`liquid-tab ${value === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.icon && (
            <span className="inline-flex">
              {typeof t.icon === 'function' ? t.icon(14) : t.icon}
            </span>
          )}
          <span>{t.label}</span>
          {t.count !== undefined && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                color: 'hsl(var(--text-tertiary))',
                marginLeft: 2,
              }}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
