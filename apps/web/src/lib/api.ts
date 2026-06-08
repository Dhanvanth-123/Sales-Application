import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiError, AuthResult, LoginInput, UserPublic } from '@caliper/shared';
import { getRefreshToken, setStoredRefreshToken, useAuth } from '@/store/auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

/** Shared axios instance. Attaches the in-memory bearer token and transparently
 *  refreshes once on a 401 (plan §7.2). */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// de-dupe concurrent refreshes
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthResult>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    setStoredRefreshToken(data.refreshToken);
    useAuth.getState().setSession(data.accessToken, data.refreshToken, data.user);
    return data.accessToken;
  } catch {
    useAuth.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    if (status === 401 && original && !original._retried && !url.includes('/auth/')) {
      original._retried = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` };
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

// ── typed endpoints used in Phase 0 ──

export async function loginRequest(input: LoginInput): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/auth/login', input);
  return data;
}

export async function fetchMe(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/me');
  return data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    useAuth.getState().clear();
  }
}

/** Called once on app start: hydrate the session from a stored refresh token. */
export async function bootstrapAuth(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    useAuth.getState().setStatus('anonymous');
    return;
  }
  const token = await refreshAccessToken();
  if (!token) useAuth.getState().setStatus('anonymous');
}

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    return data?.error?.message ?? err.message ?? fallback;
  }
  return fallback;
}
