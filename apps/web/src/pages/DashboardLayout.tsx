import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  Code,
  Command as CommandIcon,
  Cpu,
  CreditCard,
  DollarSign,
  FileText,
  Headphones,
  LayoutDashboard,
  Layers,
  LogOut,
  Mail,
  Megaphone,
  MessageSquare,
  Mic,
  Search,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import { ThemeToggle } from '@/pages/landing/primitives';
import { useAuthStore } from '@/lib/authStore';
import { cn } from '@/lib/cn';
import { disconnectSocket } from '@/lib/socket';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: { text: string; tone: 'accent' | 'success' };
  count?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/campaigns', label: 'Campaigns', icon: Megaphone, count: 6 },
      { to: '/monitor', label: 'Conversations', icon: MessageSquare, badge: { text: 'LIVE', tone: 'success' } },
      { to: '/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Lead capture',
    items: [
      { to: '/lead-forms', label: 'Lead Forms', icon: FileText },
      { to: '/custom-fields', label: 'Custom Fields', icon: Code },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', label: 'Analytics', icon: TrendingUp },
      { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
      { to: '/automations', label: 'Automations', icon: Zap },
    ],
  },
  {
    label: 'Configure',
    items: [
      { to: '/voice', label: 'Voice Profiles', icon: Mic },
      { to: '/providers', label: 'AI Providers', icon: Cpu },
      { to: '/billing', label: 'Billing', icon: DollarSign },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/admin', label: 'Admin Panel', icon: Shield },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/campaigns': 'Campaigns',
  '/campaigns/new': 'New campaign',
  '/monitor': 'Conversations',
  '/calls': 'Calls',
  '/settings': 'Settings',
  '/analytics': 'Analytics',
  '/knowledge': 'Knowledge Base',
  '/automations': 'Automations',
  '/voice': 'Voice Profiles',
  '/providers': 'AI Providers',
  '/billing': 'Billing',
  '/admin': 'Admin Panel',
  '/lead-forms': 'Lead Forms',
  '/custom-fields': 'Custom Fields',
};

function getPageLabel(pathname: string): string {
  const direct = PAGE_TITLES[pathname];
  if (direct) return direct;
  if (pathname.startsWith('/campaigns/') && pathname.endsWith('/edit')) return 'Edit campaign';
  if (pathname.startsWith('/calls/')) return 'Call detail';
  return 'Dashboard';
}

const WORKSPACES = [
  {
    id: 'acme',
    name: 'Acme Corp',
    plan: 'Enterprise',
    users: 24,
    gradient: 'linear-gradient(135deg, #3B82F6, #FF6B5C)',
  },
  {
    id: 'meridian',
    name: 'Meridian Labs',
    plan: 'Professional',
    users: 12,
    gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
  },
  {
    id: 'polaris',
    name: 'Polaris Group',
    plan: 'Starter',
    users: 4,
    gradient: 'linear-gradient(135deg, #22C55E, #14B8A6)',
  },
] as const;
type Workspace = (typeof WORKSPACES)[number];

function WorkspaceMark({ ws, size = 28 }: { ws: Workspace; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold"
      style={{ width: size, height: size, letterSpacing: '-0.05em' }}
    >
      <span
        className="italic"
        style={{
          background: ws.gradient,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {ws.name.slice(0, 2)}
      </span>
    </div>
  );
}

function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-base font-medium transition-colors',
          isActive
            ? 'bg-accent/15 text-text'
            : 'text-text-secondary hover:bg-[hsl(var(--hover-overlay))] hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-3 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r bg-accent" />
          )}
          <item.icon
            size={15}
            strokeWidth={1.75}
            className={
              isActive
                ? 'text-accent-light'
                : 'text-text-tertiary group-hover:text-text-secondary'
            }
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.count !== undefined && (
            <span className="rounded bg-[hsl(var(--hover-overlay))] px-1.5 text-2xs font-semibold text-text-tertiary">
              {item.count}
            </span>
          )}
          {item.badge && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-bold tracking-wider',
                item.badge.tone === 'success'
                  ? 'bg-success/15 text-success'
                  : 'bg-accent/15 text-accent-light',
              )}
            >
              {item.badge.tone === 'success' && <span className="live-dot" />}
              {item.badge.text}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [workspaceId, setWorkspaceId] = useState<Workspace['id']>('acme');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      text: 'New qualified lead: Maria Santos',
      time: '2m',
      color: 'hsl(var(--success))',
    },
    {
      id: 'n2',
      text: 'Q4 Outreach hit 50% conversion',
      time: '15m',
      color: 'hsl(var(--accent-light))',
    },
    {
      id: 'n3',
      text: 'WhatsApp integration reconnected',
      time: '1h',
      color: 'hsl(var(--warning))',
    },
  ]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/campaigns/new');
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [navigate]);

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'V'
    : 'V';
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'VoiceFlow user';
  const workspace = WORKSPACES.find((w) => w.id === workspaceId) ?? WORKSPACES[0];

  function onLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  const workspaceItems: DropdownItem[] = [
    { label: 'Workspaces' },
    ...WORKSPACES.map((w) => ({
      name: w.name,
      icon: <WorkspaceMark ws={w} size={22} />,
      meta: w.plan,
      checked: w.id === workspaceId,
      onClick: () => setWorkspaceId(w.id),
    })),
    { divider: true as const },
    {
      name: 'Create workspace',
      icon: <Sparkles size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      name: 'Workspace settings',
      icon: <SettingsIcon size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      name: 'Invite teammates',
      icon: <Users size={14} />,
      onClick: () => navigate('/settings'),
    },
  ];

  const quickCreateItems: DropdownItem[] = [
    {
      name: 'New campaign',
      icon: <Layers size={14} />,
      kbd: '⌘ N',
      onClick: () => navigate('/campaigns/new'),
    },
    {
      name: 'Add customer',
      icon: <Users size={14} />,
      onClick: () => navigate('/customers'),
    },
    {
      name: 'Import CSV',
      icon: <Code size={14} />,
      onClick: () => navigate('/customers'),
    },
    {
      name: 'New Lead Form',
      icon: <FileText size={14} />,
      onClick: () => navigate('/lead-forms'),
    },
    { divider: true as const },
    {
      name: 'New automation',
      icon: <Zap size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      name: 'Add voice profile',
      icon: <Mic size={14} />,
      onClick: () => navigate('/settings#voice'),
    },
  ];

  const accountItems: DropdownItem[] = [
    { label: 'Account' },
    {
      name: 'Profile',
      icon: <Users size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      name: 'Settings',
      icon: <SettingsIcon size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      name: 'Billing',
      icon: <DollarSign size={14} />,
      onClick: () => navigate('/settings#billing'),
    },
    { divider: true as const },
    { label: 'Workspace' },
    {
      name: 'Switch workspace',
      icon: <Layers size={14} />,
      onClick: () => undefined,
    },
    {
      name: 'Invite team',
      icon: <Mail size={14} />,
      onClick: () => navigate('/settings'),
    },
    { divider: true as const },
    {
      name: 'Sign out',
      icon: <LogOut size={14} />,
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <div className="dash-shell min-h-screen grid grid-cols-[248px_1fr] bg-bg text-text">
      <aside
        className="dash-sidebar sticky top-0 z-30 flex h-screen flex-col overflow-y-auto border-r border-border px-3 py-3.5"
        style={{
          background: 'hsl(var(--surface) / 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="border-b border-border pb-3.5">
          <Dropdown
            align="left"
            width={260}
            trigger={
              <button
                type="button"
                className="row-hover flex w-full items-center gap-2.5 rounded-md p-2 text-left"
              >
                <WorkspaceMark ws={workspace} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold tracking-tight">
                    {workspace.name}
                  </div>
                  <div className="text-2xs text-text-tertiary">
                    {workspace.plan} · {workspace.users} users
                  </div>
                </div>
                <ChevronDown size={14} className="shrink-0 text-text-tertiary" />
              </button>
            }
            items={workspaceItems}
            className="block w-full"
          />
        </div>

        <div className="pt-3">
          <Dropdown
            align="left"
            width={220}
            trigger={
              <button
                type="button"
                className="mb-4 flex w-full items-center justify-between gap-2 rounded-md border border-accent/25 bg-accent/10 px-3 py-2 text-base font-semibold text-text transition-colors hover:bg-accent/15"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} className="text-accent-light" />
                  Quick create
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="kbd">⌘</kbd>
                  <kbd className="kbd">N</kbd>
                </span>
              </button>
            }
            items={quickCreateItems}
            className="block w-full"
          />
        </div>

        <nav className="flex-1 pb-3">
          {NAV.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border pt-3">
          <Dropdown
            align="left"
            width={220}
            trigger={
              <button
                type="button"
                className="row-hover flex w-full items-center gap-2.5 rounded-md p-2 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-light bg-surface-2 text-xs font-semibold text-text">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{fullName}</div>
                  <div className="truncate text-2xs text-text-tertiary">
                    {user?.email ?? '—'}
                  </div>
                </div>
                <ChevronDown size={14} className="text-text-tertiary" />
              </button>
            }
            items={accountItems}
            className="block w-full"
          />
        </div>
      </aside>

      <div className="dash-main flex min-w-0 flex-col">
        <header
          className="dash-topbar sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-border px-7"
          style={{
            background: 'hsl(var(--surface) / 0.7)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <LayoutDashboard size={14} />
            <span>Workspace</span>
            <span className="opacity-50">/</span>
            <span className="font-semibold text-text">
              {getPageLabel(location.pathname)}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden h-9 items-center gap-2.5 rounded-md border border-border bg-surface-2 pl-3 pr-2.5 text-sm text-text-tertiary transition-colors hover:border-border-light hover:bg-[hsl(var(--hover-overlay))] md:flex md:min-w-[260px]"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search or jump to…</span>
              <span className="flex items-center gap-1">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd">K</kbd>
              </span>
            </button>

            <div className="hidden h-6 w-px bg-border md:block" />

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              title="AI copilot"
              className="relative"
            >
              <Sparkles size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                title="Notifications"
                className="relative"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
                )}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-[340px] rounded-xl border border-border-light bg-surface p-2 shadow-lift">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <span className="text-sm font-bold">Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotifications([])}
                        className="text-xs font-semibold text-accent-light"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="pt-1">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-8 text-center text-sm text-text-tertiary">
                        You're all caught up
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="row-hover flex items-start gap-2.5 rounded-md px-3 py-2.5"
                        >
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                            style={{ background: n.color }}
                          />
                          <div className="flex-1">
                            <div className="text-xs leading-snug text-text">{n.text}</div>
                            <div className="mt-0.5 text-2xs text-text-tertiary">
                              {n.time} ago
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNotifications((ns) => ns.filter((x) => x.id !== n.id))
                            }
                            className="text-text-tertiary opacity-60 hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={() => navigate('/campaigns/new')} size="md" className="gap-2">
              <CommandIcon size={14} />
              New campaign
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-7 py-8">
          <Outlet />
        </main>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </div>
  );
}
