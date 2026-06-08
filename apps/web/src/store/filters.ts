import { create } from 'zustand';

/**
 * Global parts filter state (plan §7.2, R5). Mirrors the URL query string — the
 * URL is the source of truth (see usePartsUrlState), this store makes the current
 * filters available to any component without prop-drilling and lets them persist
 * across navigation.
 */
export interface PartsFilters {
  q: string;
  customerId: string;
  status: string;
}

interface FiltersState extends PartsFilters {
  set: (patch: Partial<PartsFilters>) => void;
  reset: () => void;
}

export const useFilters = create<FiltersState>((set) => ({
  q: '',
  customerId: '',
  status: '',
  set: (patch) => set(patch),
  reset: () => set({ q: '', customerId: '', status: '' }),
}));
