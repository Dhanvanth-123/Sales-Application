import { z } from 'zod';

/**
 * Cross-cutting request/response contracts (plan §6.2, §6.5).
 */

/** Standard list params on every collection endpoint (plan §6.2). */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  sort: z.string().optional(),
  q: z.string().optional(),
  partNo: z.string().optional(),
  customerId: z.string().optional(),
  from: z.string().optional(), // ISO date (inclusive)
  to: z.string().optional(), // ISO date (inclusive)
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Consistent error envelope (plan §6.5). */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Optional numeric form input: '' / null → undefined (not coerced to 0). */
export const optionalNonNegative = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.coerce.number().nonnegative().optional(),
);
