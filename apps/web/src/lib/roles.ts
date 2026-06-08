import type { Role } from '@caliper/shared';

/** UI-side role check (convenience only — the API enforces the same rules). */
export function canWrite(role: Role | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  return role === 'ADMIN' || allowed.includes(role);
}
