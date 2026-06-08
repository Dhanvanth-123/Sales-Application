import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToasts, type ToastType } from '@/store/toast';
import { cn } from '@/lib/cn';

const styles: Record<ToastType, { ring: string; icon: JSX.Element }> = {
  success: { ring: 'border-l-emerald-500', icon: <CheckCircle2 className="text-emerald-500" size={18} /> },
  error: { ring: 'border-l-red-500', icon: <XCircle className="text-red-500" size={18} /> },
  info: { ring: 'border-l-brand-500', icon: <Info className="text-brand-500" size={18} /> },
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-2.5 rounded-xl border border-slate-200 border-l-4 bg-white px-3.5 py-3 shadow-soft animate-slide-in',
            styles[t.type].ring,
          )}
        >
          <div className="mt-0.5">{styles[t.type].icon}</div>
          <p className="flex-1 text-sm text-slate-700">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
