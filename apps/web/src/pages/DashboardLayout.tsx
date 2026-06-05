import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/lib/authStore';
import { disconnectSocket } from '@/lib/socket';

const NAV = [
  { to: '/customers', label: 'Customers' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/monitor', label: 'Live monitor' },
  { to: '/calls', label: 'Calls' },
  { to: '/settings', label: 'Settings' },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function onLogout() {
    disconnectSocket();
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-muted">
      <aside className="fixed inset-y-0 left-0 w-64 border-r bg-card flex flex-col">
        <div className="h-16 px-6 flex items-center font-semibold text-lg">VoiceFlow AI</div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4 text-sm">
          <div className="font-medium">{user ? `${user.firstName} ${user.lastName}` : '—'}</div>
          <div className="text-muted-foreground text-xs truncate">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full mt-3" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="pl-64">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
