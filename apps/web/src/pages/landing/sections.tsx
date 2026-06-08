import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  Check,
  Cpu,
  DollarSign,
  Eye,
  Gauge,
  GitBranch,
  Headphones,
  Heart,
  Layers,
  MessageSquare,
  Mic,
  Phone,
  Play,
  Search,
  Settings as SettingsIcon,
  Shield,
  Sparkles as SparklesIcon,
  Star,
  Target,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from 'lucide-react';

import { Waveform } from '@/components/Waveform';
import { useAuthStore } from '@/lib/authStore';

import {
  AnimatedCounter,
  BackgroundBeams,
  BackgroundGrid,
  CardSpotlight,
  ContainerScroll,
  MagneticButton,
  Meteors,
  MovingBorder,
  ScrollReveal,
  ShimmerButton,
  Sparkles,
  Spotlight,
  ThemeToggle,
} from './primitives';

/* ---------- Section header ---------- */
function SectionHeader({
  label,
  title,
  subtitle,
  className,
}: {
  label?: string;
  title: ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`mx-auto mb-14 max-w-[680px] text-center ${className ?? ''}`}>
      {label && (
        <div className="mb-3 inline-flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-accent-light">
          <span className="h-px w-5 bg-accent" />
          {label}
          <span className="h-px w-5 bg-accent" />
        </div>
      )}
      <h2 className="text-[clamp(40px,5vw,64px)] font-bold leading-[1.05] tracking-[-0.035em]">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-[580px] text-[17px] leading-[1.6] text-text-secondary">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ---------- Brand wordmark ---------- */
function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-baseline text-[22px] font-bold tracking-tighter text-text no-underline ${className ?? ''}`}
    >
      Calls<span style={{ color: '#FF6B5C', fontWeight: 800, margin: '0 1px' }}>.</span>
      <span
        className="font-extrabold italic"
        style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #FF6B5C 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Ai
      </span>
    </Link>
  );
}

/* ============================================================
   1. Navigation — floating pill nav with mega-menu dropdowns
   ============================================================ */

interface NavMenuItem {
  label: string;
  desc: string;
  icon: (size: number) => React.ReactElement;
  color: string;
  href: string;
}
interface NavMenuDef {
  items: NavMenuItem[];
  footer?: { title: string; desc: string; cta: string; href: string };
}
interface NavLinkDef {
  label: string;
  href: string;
  menu?: NavMenuDef;
}

function NavLinks({ links }: { links: NavLinkDef[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const [menuRect, setMenuRect] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (hoverIdx === null) { setPill((p) => ({ ...p, visible: false })); return; }
    const el = linkRefs.current[hoverIdx];
    const container = containerRef.current;
    if (!el || !container) return;
    const cr = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ left: r.left - cr.left, width: r.width, visible: true });
  }, [hoverIdx]);

  useEffect(() => {
    if (openIdx === null) return;
    const el = linkRefs.current[openIdx];
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuRect({ left: r.left + r.width / 2, top: r.bottom + 12 });
  }, [openIdx, hoverIdx]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenIdx(null); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  const handleEnterLink = (i: number, hasMenu: boolean) => {
    setHoverIdx(i);
    if (hasMenu) setOpenIdx(i);
    else setOpenIdx(null);
  };
  const handleLeaveCluster = () => { setHoverIdx(null); setOpenIdx(null); };
  const activeMenu = openIdx !== null ? links[openIdx]?.menu : null;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-0.5"
      onMouseLeave={handleLeaveCluster}
    >
      {/* sliding background pill */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: 4, bottom: 4,
          left: pill.left, width: pill.width,
          background: 'hsl(var(--hover-overlay-strong))',
          borderRadius: 100,
          opacity: pill.visible ? 1 : 0,
          transition: pill.visible
            ? 'left 0.32s cubic-bezier(0.22,1,0.36,1), width 0.32s cubic-bezier(0.22,1,0.36,1), opacity 0.18s ease'
            : 'opacity 0.18s ease',
        }}
      />
      {links.map((l, i) => (
        <a
          key={l.href}
          ref={(el) => { linkRefs.current[i] = el; }}
          href={l.href}
          onMouseEnter={() => handleEnterLink(i, !!l.menu)}
          onClick={(e) => { if (l.menu) { e.preventDefault(); setOpenIdx(openIdx === i ? null : i); } }}
          className="relative z-[1] inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[18px] py-2.5 text-sm font-medium transition-colors duration-150"
          style={{ color: hoverIdx === i || openIdx === i ? 'hsl(var(--text))' : 'hsl(var(--text-secondary))' }}
        >
          {l.label}
          {l.menu && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: 0.7, transform: openIdx === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          )}
        </a>
      ))}

      {/* Mega-menu dropdown */}
      {activeMenu && (
        <div
          onMouseEnter={() => { /* keep open */ }}
          style={{
            position: 'fixed', top: menuRect.top, left: menuRect.left,
            transform: 'translateX(-50%)',
            width: 'min(680px, calc(100vw - 32px))',
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border-light))',
            borderRadius: 18,
            padding: 14,
            boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.1)',
            zIndex: 200,
            animation: 'navMenuIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div className="grid grid-cols-2 gap-1">
            {activeMenu.items.map((it, j) => (
              <a key={j} href={it.href} className="row-hover flex items-start gap-3 rounded-xl p-3 text-text no-underline"
                onClick={() => setOpenIdx(null)}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${it.color}18`, color: it.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{it.icon(18)}</span>
                <div>
                  <div className="mb-0.5 text-[13.5px] font-semibold">{it.label}</div>
                  <div className="text-[12px] leading-[1.45] text-text-tertiary">{it.desc}</div>
                </div>
              </a>
            ))}
          </div>
          {activeMenu.footer && (
            <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl p-3"
              style={{ background: 'hsl(var(--surface-2))' }}>
              <div>
                <div className="text-[12px] font-semibold">{activeMenu.footer.title}</div>
                <div className="text-[11px] text-text-tertiary">{activeMenu.footer.desc}</div>
              </div>
              <a href={activeMenu.footer.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white no-underline"
                style={{ background: 'hsl(var(--accent))' }}
                onClick={() => setOpenIdx(null)}>
                {activeMenu.footer.cta} <ArrowRight size={12} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Navigation() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks: NavLinkDef[] = [
    { label: 'Home', href: '#' },
    {
      label: 'Features', href: '#features',
      menu: {
        items: [
          { label: 'AI Phone Calls',     desc: 'Sub-400ms outbound and inbound voice calls.',   icon: (s) => <Phone size={s} />,         color: '#2563EB', href: '#features' },
          { label: 'WhatsApp Voice',     desc: 'Global reach — no SIM, no telecom contracts.',  icon: (s) => <Headphones size={s} />,    color: '#25D366', href: '#channels' },
          { label: 'WhatsApp Chat',      desc: 'Rich-media chat that closes in the inbox.',     icon: (s) => <MessageSquare size={s} />, color: '#34D399', href: '#channels' },
          { label: 'Campaign Builder',   desc: 'Visual flows, lead scoring, scheduling.',       icon: (s) => <Layers size={s} />,        color: '#8B5CF6', href: '#features' },
          { label: 'Lead Qualification', desc: 'AI scores every lead in real time.',            icon: (s) => <Target size={s} />,        color: '#F59E0B', href: '#features' },
          { label: 'Analytics',          desc: 'Executive dashboards — channel + AI breakdown.',icon: (s) => <BarChart3 size={s} />,     color: '#3B82F6', href: '#features' },
        ],
        footer: { title: 'See the full platform', desc: 'A 2-minute interactive walkthrough.', cta: 'Watch demo', href: '#features' },
      },
    },
    {
      label: 'Channels', href: '#channels',
      menu: {
        items: [
          { label: 'Phone Calls',    desc: 'Inbound + outbound AI voice agents.',     icon: (s) => <Phone size={s} />,         color: '#2563EB', href: '#channels' },
          { label: 'WhatsApp Voice', desc: 'Voice calls through WhatsApp Cloud API.', icon: (s) => <Headphones size={s} />,    color: '#25D366', href: '#channels' },
          { label: 'WhatsApp Chat',  desc: 'Rich-media automated conversations.',     icon: (s) => <MessageSquare size={s} />, color: '#34D399', href: '#channels' },
          { label: 'Hybrid Routing', desc: 'Intelligent channel selection per lead.', icon: (s) => <GitBranch size={s} />,     color: '#8B5CF6', href: '#channels' },
        ],
        footer: { title: 'Try a live AI call now', desc: 'Get an AI call to your phone in 30 seconds.', cta: 'Try it free', href: '/signup' },
      },
    },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ',     href: '#faq' },
  ];

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-[100] px-6 transition-all"
      style={{
        paddingTop: scrolled ? 8 : 14,
        paddingBottom: scrolled ? 8 : 14,
        background: 'hsl(var(--bg) / 0.7)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: scrolled ? '1px solid hsl(var(--border))' : '1px solid transparent',
        isolation: 'isolate',
      }}
    >
      {/* Glass animation layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-0 right-0 top-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--accent-light)), transparent)',
            opacity: scrolled ? 0.7 : 0.3,
            animation: 'navTopShine 6s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
            backgroundSize: '300% 100%',
            animation: 'navGlassSweep 8s linear infinite',
            mixBlendMode: 'plus-lighter',
          }}
        />
      </div>

      <div
        className="relative mx-auto flex items-center justify-between gap-4"
        style={{
          maxWidth: scrolled ? 1480 : 1240,
          transition: 'max-width 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <BrandMark className="shrink-0" />

        <div className="nav-pill">
          <NavLinks links={navLinks} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {isAuthed ? (
            <Link
              to="/customers"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: 'hsl(var(--accent))', boxShadow: '0 4px 16px hsl(var(--accent) / 0.35)' }}
            >
              Open dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-text sm:inline-flex">
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{ background: 'hsl(var(--accent))', boxShadow: '0 4px 16px hsl(var(--accent) / 0.35)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                Get Started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   2. Hero — phrase rotator + interactive demo player
   ============================================================ */
const HERO_PHRASES = [
  'that talk like humans.',
  'that close deals.',
  'that qualify leads.',
  'that work 24/7.',
  'that scale infinitely.',
];

export function HeroSection() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  const [phraseIdx, setPhraseIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setPhraseIdx((i) => (i + 1) % HERO_PHRASES.length),
      2800,
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <section className="relative overflow-hidden pb-20 pt-[150px]">
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1000,
          height: 1000,
          background:
            'radial-gradient(circle, hsl(var(--accent) / 0.18) 0%, transparent 55%)',
          filter: 'blur(60px)',
          borderRadius: '50%',
          animation: 'glowPulse 10s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora1 30s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'aurora2 28s ease-in-out 5s infinite',
        }}
      />
      <Sparkles count={24} />
      <Meteors count={6} />

      <div className="relative z-[1] mx-auto max-w-[1280px] px-8">
        <div className="mx-auto mb-14 max-w-[980px] text-center">
          <a
            href="#features"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-light"
          >
            <span
              className="rounded-full px-2.5 py-[3px] text-[10.5px] font-bold tracking-[0.04em] text-white"
              style={{ background: 'hsl(var(--accent))' }}
            >
              NEW
            </span>
            Multi-channel AI agents now generally available
            <ArrowRight size={12} className="text-text-tertiary" />
          </a>
          <h1
            className="mb-7 font-bold tracking-[-0.05em] text-text"
            style={{ fontSize: 'clamp(52px, 8vw, 112px)', lineHeight: 0.95 }}
          >
            AI agents
            <br />
            <span
              key={phraseIdx}
              className="inline-block whitespace-nowrap italic"
              style={{
                fontSize: '0.78em',
                fontWeight: 500,
                background:
                  'linear-gradient(90deg, hsl(var(--accent)), #EC4899, #F59E0B, hsl(var(--accent)))',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation:
                  'gradientFlow 8s linear infinite, wordRotateIn 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {HERO_PHRASES[phraseIdx]}
            </span>
          </h1>
          <p
            className="mx-auto mb-9 max-w-[640px] leading-[1.6] text-text-secondary"
            style={{ fontSize: 'clamp(17px, 1.4vw, 21px)' }}
          >
            Launch voice and chat AI agents across Phone, WhatsApp Voice, and WhatsApp
            Chat — with the same conversation memory and lead intelligence.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <MagneticButton strength={0.4}>
              <ShimmerButton to={isAuthed ? '/customers' : '/signup'}>
                {isAuthed ? 'Open dashboard' : 'Start free trial'}
                <ArrowRight size={16} />
              </ShimmerButton>
            </MagneticButton>
            <MagneticButton strength={0.3}>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 text-md font-semibold text-text transition-colors hover:bg-[hsl(var(--hover-overlay-strong))] hover:border-border-light"
              >
                <Play size={14} /> Watch 2-min demo
              </a>
            </MagneticButton>
          </div>
        </div>

        <ContainerScroll>
          <InteractiveDemoPlayer />
        </ContainerScroll>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-text-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <Check size={13} /> 14-day free trial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check size={13} /> No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check size={13} /> Launch in under 10 minutes
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------- Demo player (used inside HeroSection) ---------- */
type DemoLine = { role: 'AI' | 'USER'; text: string };
type DemoSample = {
  label: string;
  Icon: typeof Phone;
  voice: string;
  lang: string;
  gradient: [string, string, string];
  script: DemoLine[];
};

const DEMO_SAMPLES: DemoSample[] = [
  {
    label: 'Phone',
    Icon: Phone,
    voice: 'Sofia',
    lang: 'EN-US',
    gradient: ['#2563EB', '#EC4899', '#F59E0B'],
    script: [
      { role: 'AI', text: 'Hi Maria, this is Sofia calling from VoiceFlow AI — do you have a quick minute?' },
      { role: 'USER', text: 'Yes, sure.' },
      { role: 'AI', text: 'Great. I noticed you signed up for a trial — mind if I ask what brought you in?' },
      { role: 'USER', text: 'We need to scale our outbound calling without hiring more reps.' },
      { role: 'AI', text: 'Perfect use case. Let me set up a demo with our solutions team for Thursday.' },
    ],
  },
  {
    label: 'WhatsApp Voice',
    Icon: Headphones,
    voice: 'Isabella',
    lang: 'ES-LATAM',
    gradient: ['#25D366', '#22C55E', '#A78BFA'],
    script: [
      { role: 'AI', text: 'Hola Carlos, soy Isabella de VoiceFlow. ¿Tienes un momento?' },
      { role: 'USER', text: 'Sí, claro.' },
      { role: 'AI', text: 'Quería preguntarte sobre tu interés en automatización para LATAM.' },
      { role: 'USER', text: 'Estamos enviando 5,000 mensajes al día manualmente.' },
      { role: 'AI', text: 'Eso lo podemos resolver. Te envío un caso de estudio similar al tuyo.' },
    ],
  },
  {
    label: 'WhatsApp Chat',
    Icon: MessageSquare,
    voice: 'Marcus',
    lang: 'EN-UK',
    gradient: ['#34D399', '#06B6D4', '#2563EB'],
    script: [
      { role: 'AI', text: 'Hi James — thanks for downloading the case study. Any questions on rollout?' },
      { role: 'USER', text: 'How long is onboarding typically?' },
      { role: 'AI', text: 'Most teams launch their first campaign in under 10 minutes.' },
      { role: 'USER', text: 'What about CRM sync — we use HubSpot.' },
      { role: 'AI', text: 'Native integration. Leads and transcripts sync automatically.' },
    ],
  },
];

const USE_CASES = [
  { id: 'lead-qual',    label: 'Qualify a lead',    icon: Target },
  { id: 'book-meeting', label: 'Book a meeting',    icon: Activity },
  { id: 'support',      label: 'Answer a question', icon: Headphones },
  { id: 'onboard',      label: 'Onboard a customer',icon: Users },
] as const;

const AI_MODELS = [
  { id: 'claude', label: 'Claude 3.5', color: '#D4A574' },
  { id: 'gpt',    label: 'GPT-4o',     color: '#10A37F' },
  { id: 'gemini', label: 'Gemini Pro', color: '#4285F4' },
] as const;

function InteractiveDemoPlayer() {
  const [tab, setTab] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [formName, setFormName] = useState('');
  const [phone, setPhone] = useState('');
  const [useCase, setUseCase] = useState('lead-qual');
  const [aiModel, setAiModel] = useState('claude');
  const [calling, setCalling] = useState(false);
  const sample = DEMO_SAMPLES[tab] as DemoSample;
  const totalDuration = sample.script.length * 1500;
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  const personalized = useMemo(() => {
    const placeholders = ['Maria', 'Carlos', 'James'];
    if (!formName) return sample.script;
    return sample.script.map((line) => ({
      ...line,
      text: placeholders.reduce((acc, ph) => acc.replace(ph, formName), line.text),
    }));
  }, [sample, formName]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };
  const reset = () => {
    clearTimers();
    setVisibleLines(0);
    setProgress(0);
  };

  useEffect(() => {
    reset();
    setPlaying(false);
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const togglePlay = () => {
    if (playing) {
      clearTimers();
      setPlaying(false);
      return;
    }
    if (visibleLines >= sample.script.length) reset();
    setPlaying(true);
    sample.script.forEach((_, i) => {
      const t = window.setTimeout(() => setVisibleLines(i + 1), (i + 1) * 1500);
      timersRef.current.push(t);
    });
    const end = window.setTimeout(() => setPlaying(false), totalDuration);
    timersRef.current.push(end);
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div
      className="relative mx-auto max-w-[980px] overflow-hidden rounded-3xl border border-border bg-surface"
      style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
      id="demo"
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2.5 w-2.5 rounded-full bg-border-light" />
            ))}
          </div>
          <span className="ml-3 font-mono text-[11.5px] text-text-tertiary">
            voiceflow.ai — live demo
          </span>
        </div>
        <div className="flex gap-1 rounded-[10px] border border-border bg-bg p-1">
          {DEMO_SAMPLES.map((s, i) => {
            const Icon = s.Icon;
            return (
              <button
                key={s.label}
                onClick={() => setTab(i)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: tab === i ? 'hsl(var(--surface))' : 'transparent',
                  color: tab === i ? 'hsl(var(--text))' : 'hsl(var(--text-tertiary))',
                  boxShadow: tab === i ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <Icon size={13} /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid min-h-[360px] grid-cols-1 md:grid-cols-[1fr_1.2fr]">
        {/* Voice signature column */}
        <div className="relative flex flex-col items-center justify-center gap-5 border-b border-border bg-surface-2 px-7 py-8 md:border-b-0 md:border-r">
          <div
            className="voice-blob relative h-[200px] w-[200px] overflow-hidden rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${sample.gradient[0]}, ${sample.gradient[1]} 50%, ${sample.gradient[2]} 100%)`,
              filter: playing ? 'saturate(1.2)' : 'saturate(1)',
              boxShadow: playing
                ? `0 0 80px ${sample.gradient[0]}40, 0 0 40px ${sample.gradient[1]}40`
                : `0 0 30px ${sample.gradient[0]}20`,
              transition: 'box-shadow 0.5s, filter 0.5s',
            }}
          >
            <button
              type="button"
              onClick={togglePlay}
              className="relative z-[2] flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white/95 text-[#09090B] transition-transform hover:scale-105"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ marginLeft: 3 }}
                >
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              )}
            </button>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-bold tracking-tight">{sample.voice}</div>
            <div className="text-xs text-text-tertiary">
              ElevenLabs voice · {sample.lang}
            </div>
          </div>
          <Waveform
            bars={42}
            height={40}
            active={playing}
            color={sample.gradient[0]}
            className="w-full max-w-[280px]"
          />
          <div className="h-[3px] w-full max-w-[280px] overflow-hidden rounded bg-border">
            <div
              className="h-full rounded"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${sample.gradient[0]}, ${sample.gradient[1]})`,
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>

        {/* Transcript column */}
        <div className="flex flex-col px-7 pb-8 pt-7">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: playing
                    ? 'hsl(var(--success))'
                    : 'hsl(var(--text-tertiary))',
                  boxShadow: playing ? '0 0 8px hsl(var(--success))' : 'none',
                  animation: playing ? 'pulseSoft 1.5s infinite' : 'none',
                }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{
                  color: playing ? 'hsl(var(--success))' : 'hsl(var(--text-tertiary))',
                }}
              >
                {playing ? 'Live transcript' : 'Ready to play'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                reset();
                setPlaying(false);
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-text-tertiary hover:text-text"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9" />
                <path d="M3 4v5h5" />
              </svg>
              Restart
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            {personalized.map((line, i) => {
              const shown = i < visibleLines;
              const isAI = line.role === 'AI';
              return (
                <div
                  key={`${tab}-${i}`}
                  className="flex gap-3"
                  style={{
                    opacity: shown ? 1 : 0.55,
                    transform: shown ? 'translateY(0)' : 'translateY(4px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  <span
                    className="mt-1 min-w-[44px] font-mono text-[10px] font-bold"
                    style={{
                      color: isAI
                        ? 'hsl(var(--accent-light))'
                        : 'hsl(var(--success))',
                    }}
                  >
                    {line.role}
                  </span>
                  <span
                    className="flex-1 rounded-[10px] border px-3.5 py-2 text-sm leading-[1.55]"
                    style={{
                      background: isAI
                        ? 'hsl(var(--accent) / 0.08)'
                        : 'hsl(var(--success) / 0.06)',
                      borderColor: isAI
                        ? 'hsl(var(--accent) / 0.18)'
                        : 'hsl(var(--success) / 0.15)',
                    }}
                  >
                    {line.text}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3.5 text-[11px] text-text-tertiary">
            <span className="inline-flex items-center gap-1.5">
              <Brain size={12} /> Claude 3.5 Sonnet
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield size={12} /> End-to-end encrypted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity size={12} /> 380ms latency
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-surface-2 px-6 pb-5 pt-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-accent-light">
              Try it live
            </div>
            <div className="text-sm text-text-secondary">
              Get an AI call to your phone in 30 seconds.
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'hsl(var(--success))', animation: 'pulseSoft 2s infinite' }}
            />
            8 demos triggered in the last hour
          </span>
        </div>

        {/* Name + Phone inputs */}
        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary">
              Your name
            </span>
            <div className="flex items-center gap-2 rounded-[10px] border border-border bg-bg px-3 py-2.5 transition-colors focus-within:border-accent">
              <Users size={13} className="shrink-0 text-text-tertiary" />
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Maria Santos"
                className="flex-1 bg-transparent text-[13.5px] text-text outline-none placeholder:text-text-tertiary"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary">
              Phone number
            </span>
            <div className="flex items-center gap-2 rounded-[10px] border border-border bg-bg px-3 py-2.5 transition-colors focus-within:border-accent">
              <Phone size={13} className="shrink-0 text-text-tertiary" />
              <span className="border-r border-border pr-2 font-mono text-[13px] text-text-secondary">
                +1
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(415) 555-0142"
                inputMode="tel"
                className="flex-1 bg-transparent font-mono text-[13.5px] text-text outline-none placeholder:text-text-tertiary"
              />
            </div>
          </label>
        </div>

        {/* Use case + Model */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex-1" style={{ minWidth: 280 }}>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary">
              Use case
            </div>
            <div className="flex flex-wrap gap-1.5">
              {USE_CASES.map((uc) => {
                const UcIcon = uc.icon;
                return (
                  <button
                    key={uc.id}
                    type="button"
                    onClick={() => setUseCase(uc.id)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      borderColor: useCase === uc.id ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                      background: useCase === uc.id ? 'hsl(var(--accent) / 0.12)' : 'hsl(var(--bg))',
                      color: useCase === uc.id ? 'hsl(var(--text))' : 'hsl(var(--text-secondary))',
                    }}
                  >
                    <UcIcon
                      size={12}
                      style={{
                        color:
                          useCase === uc.id
                            ? 'hsl(var(--accent-light))'
                            : 'hsl(var(--text-tertiary))',
                      }}
                    />
                    {uc.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1" style={{ minWidth: 220 }}>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary">
              AI model
            </div>
            <div className="flex gap-1.5">
              {AI_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiModel(m.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    borderColor: aiModel === m.id ? m.color : 'hsl(var(--border))',
                    background: aiModel === m.id ? `${m.color}15` : 'hsl(var(--bg))',
                    color: aiModel === m.id ? 'hsl(var(--text))' : 'hsl(var(--text-secondary))',
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-3.5">
          <button
            type="button"
            disabled={calling || phone.replace(/\D/g, '').length < 7}
            onClick={() => {
              setCalling(true);
              if (!playing) togglePlay();
              window.setTimeout(() => setCalling(false), 2400);
            }}
            className="inline-flex items-center gap-2 rounded-full border-none px-5 py-3 text-sm font-semibold text-white transition-all"
            style={{
              background: calling
                ? 'hsl(var(--accent-dark))'
                : 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-light)))',
              boxShadow: '0 8px 24px hsl(var(--accent) / 0.35)',
              cursor: phone.replace(/\D/g, '').length < 7 ? 'not-allowed' : 'pointer',
              opacity: phone.replace(/\D/g, '').length < 7 ? 0.6 : 1,
            }}
          >
            {calling ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="50 30"
                    opacity="0.5"
                  />
                </svg>
                Dialing…
              </>
            ) : (
              <>
                <Phone size={14} />
                Call me now <ArrowRight size={14} />
              </>
            )}
          </button>
          <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-text-tertiary">
            <span className="inline-flex items-center gap-1">
              <Shield size={12} /> GDPR safe
            </span>
            <span>·</span>
            <span>One-time demo · we won&apos;t store your number</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   3. SocialProof — marquee logos
   ============================================================ */
type ProofLogo = {
  name: string;
  font: 'sans' | 'serif' | 'mono';
  weight: number;
  ls?: string;
  italic?: boolean;
  mark: React.ReactElement;
};

const PROOF_LOGOS: ProofLogo[] = [
  {
    name: 'Acme Corp', font: 'sans', weight: 800,
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  },
  {
    name: 'Meridian', font: 'serif', weight: 600,
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>,
  },
  {
    name: 'QUANTUM', font: 'mono', weight: 800, ls: '0.15em',
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" fill="currentColor"/><rect x="13" y="13" width="8" height="8" fill="currentColor"/></svg>,
  },
  {
    name: 'nexus.labs', font: 'mono', weight: 500,
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12 L12 3 L21 12 L12 21 Z" stroke="currentColor" strokeWidth="2"/></svg>,
  },
  {
    name: 'Polaris', font: 'serif', weight: 600, italic: true,
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor"/></svg>,
  },
  {
    name: 'ELEVATE', font: 'sans', weight: 800, ls: '0.18em',
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20 L12 4 L20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    name: 'Vertex.io', font: 'sans', weight: 600,
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20 L12 4 L20 20 L4 20 Z M8 14 H16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  },
  {
    name: 'Helio', font: 'sans', weight: 700,
    mark: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6" fill="currentColor"/><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></g></svg>,
  },
];

const FONT_MAP: Record<string, string> = {
  sans: "'Plus Jakarta Sans', sans-serif",
  serif: 'Georgia, serif',
  mono: "'JetBrains Mono', monospace",
};

export function SocialProof() {
  return (
    <section className="relative pt-20 pb-10">
      <p className="mb-9 text-center text-[12.5px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
        Powering 10,000+ teams — from startups to the Fortune 500
      </p>
      <div
        className="marquee-container relative overflow-hidden"
        style={{
          WebkitMaskImage:
            'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
          maskImage:
            'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        }}
      >
        <div className="marquee-track opacity-55">
          {[...PROOF_LOGOS, ...PROOF_LOGOS].map((l, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-text"
            >
              {l.mark}
              <span
                style={{
                  fontFamily: FONT_MAP[l.font],
                  fontWeight: l.weight,
                  letterSpacing: l.ls ?? '-0.02em',
                  fontStyle: l.italic ? 'italic' : 'normal',
                  fontSize: 19,
                }}
              >
                {l.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   4. StatsStrip — 4-column animated counters
   ============================================================ */
const STATS = [
  {
    val: 24,
    suffix: 'M+',
    label: 'Conversations powered',
    sub: 'Across phone, voice, and chat — Q4 2025 alone.',
    tint: 'rgba(37,99,235,0.06)',
  },
  {
    val: 99.94,
    suffix: '%',
    decimals: 2,
    label: 'Platform uptime',
    sub: 'Multi-region, auto-failover infrastructure.',
    tint: 'rgba(34,197,94,0.04)',
  },
  {
    val: 29,
    suffix: '+',
    label: 'Languages supported',
    sub: 'Native ElevenLabs voices in every region.',
    tint: 'rgba(245,158,11,0.04)',
  },
  {
    val: 380,
    prefix: '<',
    suffix: 'ms',
    label: 'Voice latency',
    sub: 'Faster than the average human reaction time.',
    tint: 'rgba(236,72,153,0.04)',
  },
] as const;

export function StatsStrip() {
  return (
    <section className="section-pad relative pb-20 pt-10">
      <BackgroundGrid variant="dot" cellSize={28} />
      <div className="relative z-[1] mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 border-t border-b border-border bg-bg sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="relative overflow-hidden px-7 py-10"
              style={{
                borderRight:
                  i < STATS.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div
                className="pointer-events-none absolute right-[-50px] top-[-50px] h-[200px] w-[200px] rounded-full"
                style={{ background: `radial-gradient(circle, ${s.tint}, transparent 70%)` }}
              />
              <div
                className="relative font-extrabold tracking-[-0.045em]"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 0.95 }}
              >
                {'prefix' in s && s.prefix}
                <AnimatedCounter
                  end={s.val}
                  decimals={'decimals' in s ? s.decimals : 0}
                  suffix=""
                />
                {s.suffix}
              </div>
              <div className="relative mt-2.5 text-sm font-bold text-text">{s.label}</div>
              <div className="relative mt-1 text-[12.5px] leading-[1.5] text-text-tertiary">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   5. Problem — bento grid (4 cards)
   ============================================================ */
const PROBLEMS = [
  {
    Icon: DollarSign,
    title: 'Manual Calling is Expensive',
    desc: 'Human agents cost $25-50/hr with limited throughput. Scaling means linearly growing headcount and overhead.',
    stat: '$4.2M',
    statLabel: 'avg. annual call center cost',
    color: '#EF4444',
  },
  {
    Icon: Gauge,
    title: 'Low Response Rates',
    desc: 'Traditional outreach yields 2-5% connection rates. Most prospects never pick up or respond.',
    stat: '3%',
    statLabel: 'avg. cold call success',
    color: '#F59E0B',
  },
  {
    Icon: Target,
    title: 'Poor Lead Qualification',
    desc: 'Agents waste 70% of their time on unqualified leads with no systematic scoring methodology.',
    stat: '70%',
    statLabel: 'time wasted on bad leads',
    color: '#3B82F6',
  },
  {
    Icon: TrendingUp,
    title: 'No Scalable Outreach',
    desc: "Hitting 10,000+ contacts requires massive teams. There's no way to scale without proportional cost.",
    stat: '10x',
    statLabel: 'cost to scale manually',
    color: '#EC4899',
  },
] as const;

export function ProblemSection() {
  return (
    <section className="section-pad relative py-28">
      <BackgroundGrid variant="dot" cellSize={28} />
      <div className="relative z-[1] mx-auto max-w-[1200px]">
        <SectionHeader
          label="The problem"
          title={
            <>
              Your outreach is{' '}
              <span className="italic font-medium text-accent-light">broken.</span>
            </>
          }
          subtitle="Traditional calling and messaging can't keep up. Here's what it's costing you."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {PROBLEMS.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 80}>
              <CardSpotlight
                color={`${p.color}22`}
                size={350}
                radius={20}
                padding={28}
                style={{ height: '100%' }}
              >
                <div
                  className="pointer-events-none absolute right-0 top-0 h-[200px] w-[200px]"
                  style={{
                    background: `radial-gradient(circle at top right, ${p.color}10, transparent 70%)`,
                  }}
                />
                <div className="relative flex items-start justify-between gap-5">
                  <div className="flex-1">
                    <div
                      className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: `${p.color}15`, color: p.color }}
                    >
                      <p.Icon size={22} />
                    </div>
                    <h3 className="mb-2.5 text-xl font-bold tracking-tight">{p.title}</h3>
                    <p className="text-[15px] leading-[1.7] text-text-secondary">{p.desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className="text-[32px] font-extrabold tracking-[-0.02em]"
                      style={{ color: p.color }}
                    >
                      {p.stat}
                    </div>
                    <div className="max-w-[100px] text-[11px] text-text-tertiary">
                      {p.statLabel}
                    </div>
                  </div>
                </div>
              </CardSpotlight>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   6. Solution — 8 features grid
   ============================================================ */
const SOLUTION_FEATURES = [
  { Icon: Phone, title: 'AI Phone Calls', desc: 'Autonomous outbound and inbound calls with human-like conversation flow.', color: '#22C55E' },
  { Icon: Headphones, title: 'WhatsApp Voice', desc: 'AI-powered voice calls directly through WhatsApp for global reach.', color: '#25D366' },
  { Icon: MessageSquare, title: 'WhatsApp Chat', desc: 'Intelligent chat automation with rich media and quick replies.', color: '#34D399' },
  { Icon: Layers, title: 'Campaign Builder', desc: 'Visual drag-and-drop builder to design multi-step conversation campaigns.', color: '#3B82F6' },
  { Icon: Target, title: 'Lead Qualification', desc: 'AI scores and qualifies leads in real-time during every conversation.', color: '#F59E0B' },
  { Icon: BarChart3, title: 'Analytics', desc: 'Deep insights into call performance, conversion, and sentiment.', color: '#3B82F6' },
  { Icon: Cpu, title: 'Multi AI Providers', desc: 'Switch between OpenAI, Claude, Gemini and more — one platform.', color: '#EC4899' },
  { Icon: Mic, title: 'ElevenLabs Voices', desc: 'Ultra-realistic AI voices in 29+ languages for natural conversations.', color: '#A78BFA' },
] as const;

export function SolutionSection() {
  return (
    <section
      id="features"
      className="section-pad relative py-28"
      style={{
        background:
          'linear-gradient(180deg, hsl(var(--bg)) 0%, hsl(var(--accent) / 0.03) 50%, hsl(var(--bg)) 100%)',
      }}
    >
      <BackgroundGrid variant="grid" cellSize={48} />
      <div className="relative z-[1] mx-auto max-w-[1200px]">
        <SectionHeader
          label="Platform"
          title={
            <>
              Everything you need.
              <br />
              <span className="italic font-medium text-accent-light">
                Nothing you don't.
              </span>
            </>
          }
          subtitle="A unified platform for AI-powered phone calls, WhatsApp voice, and chat — with enterprise-grade controls."
        />
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUTION_FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 40}>
              <CardSpotlight
                color={`${f.color}28`}
                size={260}
                radius={16}
                padding={24}
                style={{ height: '100%' }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}15`, color: f.color }}
                >
                  <f.Icon size={22} />
                </div>
                <h3 className="mb-2 text-base font-bold tracking-tight">{f.title}</h3>
                <p className="text-[13.5px] leading-[1.65] text-text-secondary">{f.desc}</p>
              </CardSpotlight>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   7. ProductShowcase — tabbed dashboard preview
   ============================================================ */
const SHOWCASE_TABS = [
  { label: 'Campaign Builder', Icon: Layers },
  { label: 'Customer Lists', Icon: Users },
  { label: 'Analytics', Icon: BarChart3 },
  { label: 'Call Monitor', Icon: Activity },
] as const;

function ShowcaseCampaignBuilder() {
  const steps = ['Campaign Details', 'AI Provider', 'Voice Selection', 'Questions', 'Lead Scoring', 'Schedule'];
  return (
    <div className="grid min-h-[340px] gap-5 md:grid-cols-[240px_1fr]">
      <div className="flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px]"
            style={{
              background: i === 0 ? 'hsl(var(--accent) / 0.12)' : 'transparent',
              borderColor:
                i === 0 ? 'hsl(var(--accent) / 0.25)' : 'transparent',
              color: i === 0 ? 'hsl(var(--accent-light))' : 'hsl(var(--text-secondary))',
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold"
              style={{
                background:
                  i === 0 ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                color: i === 0 ? '#fff' : 'hsl(var(--text-tertiary))',
              }}
            >
              {i + 1}
            </span>
            {s}
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-bg p-7">
        <div className="mb-6 text-base font-bold">Campaign Details</div>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Campaign Name', value: 'Q4 Enterprise Outreach' },
            { label: 'Objective', value: 'Lead Qualification' },
            { label: 'Channel', value: '' },
          ].map((f) => (
            <div key={f.label}>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
                {f.label}
              </label>
              <div
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm"
                style={{ color: f.value ? 'hsl(var(--text))' : 'hsl(var(--text-tertiary))' }}
              >
                {f.value || 'Select channel...'}
                {f.label === 'Channel' && (
                  <div className="mt-3 flex gap-2">
                    {['Phone Call', 'WhatsApp Voice', 'WhatsApp Chat'].map((ch, j) => (
                      <span
                        key={ch}
                        className="cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-semibold"
                        style={{
                          background: j === 0 ? 'hsl(var(--accent))' : 'hsl(var(--surface-2))',
                          color: j === 0 ? '#fff' : 'hsl(var(--text-secondary))',
                          borderColor: j === 0 ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                        }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShowcaseCustomerLists() {
  const rows = [
    { name: 'Maria Santos', email: 'maria@techcorp.com', phone: '+1 555-0142', status: 'Qualified', score: 'A+' },
    { name: 'James Chen', email: 'j.chen@innovate.io', phone: '+44 20 7946', status: 'Contacted', score: 'B+' },
    { name: 'Aisha Patel', email: 'aisha@growth.co', phone: '+91 98765', status: 'New', score: '—' },
    { name: 'Carlos Rivera', email: 'carlos@scale.mx', phone: '+52 55 1234', status: 'Qualified', score: 'A' },
    { name: 'Emma Wilson', email: 'emma@finserv.uk', phone: '+44 161 234', status: 'Follow Up', score: 'B' },
  ];
  return (
    <div className="min-h-[340px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[13px] text-text-secondary">
            <Search size={14} /> Search customers...
          </div>
          <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-[13px] text-text-secondary">
            Filters
          </div>
        </div>
        <div className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white">
          Import CSV
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] bg-surface-2 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Status</span>
          <span>Score</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.email}
            className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center border-t border-border px-5 py-3.5 text-[13px]"
          >
            <span className="font-semibold">{row.name}</span>
            <span className="text-text-secondary">{row.email}</span>
            <span className="font-mono text-xs text-text-secondary">{row.phone}</span>
            <span>
              <span
                className="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  borderColor:
                    row.status === 'Qualified'
                      ? 'hsl(var(--success) / 0.3)'
                      : row.status === 'New'
                        ? 'hsl(var(--accent-light) / 0.3)'
                        : 'hsl(var(--warning) / 0.3)',
                  background:
                    row.status === 'Qualified'
                      ? 'hsl(var(--success) / 0.1)'
                      : row.status === 'New'
                        ? 'hsl(var(--accent-light) / 0.1)'
                        : 'hsl(var(--warning) / 0.1)',
                  color:
                    row.status === 'Qualified'
                      ? 'hsl(var(--success))'
                      : row.status === 'New'
                        ? 'hsl(var(--accent-light))'
                        : 'hsl(var(--warning))',
                }}
              >
                {row.status}
              </span>
            </span>
            <span
              className="font-bold"
              style={{
                color: row.score.startsWith('A')
                  ? 'hsl(var(--success))'
                  : 'hsl(var(--text-secondary))',
              }}
            >
              {row.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShowcaseAnalytics() {
  const stats = [
    { label: 'Total Calls', value: '24,892', change: '+18%' },
    { label: 'Connected', value: '67.4%', change: '+5.2%' },
    { label: 'Avg. Duration', value: '3:42', change: '+0:28' },
    { label: 'Conversion', value: '34.2%', change: '+12%' },
  ];
  const week = [65, 78, 45, 89, 92, 76, 95];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="min-h-[340px]">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-bg p-4">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-text-tertiary">
              {s.label}
            </div>
            <div className="text-2xl font-extrabold tracking-[-0.02em]">{s.value}</div>
            <div className="text-xs font-semibold text-success">↑ {s.change}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-bg p-5">
        <div className="mb-4 text-[13px] font-semibold">Weekly Performance</div>
        <div className="flex h-[140px] items-end gap-2">
          {week.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${v}%`,
                  background:
                    i === 6 ? 'hsl(var(--accent))' : 'hsl(var(--accent) / 0.25)',
                }}
              />
              <span className="text-[10px] text-text-tertiary">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShowcaseCallMonitor() {
  const active = [
    { name: 'Maria Santos', channel: 'Phone', duration: '2:34', sentiment: 'positive' as const },
    { name: 'James Chen', channel: 'WhatsApp Voice', duration: '1:12', sentiment: 'neutral' as const },
    { name: 'Aisha Patel', channel: 'WhatsApp Chat', duration: '5:01', sentiment: 'positive' as const },
  ];
  const transcript = [
    { role: 'AI', text: 'Hi Maria, thanks for your interest in our enterprise plan. Can I walk you through the key features?', accent: true },
    { role: 'Maria', text: "Yes please, I'm particularly interested in the API integration capabilities.", accent: false },
    { role: 'AI', text: 'Great question! We offer RESTful APIs with webhooks for real-time events...', accent: true },
  ];
  return (
    <div className="grid min-h-[340px] gap-4 md:grid-cols-2">
      <div>
        <div className="mb-3 text-[13px] font-semibold">Active Conversations</div>
        {active.map((c) => (
          <div
            key={c.name}
            className="mb-2 flex items-center justify-between rounded-xl border border-border bg-bg p-3.5"
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 flex gap-2 text-xs text-text-tertiary">
                <span>{c.channel}</span>
                <span>•</span>
                <span>{c.duration}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    c.sentiment === 'positive'
                      ? 'hsl(var(--success))'
                      : 'hsl(var(--warning))',
                  animation: 'pulseSoft 2s infinite',
                }}
              />
              <span
                className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize"
                style={{
                  background:
                    c.sentiment === 'positive'
                      ? 'hsl(var(--success) / 0.1)'
                      : 'hsl(var(--warning) / 0.1)',
                  borderColor:
                    c.sentiment === 'positive'
                      ? 'hsl(var(--success) / 0.3)'
                      : 'hsl(var(--warning) / 0.3)',
                  color:
                    c.sentiment === 'positive'
                      ? 'hsl(var(--success))'
                      : 'hsl(var(--warning))',
                }}
              >
                {c.sentiment}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-bg p-4">
        <div className="mb-3 text-[13px] font-semibold">Live Transcript — Maria Santos</div>
        <div className="flex flex-col gap-2.5 text-[13px]">
          {transcript.map((m, i) => (
            <div key={i} className="flex gap-2.5">
              <span
                className="mt-0.5 min-w-[36px] shrink-0 text-[11px] font-bold"
                style={{
                  color: m.accent ? 'hsl(var(--accent-light))' : 'hsl(var(--success))',
                }}
              >
                {m.role}
              </span>
              <span className="leading-[1.6] text-text-secondary">{m.text}</span>
            </div>
          ))}
        </div>
        <Waveform bars={24} height={32} className="mt-4" />
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const [active, setActive] = useState(0);
  return (
    <section className="section-pad py-28">
      <SectionHeader
        label="Product"
        title="See it in action"
        subtitle="A powerful dashboard built for modern sales and support teams."
      />
      <ScrollReveal>
        <div className="mx-auto max-w-[1200px]">
          <div
            className="overflow-hidden rounded-3xl border border-border bg-surface"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
          >
            <div className="flex border-b border-border bg-[hsl(var(--hover-overlay))] px-2">
              {SHOWCASE_TABS.map((t, i) => {
                const Icon = t.Icon;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setActive(i)}
                    className="flex items-center gap-2 px-6 py-4 text-[13px] font-semibold"
                    style={{
                      color: active === i ? 'hsl(var(--text))' : 'hsl(var(--text-tertiary))',
                      borderBottom:
                        active === i
                          ? '2px solid hsl(var(--accent))'
                          : '2px solid transparent',
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color:
                          active === i ? 'hsl(var(--accent-light))' : 'hsl(var(--text-tertiary))',
                      }}
                    />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="p-7">
              {active === 0 && <ShowcaseCampaignBuilder />}
              {active === 1 && <ShowcaseCustomerLists />}
              {active === 2 && <ShowcaseAnalytics />}
              {active === 3 && <ShowcaseCallMonitor />}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ============================================================
   8. ChannelsSection (Phone / WA Voice / WA Chat / Hybrid)
   ============================================================ */
function PhoneMockup({ active }: { active: boolean }) {
  return (
    <div
      className="relative mx-auto h-[540px] w-[280px] overflow-hidden border-[8px] border-[#1a1a1c] bg-[#0a0a0a]"
      style={{ borderRadius: 42, boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
    >
      <div
        className="absolute left-1/2 top-0 z-[2] h-6 w-[100px] -translate-x-1/2 bg-black"
        style={{ borderRadius: '0 0 16px 16px' }}
      />
      <div
        className="absolute inset-0 flex flex-col items-center px-5 pb-5 pt-[60px]"
        style={{ background: 'linear-gradient(180deg, #1a1f2e 0%, #0e0e16 100%)' }}
      >
        <div className="mb-1 text-[11px] tracking-wide text-white/50">
          Outgoing call · WhatsApp
        </div>
        <div className="mb-0.5 text-xl font-semibold tracking-tight text-white">
          Maria Santos
        </div>
        <div className="mb-7 font-mono text-[13px] text-white/50">+1 555-0142</div>
        <div
          className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #2563EB, #EC4899, #F59E0B)',
            boxShadow: active ? '0 0 60px rgba(37,99,235,0.5)' : 'none',
            transition: 'box-shadow 0.5s',
          }}
        >
          <div
            className="absolute rounded-full border-2 border-[rgba(37,99,235,0.3)]"
            style={{
              inset: -8,
              animation: active ? 'glowPulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <div className="text-[42px] font-extrabold text-white">M</div>
        </div>
        <div className="mt-7 mb-1 text-sm text-white/70">
          {active ? 'Connected · 02:34' : 'Ringing...'}
        </div>
        <div className="mt-3 w-[200px]">
          <Waveform
            bars={32}
            height={32}
            active={active}
            color="#2563EB"
            className="mx-auto"
          />
        </div>
        <div className="mt-auto flex gap-5 pt-6">
          {[
            { bg: 'rgba(255,255,255,0.15)' },
            { bg: 'rgba(255,255,255,0.15)' },
            { bg: '#EF4444' },
          ].map((b, i) => (
            <div
              key={i}
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: b.bg }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhatsAppMockup({ active }: { active: boolean }) {
  const messages = [
    { side: 'in' as const, text: 'Hi James! Sofia here from VoiceFlow AI. Saw you downloaded our enterprise case study — quick question on rollout?' },
    { side: 'out' as const, text: 'Hey, yes! How long does setup typically take for a team our size (~150 reps)?' },
    { side: 'in' as const, text: 'Most teams your size launch their first campaign in under a day. CRM integration ships day one.' },
    { side: 'out' as const, text: 'Perfect. Can you share pricing for unlimited conversations?' },
    { side: 'in' as const, text: 'Sending you a tailored quote now — also pre-booked Thursday 2pm for your CTO to meet our solutions team.' },
  ];
  return (
    <div
      className="relative mx-auto h-[540px] w-[280px] overflow-hidden border-[8px] border-[#1a1a1c] bg-[#0a0a0a]"
      style={{ borderRadius: 42, boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
    >
      <div
        className="absolute left-1/2 top-0 z-[2] h-6 w-[100px] -translate-x-1/2 bg-black"
        style={{ borderRadius: '0 0 16px 16px' }}
      />
      <div className="flex items-center gap-2.5 bg-[#075E54] px-3 pb-2.5 pt-[34px]">
        <div
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: 'radial-gradient(circle at 30% 30%, #34D399, #25D366)' }}
        >
          S
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-white">Sofia — VoiceFlow</div>
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <span className="h-[5px] w-[5px] rounded-full bg-[#22C55E]" /> AI assistant ·
            online
          </div>
        </div>
      </div>
      <div
        className="absolute left-0 right-0 flex flex-col gap-1.5 overflow-hidden px-2.5 py-3"
        style={{ top: 84, bottom: 60, background: '#0d1418' }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[80%] px-2.5 py-1.5 text-[11.5px] leading-[1.4] text-[#e9edef]"
            style={{
              alignSelf: m.side === 'in' ? 'flex-start' : 'flex-end',
              background: m.side === 'in' ? '#1f2c33' : '#005c4b',
              borderRadius: 10,
              borderTopLeftRadius: m.side === 'in' ? 4 : 10,
              borderTopRightRadius: m.side === 'out' ? 4 : 10,
              opacity: active ? 1 : i < 2 ? 1 : 0.25,
              transform: active ? 'translateY(0)' : 'translateY(4px)',
              transition: `opacity 0.4s ease ${i * 0.4}s, transform 0.4s ease ${i * 0.4}s`,
            }}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-[#1f2c33] p-2.5">
        <div className="flex-1 rounded-full bg-[#2a3942] px-3 py-2 text-[11px] text-white/40">
          Type a message
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884]">
          <Mic size={14} color="#fff" />
        </div>
      </div>
    </div>
  );
}

function HybridDiagram({ active }: { active: boolean }) {
  const endpoints = [
    { label: 'Phone', emoji: '📞', color: '#2563EB', angle: 0 },
    { label: 'WA Voice', emoji: '🎙️', color: '#25D366', angle: 120 },
    { label: 'WA Chat', emoji: '💬', color: '#34D399', angle: 240 },
  ];
  return (
    <div className="flex h-[540px] w-full items-center justify-center">
      <svg viewBox="0 0 360 360" width="360" height="360" className="max-w-[90%]">
        <defs>
          <radialGradient id="hyb-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </radialGradient>
        </defs>
        {endpoints.map((e, i) => {
          const rad = ((e.angle - 90) * Math.PI) / 180;
          const x = 180 + Math.cos(rad) * 130;
          const y = 180 + Math.sin(rad) * 130;
          return (
            <line
              key={`l-${i}`}
              x1="180"
              y1="180"
              x2={x}
              y2={y}
              stroke="hsl(var(--border-light))"
              strokeWidth="1"
              strokeDasharray={active ? '0' : '4 4'}
              style={{ opacity: active ? 0.6 : 0.25, transition: 'opacity 0.5s' }}
            />
          );
        })}
        <circle cx="180" cy="180" r="90" fill="url(#hyb-core)" />
        <circle
          cx="180"
          cy="180"
          r="36"
          fill="hsl(var(--accent))"
          stroke="hsl(var(--accent-light))"
          strokeWidth="2"
        />
        <text
          x="180"
          y="178"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="700"
          letterSpacing="1"
        >
          AI
        </text>
        <text
          x="180"
          y="190"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="700"
          letterSpacing="1"
        >
          ROUTER
        </text>
        {endpoints.map((n, i) => {
          const rad = ((n.angle - 90) * Math.PI) / 180;
          const x = 180 + Math.cos(rad) * 130;
          const y = 180 + Math.sin(rad) * 130;
          return (
            <g key={`e-${i}`}>
              <circle cx={x} cy={y} r="32" fill="hsl(var(--surface))" stroke={n.color} strokeWidth="2" />
              <text x={x} y={y - 3} textAnchor="middle" fontSize="16">
                {n.emoji}
              </text>
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                fill="hsl(var(--text-secondary))"
                fontSize="9"
                fontWeight="600"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const CHANNEL_TABS = [
  {
    label: 'Phone Calls',
    Icon: Phone,
    color: '#2563EB',
    title: 'AI voice calls that sound human.',
    desc:
      'Outbound and inbound calls with sub-400ms latency, real-time transcription, and emotion-aware speech synthesis.',
    bullets: [
      'Sub-400ms response time end-to-end',
      'Natural turn-taking + interruption handling',
      'Auto-handoff to human on detected intent',
      'Call recording, transcripts, and analytics',
    ],
    stat: { val: '67.4%', label: 'avg. answer rate' },
  },
  {
    label: 'WhatsApp Voice',
    Icon: Headphones,
    color: '#25D366',
    title: 'Voice calls — global. No SIM needed.',
    desc:
      'Reach 2B+ WhatsApp users worldwide with AI voice calls, end-to-end encrypted, no telco infrastructure required.',
    bullets: [
      'Free worldwide reach via WhatsApp Cloud',
      'Same AI brain, same voice profile',
      'Voice → chat handoff inside the conversation',
      'GDPR & SOC 2 compliant',
    ],
    stat: { val: '2B+', label: 'reachable users' },
  },
  {
    label: 'WhatsApp Chat',
    Icon: MessageSquare,
    color: '#34D399',
    title: 'Conversations that close in chat.',
    desc:
      'Rich-media AI chat with buttons, documents, and inline payments — fully automated yet feels like a top SDR.',
    bullets: [
      'Quick reply buttons & list selectors',
      'Document, image, location sharing',
      'Persistent conversation memory',
      'Auto-translate across 29+ languages',
    ],
    stat: { val: '91%', label: 'open rate' },
  },
  {
    label: 'Hybrid Routing',
    Icon: GitBranch,
    color: '#3B82F6',
    title: 'One agent. Three channels. Same memory.',
    desc:
      'The AI picks the channel a prospect is most likely to engage on — then hands off seamlessly when they switch.',
    bullets: [
      'Intelligent channel selection',
      'Automatic failover (call missed → WhatsApp)',
      'Single unified conversation history',
      'Per-region channel preferences',
    ],
    stat: { val: '3×', label: 'higher engagement' },
  },
] as const;

export function ChannelsSection() {
  const [tab, setTab] = useState(0);
  const t = CHANNEL_TABS[tab] as (typeof CHANNEL_TABS)[number];
  const mockup =
    tab === 0 ? (
      <PhoneMockup active />
    ) : tab === 1 ? (
      <PhoneMockup active />
    ) : tab === 2 ? (
      <WhatsAppMockup active />
    ) : (
      <HybridDiagram active />
    );
  return (
    <section id="channels" className="section-pad relative py-28">
      <div className="mx-auto mb-14 max-w-[1200px] text-center">
        <SectionHeader
          label="Channels"
          title={
            <>
              One AI agent.
              <br />
              <span className="italic font-medium text-accent-light">
                Every channel your customers use.
              </span>
            </>
          }
          subtitle="Phone, WhatsApp Voice, and WhatsApp Chat — all powered by the same AI brain with shared conversation memory."
          className="!mb-0"
        />
      </div>
      <div className="mb-10 flex flex-wrap justify-center gap-1.5 px-4">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1.5">
          {CHANNEL_TABS.map((ch, i) => {
            const Icon = ch.Icon;
            const isActive = tab === i;
            return (
              <button
                key={ch.label}
                type="button"
                onClick={() => setTab(i)}
                className="flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-all"
                style={{
                  background: isActive ? 'hsl(var(--bg))' : 'transparent',
                  color: isActive ? 'hsl(var(--text))' : 'hsl(var(--text-tertiary))',
                  border: isActive
                    ? '1px solid hsl(var(--border-light))'
                    : '1px solid transparent',
                  boxShadow: isActive
                    ? `0 0 0 1px ${ch.color}22, 0 4px 12px rgba(0,0,0,0.15)`
                    : 'none',
                }}
              >
                <Icon
                  size={14}
                  style={{ color: isActive ? ch.color : 'hsl(var(--text-tertiary))' }}
                />
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
        <div key={`info-${tab}`} style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11.5px] font-semibold"
            style={{
              background: `${t.color}12`,
              borderColor: `${t.color}30`,
              color: t.color,
            }}
          >
            <t.Icon size={13} /> {t.label}
          </div>
          <h3
            className="mb-4 font-bold leading-[1.15] tracking-[-0.025em]"
            style={{ fontSize: 'clamp(28px, 3vw, 38px)' }}
          >
            {t.title}
          </h3>
          <p className="mb-6 text-base leading-[1.7] text-text-secondary">{t.desc}</p>
          <div className="mb-7 flex flex-col gap-3">
            {t.bullets.map((b) => (
              <div key={b} className="flex items-center gap-2.5 text-sm text-text">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${t.color}15`, color: t.color }}
                >
                  <Check size={12} />
                </span>
                {b}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 rounded-2xl border border-border bg-surface px-6 py-5">
            <div>
              <div
                className="text-[36px] font-extrabold leading-none tracking-[-0.02em] tabular-nums"
                style={{ color: t.color }}
              >
                {t.stat.val}
              </div>
              <div className="mt-1 text-xs text-text-tertiary">{t.stat.label}</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <Link
              to="/signup"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-accent-light"
            >
              Try {t.label} <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <div
          key={`mockup-${tab}`}
          className="flex justify-center"
          style={{ animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {mockup}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   9. HowItWorks — 4 steps
   ============================================================ */
const HOW_STEPS = [
  { num: '01', Icon: Upload, title: 'Upload customers', desc: 'Import via CSV or sync your CRM. We deduplicate, validate, and enrich automatically.', color: '#3B82F6' },
  { num: '02', Icon: Layers, title: 'Build campaign', desc: 'Pick a channel, choose an AI model and voice, define questions and lead scoring rules.', color: '#3B82F6' },
  { num: '03', Icon: Zap, title: 'AI runs the show', desc: 'Your AI agents call, message, qualify leads, book meetings — all without human input.', color: '#F59E0B' },
  { num: '04', Icon: Eye, title: 'Watch it convert', desc: 'Monitor live conversations, review transcripts, and export qualified leads to your CRM.', color: '#22C55E' },
] as const;

export function HowItWorks() {
  return (
    <section className="section-pad relative py-28">
      <SectionHeader
        label="Process"
        title={
          <>
            Zero to live
            <br />
            <span className="italic font-medium text-accent-light">
              in under 10 minutes.
            </span>
          </>
        }
        subtitle="No code, no infrastructure, no telecom setup. Just import, configure, launch."
      />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((s, i) => (
            <div
              key={s.num}
              className="relative z-[1] overflow-hidden rounded-2xl border border-border bg-surface px-6 py-7 transition-all hover:-translate-y-1 hover:border-border-light"
              style={{
                transition:
                  'transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, box-shadow 0.3s',
              }}
            >
              <div
                className="pointer-events-none absolute right-[-40px] top-[-40px] h-[160px] w-[160px] rounded-full"
                style={{
                  background: `radial-gradient(circle, ${s.color}15, transparent 70%)`,
                }}
              />
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full border px-2.5 py-1"
                style={{
                  background: `${s.color}10`,
                  borderColor: `${s.color}25`,
                }}
              >
                <span
                  className="font-mono text-[10px] font-bold tracking-[0.08em]"
                  style={{ color: s.color }}
                >
                  STEP {s.num}
                </span>
              </div>
              <div
                className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                <s.Icon size={24} />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="text-sm leading-[1.65] text-text-secondary">{s.desc}</p>
              {i < HOW_STEPS.length - 1 && (
                <div className="hidden lg:flex absolute right-[-18px] top-1/2 z-[3] h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg text-text-tertiary">
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 text-center">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
          style={{ boxShadow: '0 4px 16px hsl(var(--accent) / 0.35)' }}
        >
          Try it free <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

/* ============================================================
   10. AIProviders
   ============================================================ */
const PROVIDERS = [
  { name: 'OpenAI', model: 'GPT-4o', desc: 'Industry-leading language model with superior reasoning and instruction following.', color: '#10A37F', initial: 'O' },
  { name: 'Anthropic Claude', model: 'Claude 3.5', desc: 'Advanced AI with exceptional nuance, safety, and long-context understanding.', color: '#D4A574', initial: 'C' },
  { name: 'Google Gemini', model: 'Gemini Pro', desc: 'Multimodal AI with strong multilingual capabilities and fast inference.', color: '#4285F4', initial: 'G' },
  { name: 'OpenRouter', model: 'Multi-model', desc: 'Access dozens of models through a unified API with automatic fallbacks.', color: '#FF6B35', initial: 'R' },
] as const;

export function AIProviders() {
  return (
    <section className="section-pad relative py-28">
      <BackgroundGrid variant="dot" cellSize={32} />
      <div className="relative z-[1] mx-auto max-w-[1200px]">
        <SectionHeader
          label="AI Models"
          title={
            <>
              Pick your model.
              <br />
              <span className="italic font-medium text-accent-light">
                Or change it anytime.
              </span>
            </>
          }
          subtitle="Switch between the world's leading AI models with zero code changes. Pay only for what you use."
        />
        <div className="mx-auto grid max-w-[1000px] gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((p, i) => (
            <ScrollReveal key={p.name} delay={i * 60}>
              <CardSpotlight
                color={`${p.color}28`}
                size={300}
                radius={18}
                padding={28}
                style={{ height: '100%', textAlign: 'center' }}
              >
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl font-extrabold"
                  style={{
                    background: `${p.color}15`,
                    borderColor: `${p.color}25`,
                    color: p.color,
                  }}
                >
                  {p.initial}
                </div>
                <h3 className="mb-1 text-[17px] font-bold">{p.name}</h3>
                <div className="mb-3 text-xs font-semibold" style={{ color: p.color }}>
                  {p.model}
                </div>
                <p className="text-[13px] leading-[1.7] text-text-secondary">{p.desc}</p>
              </CardSpotlight>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   11. VoiceSection — voice signature cards
   ============================================================ */
const VOICES = [
  { name: 'Sofia', lang: 'English (US)', accent: 'Professional', gender: 'F', gradient: ['#EC4899', '#F472B6', '#FBBF24'] },
  { name: 'Marcus', lang: 'English (UK)', accent: 'Conversational', gender: 'M', gradient: ['#3B82F6', '#06B6D4', '#10B981'] },
  { name: 'Isabella', lang: 'Spanish', accent: 'Warm', gender: 'F', gradient: ['#F59E0B', '#EF4444', '#F472B6'] },
  { name: 'Kenji', lang: 'Japanese', accent: 'Formal', gender: 'M', gradient: ['#22C55E', '#06B6D4', '#2563EB'] },
  { name: 'Amara', lang: 'French', accent: 'Friendly', gender: 'F', gradient: ['#3B82F6', '#EC4899', '#F472B6'] },
  { name: 'Liam', lang: 'German', accent: 'Clear', gender: 'M', gradient: ['#14B8A6', '#06B6D4', '#3B82F6'] },
  { name: 'Priya', lang: 'Hindi', accent: 'Warm', gender: 'F', gradient: ['#F472B6', '#A78BFA', '#2563EB'] },
  { name: 'Lucas', lang: 'Portuguese', accent: 'Energetic', gender: 'M', gradient: ['#06B6D4', '#10B981', '#FBBF24'] },
] as const;

function VoiceCard({
  voice,
  playing,
  onPlay,
}: {
  voice: (typeof VOICES)[number];
  playing: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="cursor-pointer overflow-hidden rounded-3xl border bg-surface p-6 text-left transition-all"
      style={{
        borderColor: playing ? `${voice.gradient[0]}50` : 'hsl(var(--border))',
        transform: playing ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: playing
          ? `0 16px 48px ${voice.gradient[0]}20`
          : '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="voice-blob relative mb-4 w-full overflow-hidden rounded-2xl"
        style={{
          aspectRatio: '1',
          background: `radial-gradient(circle at 30% 30%, ${voice.gradient[0]}, ${voice.gradient[1]} 60%, ${voice.gradient[2]} 100%)`,
          boxShadow: playing
            ? `inset 0 0 80px ${voice.gradient[0]}, 0 0 40px ${voice.gradient[0]}40`
            : `inset 0 0 40px ${voice.gradient[0]}50`,
          transition: 'box-shadow 0.5s',
        }}
      >
        <div className="absolute inset-0 z-[2] flex items-center justify-center">
          <div
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/95 text-[#09090B] transition-transform"
            style={{
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              transform: playing ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginLeft: 2 }}
              >
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            )}
          </div>
        </div>
        {playing && (
          <div className="absolute bottom-3.5 left-3.5 right-3.5 z-[2]">
            <Waveform bars={24} height={20} color="#fff" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[17px] font-bold tracking-tight">{voice.name}</div>
          <div className="mt-0.5 text-xs text-text-tertiary">
            {voice.lang} · {voice.accent}
          </div>
        </div>
        <span
          className="rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold"
          style={{
            color: voice.gradient[0],
            borderColor: `${voice.gradient[0]}30`,
            background: `${voice.gradient[0]}10`,
          }}
        >
          {voice.gender}
        </span>
      </div>
    </button>
  );
}

export function VoiceSection() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  useEffect(() => {
    if (activeIdx === null) return;
    const t = window.setTimeout(() => setActiveIdx(null), 4500);
    return () => window.clearTimeout(t);
  }, [activeIdx]);
  const voiceStats = [
    { val: '29+', label: 'Languages', sub: 'Native speakers' },
    { val: '50+', label: 'Voice styles', sub: 'Pre-built profiles' },
    { val: '<400', label: 'Latency (ms)', sub: 'End-to-end' },
    { val: '∞', label: 'Custom voices', sub: 'Clone any voice' },
  ];
  return (
    <section className="section-pad relative py-28">
      <div className="mx-auto mb-14 max-w-[1200px] text-center">
        <SectionHeader
          label="Voice Library"
          title={
            <>
              Voices{' '}
              <span className="gradient-flow italic font-medium">
                indistinguishable
              </span>
              <br />
              from humans.
            </>
          }
          subtitle="ElevenLabs-powered AI voices in 29+ languages with natural intonation, breathing patterns, and emotional range. Click any signature to preview."
          className="!mb-0"
        />
      </div>
      <div className="mx-auto grid max-w-[1200px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VOICES.map((v, i) => (
          <VoiceCard
            key={v.name}
            voice={v}
            playing={activeIdx === i}
            onPlay={() => setActiveIdx((cur) => (cur === i ? null : i))}
          />
        ))}
      </div>
      <div className="mx-auto mt-14 grid max-w-[1000px] grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-4">
        {voiceStats.map((s) => (
          <div key={s.label} className="bg-surface px-5 py-6 text-center">
            <div
              className="text-3xl font-extrabold tracking-[-0.025em]"
              style={{
                background:
                  'linear-gradient(180deg, hsl(var(--text)), hsl(var(--accent-light)))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {s.val}
            </div>
            <div className="mt-1 text-[13px] font-semibold">{s.label}</div>
            <div className="mt-0.5 text-[11.5px] text-text-tertiary">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   12. AnalyticsPreview
   ============================================================ */
export function AnalyticsPreview() {
  const metrics = [
    { label: 'Connected Calls', value: 18420, suffix: '', Icon: Phone, color: '#22C55E', change: '+24%' },
    { label: 'Avg. Lead Score', value: 8.4, suffix: '/10', Icon: Target, color: '#F59E0B', decimals: 1, change: '+1.2' },
    { label: 'Conversion Rate', value: 34.2, suffix: '%', Icon: TrendingUp, color: '#3B82F6', decimals: 1, change: '+12%' },
    { label: 'Positive Sentiment', value: 89, suffix: '%', Icon: Heart, color: '#EC4899', change: '+8%' },
  ];
  const channels = [
    { channel: 'Phone Calls', calls: 8420, connected: '72%', conversion: '38%', bar: 85 },
    { channel: 'WhatsApp Voice', calls: 5200, connected: '65%', conversion: '32%', bar: 65 },
    { channel: 'WhatsApp Chat', calls: 4800, connected: '91%', conversion: '28%', bar: 55 },
  ];
  return (
    <section className="section-pad py-28">
      <SectionHeader
        label="Analytics"
        title="Insights that drive decisions"
        subtitle="Executive-level analytics with real-time dashboards, channel comparison, and conversion attribution."
      />
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <ScrollReveal key={m.label} delay={i * 80}>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${m.color}10`, color: m.color }}
                  >
                    <m.Icon size={20} />
                  </div>
                  <span className="text-xs font-semibold text-success">↑ {m.change}</span>
                </div>
                <div className="mb-1 text-[32px] font-extrabold tracking-[-0.03em]">
                  <AnimatedCounter end={m.value} decimals={m.decimals ?? 0} />
                  {m.suffix}
                </div>
                <div className="text-[13px] text-text-secondary">{m.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={200}>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-7 py-5">
              <div className="text-base font-bold">Channel Performance</div>
              <div className="flex gap-2">
                {['7D', '30D', '90D'].map((p, i) => (
                  <span
                    key={p}
                    className="rounded-md border px-3 py-1 text-xs font-semibold"
                    style={{
                      background: i === 1 ? 'hsl(var(--accent))' : 'hsl(var(--surface-2))',
                      borderColor: i === 1 ? 'transparent' : 'hsl(var(--border))',
                      color: i === 1 ? '#fff' : 'hsl(var(--text-secondary))',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-7 py-7">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_3fr] gap-4 border-b border-border pb-3 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                <span>Channel</span>
                <span>Total</span>
                <span>Connected</span>
                <span>Conversion</span>
                <span>Performance</span>
              </div>
              {channels.map((c, i) => (
                <div
                  key={c.channel}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_3fr] items-center gap-4 py-3.5"
                  style={{
                    borderBottom:
                      i < channels.length - 1
                        ? '1px solid hsl(var(--border) / 0.5)'
                        : 'none',
                  }}
                >
                  <span className="text-sm font-semibold">{c.channel}</span>
                  <span className="font-mono text-sm text-text-secondary">
                    {c.calls.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold">{c.connected}</span>
                  <span className="text-sm font-semibold text-success">{c.conversion}</span>
                  <div className="h-2 overflow-hidden rounded bg-surface-2">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${c.bar}%`,
                        background:
                          'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent-light)))',
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ============================================================
   13. Testimonials
   ============================================================ */
const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'VP of Sales',
    company: 'TechScale Inc.',
    quote:
      'VoiceFlow AI transformed our outreach. We went from 200 manual calls a day to 10,000 AI conversations — with better conversion rates than our human team.',
    result: '340% increase in qualified leads',
    initials: 'SM',
    color: '#EC4899',
  },
  {
    name: 'David Park',
    role: 'Head of Growth',
    company: 'Meridian Finance',
    quote:
      'The WhatsApp integration alone paid for itself in week one. Our customers in LATAM and Asia now get instant, personalized conversations in their language.',
    result: '52% faster response time',
    initials: 'DP',
    color: '#3B82F6',
  },
  {
    name: 'Priya Sharma',
    role: 'COO',
    company: 'GlobalReach',
    quote:
      'We evaluated every AI calling platform on the market. VoiceFlow AI was the only one that delivered true enterprise-grade security with multi-provider flexibility.',
    result: '89% customer satisfaction',
    initials: 'PS',
    color: '#22C55E',
  },
] as const;

function TestimonialCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <CardSpotlight
      color={`${t.color}25`}
      size={350}
      radius={20}
      padding={32}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div className="mb-5 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={16} fill="#F59E0B" stroke="none" />
        ))}
      </div>
      <p className="mb-6 flex-1 text-[15px] leading-[1.8] text-text-secondary">
        "{t.quote}"
      </p>
      <div
        className="mb-5 rounded-xl border px-4 py-3.5 text-[13px] font-semibold"
        style={{
          background: `${t.color}08`,
          borderColor: `${t.color}15`,
          color: t.color,
        }}
      >
        ↑ {t.result}
      </div>
      <div className="flex items-center gap-3 border-t border-border pt-5">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }}
        >
          {t.initials}
        </div>
        <div>
          <div className="text-sm font-bold">{t.name}</div>
          <div className="text-xs text-text-tertiary">
            {t.role}, {t.company}
          </div>
        </div>
      </div>
    </CardSpotlight>
  );
}

export function Testimonials() {
  return (
    <section className="section-pad relative py-28">
      <div className="relative z-[1] mx-auto max-w-[1200px]">
        <SectionHeader
          label="Testimonials"
          title={
            <>
              Trusted by teams
              <br />
              <span className="italic font-medium text-accent-light">
                who hit their numbers.
              </span>
            </>
          }
          subtitle="See why growth leaders at fast-moving companies pick VoiceFlow AI."
        />
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 80} style={{ height: '100%' }}>
              {i === 1 ? (
                <MovingBorder
                  radius={20}
                  borderWidth={1}
                  duration={8}
                  color1={t.color}
                  color2="#2563EB"
                  style={{ height: '100%' }}
                >
                  <TestimonialCard t={t} />
                </MovingBorder>
              ) : (
                <TestimonialCard t={t} />
              )}
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   14. Pricing
   ============================================================ */
type Plan = {
  name: string;
  desc: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
  custom?: boolean;
  monthly?: number;
  annual?: number;
};
const PLANS: Plan[] = [
  {
    name: 'Starter',
    monthly: 99,
    annual: 79,
    desc: 'For small teams getting started with AI conversations.',
    features: [
      '500 AI conversations/mo',
      '1 campaign',
      'Phone calls only',
      'OpenAI GPT-4o',
      '2 voice profiles',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Professional',
    monthly: 349,
    annual: 279,
    desc: 'For growing teams that need multi-channel reach.',
    features: [
      '5,000 AI conversations/mo',
      'Unlimited campaigns',
      'All channels',
      'All AI providers',
      '10 voice profiles',
      'Advanced analytics',
      'Priority support',
      'CRM integrations',
      'Custom lead scoring',
    ],
    cta: 'Start free trial',
    highlight: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    custom: true,
    desc: 'For organizations with advanced security and scale needs.',
    features: [
      'Unlimited conversations',
      'Unlimited everything',
      'All channels + SIP',
      'All AI providers',
      'Custom voices',
      'Executive dashboards',
      'Dedicated CSM',
      'SSO & SAML',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact sales',
    highlight: false,
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  return (
    <section id="pricing" className="section-pad relative py-28">
      <div
        className="pointer-events-none absolute z-0"
        style={{
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 400,
          background:
            'radial-gradient(ellipse, hsl(var(--accent) / 0.18), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div className="relative z-[1] mx-auto mb-14 max-w-[680px] text-center">
        <SectionHeader
          label="Pricing"
          title={
            <>
              Simple,{' '}
              <span className="italic font-medium text-accent-light">scales with you.</span>
            </>
          }
          subtitle="Start free. Pay only for what you use. No long-term contracts."
          className="!mb-8"
        />
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          {(['monthly', 'annual'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setBilling(opt)}
              className="flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-semibold transition-all"
              style={{
                color: billing === opt ? 'hsl(var(--text))' : 'hsl(var(--text-tertiary))',
                background: billing === opt ? 'hsl(var(--accent))' : 'transparent',
                boxShadow:
                  billing === opt ? '0 4px 12px hsl(var(--accent) / 0.35)' : 'none',
              }}
            >
              {opt === 'monthly' ? 'Monthly' : 'Annual'}
              {opt === 'annual' && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background:
                      billing === 'annual'
                        ? 'rgba(255,255,255,0.2)'
                        : 'hsl(var(--success) / 0.15)',
                    color: billing === 'annual' ? '#fff' : 'hsl(var(--success))',
                  }}
                >
                  Save 20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="relative z-[1] mx-auto grid max-w-[1100px] items-start gap-5 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCustom = Boolean(p.custom);
          const monthly = p.monthly ?? 0;
          const annual = p.annual ?? 0;
          const price = isCustom ? null : billing === 'annual' ? annual : monthly;
          const highlight = Boolean(p.highlight);
          const cardInner = (
            <div
              className="relative h-full overflow-hidden rounded-3xl bg-surface p-9 transition-transform hover:-translate-y-1"
              style={{
                border: highlight
                  ? '1px solid transparent'
                  : '1px solid hsl(var(--border))',
                boxShadow: highlight
                  ? '0 0 60px hsl(var(--accent) / 0.12), 0 16px 48px rgba(0,0,0,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              {p.badge && (
                <span
                  className="absolute right-4 top-4 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: 'hsl(var(--accent-light) / 0.1)',
                    borderColor: 'hsl(var(--accent-light) / 0.3)',
                    color: 'hsl(var(--accent-light))',
                  }}
                >
                  {p.badge}
                </span>
              )}
              <div className="mb-1 text-base font-bold">{p.name}</div>
              <div className="mb-2 flex min-h-[62px] items-baseline gap-1.5">
                {isCustom ? (
                  <span className="text-[48px] font-extrabold tracking-[-0.04em]">
                    Custom
                  </span>
                ) : (
                  <>
                    <span
                      key={`${p.name}-${billing}`}
                      className="text-[48px] font-extrabold tracking-[-0.04em] tabular-nums"
                    >
                      ${price}
                    </span>
                    <span className="text-base text-text-tertiary">/month</span>
                  </>
                )}
              </div>
              {!isCustom && billing === 'annual' && (
                <div className="mb-1.5 text-xs font-semibold text-success">
                  Save ${(monthly - annual) * 12}/year
                </div>
              )}
              <p className="mb-7 text-sm leading-[1.6] text-text-secondary">{p.desc}</p>
              <Link
                to={isCustom ? '#contact' : '/signup'}
                className="mb-7 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-md font-semibold"
                style={
                  highlight
                    ? {
                        background: 'hsl(var(--accent))',
                        color: '#fff',
                        boxShadow: '0 4px 16px hsl(var(--accent) / 0.35)',
                      }
                    : {
                        background: 'hsl(var(--surface-2))',
                        color: 'hsl(var(--text))',
                        border: '1px solid hsl(var(--border))',
                      }
                }
              >
                {p.cta}
              </Link>
              <div className="flex flex-col gap-3">
                {p.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-text-secondary"
                  >
                    <Check size={16} className="shrink-0 text-success" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          );
          return (
            <div key={p.name} className="h-full">
              {highlight ? (
                <MovingBorder
                  radius={24}
                  borderWidth={2}
                  duration={6}
                  color1="#2563EB"
                  color2="#EC4899"
                  style={{ height: '100%' }}
                >
                  {cardInner}
                </MovingBorder>
              ) : (
                cardInner
              )}
            </div>
          );
        })}
      </div>
      {billing === 'annual' && (
        <div className="mx-auto mt-8 max-w-[720px] text-center text-[13px] text-text-tertiary">
          Billed annually — equivalent to 2.4 months free
        </div>
      )}
    </section>
  );
}

/* ============================================================
   15. FAQ
   ============================================================ */
const FAQS = [
  {
    q: 'How does VoiceFlow AI handle different languages?',
    a: "Our platform supports 29+ languages through ElevenLabs voice technology. The AI can detect the customer's language and automatically switch to the appropriate voice and language model. You can also pre-configure language preferences per campaign or per customer segment.",
  },
  {
    q: 'Can I use my own AI models or prompts?',
    a: "Absolutely. VoiceFlow AI supports OpenAI, Anthropic Claude, Google Gemini, and OpenRouter. You can customize system prompts, conversation flows, and even bring your own fine-tuned models. Our campaign builder lets you configure every aspect of the AI's behavior.",
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We are SOC 2 Type II certified and GDPR compliant. All data is encrypted at rest and in transit. We offer data residency options, SSO/SAML, audit logs, and role-based access control. Enterprise customers can also deploy on-premise.',
  },
  {
    q: 'How does lead scoring work?',
    a: 'During each conversation, the AI evaluates lead quality based on criteria you define — budget, authority, need, and timeline (BANT), custom questions, sentiment analysis, and engagement signals. Each lead receives a real-time score from A+ to D that syncs directly to your CRM.',
  },
  {
    q: "What happens if the AI can't handle a conversation?",
    a: 'VoiceFlow AI includes intelligent escalation. When the AI detects a situation beyond its scope — complex objections, emotional distress, or specific requests — it seamlessly transfers to a human agent with full context and transcript. You control the escalation rules.',
  },
  {
    q: 'How quickly can I get started?',
    a: 'Most teams are running their first AI campaign within 10 minutes. Upload your customer list, choose your AI provider and voice, configure your conversation flow, and launch. No code required. Our onboarding team is available for enterprise deployments.',
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="section-pad py-28">
      <SectionHeader
        label="FAQ"
        title="Frequently asked questions"
        subtitle="Everything you need to know about VoiceFlow AI."
      />
      <div className="mx-auto max-w-[720px]">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <ScrollReveal key={faq.q} delay={i * 50}>
              <div className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-6 text-left text-base font-semibold text-text"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className="shrink-0 text-text-tertiary transition-transform"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all"
                  style={{
                    maxHeight: isOpen ? 320 : 0,
                    opacity: isOpen ? 1 : 0,
                    transition:
                      'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                  }}
                >
                  <p className="pb-6 text-[15px] leading-[1.8] text-text-secondary">
                    {faq.a}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   16. CTASection
   ============================================================ */
export function CTASection() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  return (
    <section className="section-pad py-28">
      <Spotlight
        color="hsl(var(--accent) / 0.3)"
        size={500}
        className="mx-auto max-w-[1100px] rounded-[28px] border px-12 py-[88px] text-center"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--accent) / 0.18), hsl(var(--accent-light) / 0.04) 50%, rgba(236,72,153,0.06))',
          borderColor: 'hsl(var(--accent) / 0.22)',
        }}
      >
        <BackgroundBeams count={6} />
        <Meteors count={10} />
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: '-50%',
            width: 600,
            height: 600,
            background:
              'radial-gradient(circle, hsl(var(--accent) / 0.22), transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div className="relative z-[2]">
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold"
            style={{
              background: 'hsl(var(--accent) / 0.12)',
              borderColor: 'hsl(var(--accent) / 0.25)',
              color: 'hsl(var(--accent-light))',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: 'hsl(var(--success))',
                animation: 'pulseSoft 2s infinite',
              }}
            />
            Trusted by 10,000+ teams worldwide
          </div>
          <h2
            className="mb-5 font-bold leading-[1.05] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(38px, 5vw, 64px)' }}
          >
            Ready to launch
            <br />
            <span className="gradient-flow italic font-medium">
              your first AI campaign?
            </span>
          </h2>
          <p className="mx-auto mb-9 max-w-[540px] text-lg leading-[1.6] text-text-secondary">
            10 minutes to live. No code. No telecom contracts. Just import, configure,
            launch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <MagneticButton strength={0.4}>
              <ShimmerButton to={isAuthed ? '/customers' : '/signup'}>
                {isAuthed ? 'Open dashboard' : 'Start free trial'}
                <ArrowRight size={16} />
              </ShimmerButton>
            </MagneticButton>
            <MagneticButton strength={0.3}>
              <a
                href="mailto:sales@voiceflow.ai"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-6 py-3 text-md font-semibold text-text hover:border-border-light hover:bg-[hsl(var(--hover-overlay-strong))]"
              >
                Talk to sales
              </a>
            </MagneticButton>
          </div>
          <p className="mt-6 text-[13px] text-text-tertiary">
            No credit card · 14-day free trial · Cancel anytime
          </p>
        </div>
      </Spotlight>
    </section>
  );
}

/* ============================================================
   17. Footer
   ============================================================ */
const FOOTER_COLS = [
  {
    title: 'Product',
    items: ['AI Phone Calls', 'WhatsApp Voice', 'WhatsApp Chat', 'Campaign Builder', 'Analytics', 'Integrations'],
  },
  { title: 'Company', items: ['About', 'Blog', 'Careers', 'Press'] },
  {
    title: 'Resources',
    items: ['Documentation', 'API Reference', 'Guides', 'Community', 'Status'],
  },
  {
    title: 'Legal',
    items: ['Privacy Policy', 'Terms of Service', 'Security', 'GDPR', 'SOC 2'],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border px-8 pb-8 pt-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-[280px] text-sm leading-[1.7] text-text-tertiary">
              AI-powered conversations across phone, WhatsApp voice, and chat — from a
              single platform.
            </p>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-[13px] font-bold text-text">{col.title}</div>
              <div className="flex flex-col gap-2.5">
                {col.items.map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="anim-link self-start text-[13px] text-text-tertiary hover:text-text"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <span className="text-[13px] text-text-tertiary">
            © {new Date().getFullYear()} Calls.Ai. All rights reserved.
          </span>
          <div className="flex gap-5">
            {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
              <a
                key={s}
                href="#"
                className="text-[13px] text-text-tertiary transition-colors hover:text-text"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
