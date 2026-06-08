import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Kpi({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: 'brand' | 'emerald' | 'amber' | 'violet' | 'slate';
  hint?: string;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {Icon && (
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', tones[tone])}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
