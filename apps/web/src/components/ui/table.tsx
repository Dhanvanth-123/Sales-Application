import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-slate-200 bg-slate-50/60 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, ...rest }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('whitespace-nowrap border-b border-slate-100 px-3 py-2.5 text-slate-700', className)}
      {...rest}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ cols, children }: { cols: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-12 text-center text-sm text-slate-400">
        {children}
      </td>
    </tr>
  );
}
