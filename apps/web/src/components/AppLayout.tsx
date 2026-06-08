import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  ClipboardList,
  Gauge,
  LogOut,
  ShieldCheck,
  BarChart3,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { APP_NAME, APP_TAGLINE, type Role } from '@caliper/shared';
import { useAuth } from '@/store/auth';
import { logoutRequest } from '@/lib/api';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[]; // visible to these roles (+ ADMIN); omit = everyone
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

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const role = user?.role;

  const visible = NAV.filter(
    (n) => !n.roles || role === 'ADMIN' || n.roles.includes(role as Role),
  );

  return (
    <div className="flex h-full">
      <aside className="flex w-64 flex-col bg-gradient-to-b from-ink-900 to-ink-800 text-slate-300">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white shadow-glow">
            P
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">{APP_NAME}</div>
            <div className="text-[11px] text-slate-400">{APP_TAGLINE}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {visible.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
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

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
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
      </aside>

      <main className="flex-1 overflow-auto bg-slate-100">{children}</main>
    </div>
  );
}
