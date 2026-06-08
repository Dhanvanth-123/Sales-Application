import { create } from 'zustand';

export type ViewMode = 'auto' | 'desktop' | 'mobile';

const KEY = 'pcnc.viewMode';

function initial(): ViewMode {
  if (typeof localStorage === 'undefined') return 'auto';
  const v = localStorage.getItem(KEY);
  return v === 'desktop' || v === 'mobile' || v === 'auto' ? v : 'auto';
}

interface ViewModeState {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
}

export const useViewMode = create<ViewModeState>((set) => ({
  mode: initial(),
  setMode: (m) => {
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
    set({ mode: m });
  },
}));
