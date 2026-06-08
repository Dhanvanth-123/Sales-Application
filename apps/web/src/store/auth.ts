import { create } from 'zustand';
import type { UserPublic } from '@caliper/shared';

const REFRESH_KEY = 'caliper.refreshToken';

/**
 * Auth state. The access token lives only in memory (plan §7.2). The refresh
 * token is persisted to localStorage so a page reload can transparently
 * re-establish a session; Phase 6 moves it to an httpOnly, Secure cookie.
 */
interface AuthState {
  accessToken: string | null;
  user: UserPublic | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  setSession: (accessToken: string, refreshToken: string, user: UserPublic) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
  setStatus: (status: AuthState['status']) => void;
}

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'loading',
  setSession: (accessToken, refreshToken, user) => {
    localStorage.setItem(REFRESH_KEY, refreshToken);
    set({ accessToken, user, status: 'authenticated' });
  },
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => {
    localStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, user: null, status: 'anonymous' });
  },
  setStatus: (status) => set({ status }),
}));

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY);
export const setStoredRefreshToken = (token: string): void =>
  localStorage.setItem(REFRESH_KEY, token);
