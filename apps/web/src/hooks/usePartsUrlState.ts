import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFilters } from '@/store/filters';

export interface PartsUrlState {
  q: string;
  customerId: string;
  status: string;
  page: number;
  sort: string;
}

/**
 * Two-way bridge between the parts filters and the URL (R5): the URL query string
 * is the source of truth (shareable, bookmarkable, survives refresh), and the
 * filter subset is mirrored into the global Zustand store.
 */
export function usePartsUrlState() {
  const [sp, setSp] = useSearchParams();

  const state: PartsUrlState = {
    q: sp.get('q') ?? '',
    customerId: sp.get('customerId') ?? '',
    status: sp.get('status') ?? '',
    page: Math.max(1, Number(sp.get('page') ?? '1') || 1),
    sort: sp.get('sort') ?? '',
  };

  useEffect(() => {
    useFilters.getState().set({ q: state.q, customerId: state.customerId, status: state.status });
  }, [state.q, state.customerId, state.status]);

  const update = (patch: Partial<PartsUrlState>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v === undefined || v === null) next.delete(k);
      else next.set(k, String(v));
    }
    // changing a filter or sort returns to the first page
    if (!('page' in patch)) next.set('page', '1');
    setSp(next);
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    if (state.sort) next.set('sort', state.sort);
    setSp(next);
  };

  return { state, update, resetFilters };
}
