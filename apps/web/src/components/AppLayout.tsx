import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  Monitor,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
  BarChart3,
  Tags,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE, type Role } from '@caliper/shared';
import { useAuth } from '@/store/auth';
import { useViewMode, type ViewMode } from '@/store/viewMode';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import { logoutRequest } from '@/lib/api';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/parts', label: 'Parts', icon: Boxes },
  { to: '/pricing', label: 'Pricing', icon: Tags },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/quality', label: 'Quality & CI', icon: ClipboardList },
  { to: '/audit', label: 'Audit trail', icon: ShieldCheck, roles: ['QUALITY'] },
  { to: '/admin/users', label: 'Users', icon: Users, roles: [] },
];

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function ViewModeToggle() {
  const { mode, setMode } = useViewMode();
  const opts: { key: ViewMode; label: string; icon: LucideIcon }[] = [
    { key: 'auto', label: 'Auto', icon: MonitorSmartphone },
    { key: 'desktop', label: 'Desktop', icon: Monitor },
    { key: 'mobile', label: 'Mobile', icon: Smartphone },
  ];
  return (
    <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = mode === o.key;
        return (
          <button
            key={o.key}
            onClick={() => setMode(o.key)}
            title={`${o.label} view`}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SidebarContent({ role, onNavigate }: { role?: Role; onNavigate?: () => void }) {
  const user = useAuth((s) => s.user);
  const visible = NAV.filter((n) => !n.roles || role === 'ADMIN' || n.roles.includes(role as Role));
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-ink-900 to-ink-800 text-slate-300">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white shadow-glow">
          P
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">{APP_NAME}</div>
          <div className="text-[11px] text-slate-400">{APP_TAGLINE}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />
                )}
                <Icon size={18} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-3">
        <ViewModeToggle />
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 text-sm font-semibold uppercase text-brand-200">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium text-white">{user?.name}</div>
            <div className="text-[11px] text-slate-400">{user?.role}</div>
          </div>
          <button
            onClick={() => void logoutRequest()}
            title="Sign out"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const role = useAuth((s) => s.user?.role);
  const { mode } = useViewMode();
  const isNarrow = useIsNarrow();
  const isMobile = mode === 'mobile' || (mode === 'auto' && isNarrow);
  const [drawer, setDrawer] = useState(false);

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              P
            </div>
            <span className="text-sm font-bold text-slate-800">{APP_NAME}</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto bg-slate-100">{children}</main>

        {drawer && (
          <div className="fixed inset-0 z-50 flex animate-fade-in" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawer(false)} />
            <div className="relative w-64 max-w-[80%] animate-slide-in">
              <button
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="absolute right-2 top-3 z-10 rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
              >
                <X size={18} />
              </button>
              <SidebarContent role={role} onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <aside className="w-64 shrink-0">
        <SidebarContent role={role} />
      </aside>
      <main className="flex-1 overflow-auto bg-slate-100">{children}</main>
    </div>
  );
}
