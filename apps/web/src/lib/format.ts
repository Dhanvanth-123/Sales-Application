const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});
const num0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const num2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export function money(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : inr.format(v);
}

export function int(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : num0.format(v);
}

export function dec(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : num2.format(v);
}

export function pct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${num2.format(v)}%`;
}

/** Compact INR for chart axes/labels (Indian Cr/L/k). */
export function compactInr(v: number): string {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${(v / 1e3).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
}

export function date(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** YYYY-MM-DD for <input type="date"> from an ISO string. */
export function dateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}
