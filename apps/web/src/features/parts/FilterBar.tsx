import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { Customer } from '@caliper/shared';
import type { PartsUrlState } from '@/hooks/usePartsUrlState';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

/** Global filter bar (R5): part search + customer + status, synced to the URL. */
export function FilterBar({
  state,
  update,
  resetFilters,
  customers,
}: {
  state: PartsUrlState;
  update: (patch: Partial<PartsUrlState>) => void;
  resetFilters: () => void;
  customers: Customer[];
}) {
  const [q, setQ] = useState(state.q);

  // keep the box in sync when the URL changes externally (back/forward, clear)
  useEffect(() => setQ(state.q), [state.q]);

  // debounce text → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== state.q) update({ q });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = Boolean(state.q || state.customerId || state.status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search part no / description"
          className="w-64 pl-9"
        />
      </div>

      <Select value={state.customerId} onChange={(e) => update({ customerId: e.target.value })}>
        <option value="">All customers</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code} — {c.name}
          </option>
        ))}
      </Select>

      <Select value={state.status} onChange={(e) => update({ status: e.target.value })}>
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="NPD">NPD</option>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Clear
        </Button>
      )}
    </div>
  );
}
