import { Prisma } from '@prisma/client';

/**
 * Serialization helpers. Prisma returns `Decimal` for money/numeric columns and
 * `Date` for timestamps; the API contract (@caliper/shared) uses plain `number`
 * and ISO `string`. These convert at the service boundary.
 *
 * Money fits comfortably in a JS number for display/aggregation at this scale
 * (≤ 12,2). Large cross-part rollups (Phase 4) are done in SQL, not JS.
 */
type Dec = Prisma.Decimal;

export function num(v: Dec | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === 'number' ? v : v.toNumber();
}

export function numOr(v: Dec | number | null | undefined, fallback = 0): number {
  return num(v) ?? fallback;
}

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function isoReq(d: Date): string {
  return d.toISOString();
}

/** PPM = rejected / (accepted + rejected) × 1e6 (0 when no inspected qty). */
export function ppm(accepted: number, rejected: number): number {
  const total = accepted + rejected;
  return total > 0 ? Math.round((rejected / total) * 1_000_000) : 0;
}

/** Percentage delta between an old and new value, or null if no base. */
export function deltaPct(oldVal: number | null, newVal: number): number | null {
  if (oldVal === null || oldVal === 0) return null;
  return ((newVal - oldVal) / oldVal) * 100;
}
