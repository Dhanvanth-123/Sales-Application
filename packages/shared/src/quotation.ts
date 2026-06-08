import { z } from 'zod';
import { QuotationStatusEnum } from './enums';

export const quotationSchema = z.object({
  id: z.string(),
  partId: z.string(),
  customerId: z.string(),
  quoteNo: z.string(),
  date: z.string(),
  qty: z.number(),
  quotedPrice: z.number(),
  status: QuotationStatusEnum,
  validUntil: z.string().nullable(),
});
export type Quotation = z.infer<typeof quotationSchema>;

export const createQuotationSchema = z.object({
  quoteNo: z.string().min(1, 'Quote number is required'),
  date: z.string().min(1, 'Date is required'),
  qty: z.coerce.number().int().positive(),
  quotedPrice: z.coerce.number().nonnegative(),
  status: QuotationStatusEnum.default('PENDING'),
  validUntil: z.string().optional(),
  customerId: z.string().optional(),
});
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
