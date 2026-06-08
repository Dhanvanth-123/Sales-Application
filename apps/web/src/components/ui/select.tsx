import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm',
        'focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10',
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = 'Select';
