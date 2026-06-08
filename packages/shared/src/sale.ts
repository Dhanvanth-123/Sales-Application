import { z } from 'zod';

export const saleSchema = z.object({
  id: z.string(),
  partId: z.string(),
  customerId: z.string(),
  date: z.string(),
  soNo: z.string().nullable(),
  qty: z.number(),
  unitPrice: z.number(),
  value: z.number(), // computed = qty × unitPrice
});
export type Sale = z.infer<typeof saleSchema>;

export const createSaleSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  soNo: z.string().optional(),
  qty: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  // optional; defaults to the part's customer
  customerId: z.string().optional(),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
