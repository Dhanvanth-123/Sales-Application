import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'violet';

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const dots: Record<Tone, string> = {
  gray: 'bg-slate-400',
  green: 'bg-emerald-500',
  blue: 'bg-brand-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
};

export function Badge({
  tone = 'gray',
  dot,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  NPD: 'violet',
  WON: 'green',
  LOST: 'red',
  PENDING: 'amber',
  PASS: 'green',
  FAIL: 'red',
  APPROVED: 'green',
  REJECTED: 'red',
  CONDITIONAL: 'amber',
  OPEN: 'amber',
  IN_PROGRESS: 'blue',
  CLOSED: 'green',
  NEW: 'blue',
  REVISION: 'gray',
  PVC: 'violet',
  PLAN: 'gray',
  DO: 'blue',
  CHECK: 'amber',
  ACT: 'green',
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
};

export function StatusBadge({ value, dot = true }: { value: string; dot?: boolean }) {
  return (
    <Badge tone={STATUS_TONE[value] ?? 'gray'} dot={dot}>
      {value.replace(/_/g, ' ')}
    </Badge>
  );
}
