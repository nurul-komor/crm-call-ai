import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  Command,
  Cpu,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Mic,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/lib/authStore';
import { disconnectSocket } from '@/lib/socket';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: { text: string; tone: 'accent' | 'success' };
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      {
        to: '/campaigns',
        label: 'Campaigns',
        icon: Megaphone,
      },
      {
        to: '/monitor',
        label: 'Live monitor',
        icon: Activity,
        badge: { text: 'LIVE', tone: 'success' },
      },
      { to: '/calls', label: 'Calls', icon: Headphones },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/knowledge', label: 'Knowledge base', icon: BookOpen },
      { to: '/automations', label: 'Automations', icon: Zap },
    ],
  },
  {
    label: 'Configure',
    items: [
      { to: '/settings#voice', label: 'Voice profiles', icon: Mic },
      { to: '/settings#providers', label: 'AI providers', icon: Cpu },
      { to: '/settings#billing', label: 'Billing', icon: CreditCard },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/customers': 'Customers',
  '/campaigns': 'Campaigns',
  '/campaigns/new': 'New campaign',
  '/monitor': 'Live monitor',
  '/calls': 'Calls',
  '/settings': 'Settings',
};

function getPageLabel(pathname: string): string {
  const direct = PAGE_TITLES[pathname];
  if (direct) return direct;
  if (pathname.startsWith('/campaigns/') && pathname.endsWith('/edit')) return 'Edit campaign';
  if (pathname.startsWith('/calls/')) return 'Call detail';
  return 'Dashboard';
}

function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors',
          isActive
            ? 'bg-accent/15 text-text'
            : 'text-text-secondary hover:bg-[hsl(var(--hover-overlay))] hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-accent-light" />
          )}
          <item.icon
            size={16}
            strokeWidth={1.75}
            className={isActive ? 'text-accent-light' : 'text-text-tertiary group-hover:text-text-secondary'}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-semibold tracking-wide',
                item.badge.tone === 'success'
                  ? 'text-success bg-success/15'
                  : 'text-accent-light bg-accent/15',
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
  const [showAccount, setShowAccount] = useState(false);

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'V'
    : 'V';
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'VoiceFlow user';

  function onLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <aside className="fixed inset-y-0 left-0 w-[248px] border-r border-border bg-surface flex flex-col z-30">
        <div className="px-3 py-3.5">
          <button
            type="button"
            className="w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-[hsl(var(--hover-overlay))] transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
              V
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-text truncate">VoiceFlow AI</div>
              <div className="text-2xs text-text-tertiary">Workspace · Pro</div>
            </div>
            <ChevronDown size={14} className="text-text-tertiary" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => navigate('/campaigns/new')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-accent/30 bg-accent/10 hover:bg-accent/15 transition-colors text-base font-semibold text-text"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent-light" />
              Quick create
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd">⌘</kbd>
              <kbd className="kbd">N</kbd>
            </span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
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

        <div className="border-t border-border p-3 relative">
          {showAccount && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-md border border-border bg-surface shadow-lift py-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-base text-danger hover:bg-[hsl(var(--hover-overlay))] transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAccount((v) => !v)}
            className="w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-[hsl(var(--hover-overlay))] transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-full bg-surface-2 border border-border-light flex items-center justify-center text-xs font-semibold text-text shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text truncate">{fullName}</div>
              <div className="text-2xs text-text-tertiary truncate">{user?.email ?? '—'}</div>
            </div>
            <ChevronDown size={14} className="text-text-tertiary" />
          </button>
        </div>
      </aside>

      <div className="pl-[248px]">
        <header className="sticky top-0 z-20 h-[60px] border-b border-border bg-surface/70 glass-surface flex items-center px-7 gap-4">
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <LayoutDashboard size={14} />
            <span>Workspace</span>
            <span className="opacity-50">/</span>
            <span className="text-text font-medium">{getPageLabel(location.pathname)}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative w-[260px] hidden md:block">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <input
                placeholder="Search workspace…"
                className="w-full h-9 rounded-md border border-border bg-surface-2 pl-9 pr-12 text-base text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd">K</kbd>
              </span>
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />

            <Button
              variant="ghost"
              size="icon"
              title="AI copilot"
              className="relative"
            >
              <Sparkles size={16} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </Button>

            <Button variant="ghost" size="icon" title="Notifications" className="relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
            </Button>

            <Button onClick={() => navigate('/campaigns/new')} size="md" className="gap-2">
              <Command size={14} />
              New campaign
            </Button>
          </div>
        </header>

        <main className="px-7 py-8 max-w-[1480px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
