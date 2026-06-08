import { z } from 'zod';
import { PartStatusEnum } from './enums';
import { listQuerySchema } from './common';

/** A row in the parts grid (plan §7.1 /parts). Money as number, dates as ISO. */
export const partListItemSchema = z.object({
  id: z.string(),
  partNo: z.string(),
  description: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerCode: z.string(),
  material: z.string().nullable(),
  drawingNo: z.string().nullable(),
  status: PartStatusEnum,
  uom: z.string(),
  currentPrice: z.number().nullable(),
  stdCycleMin: z.number().nullable(),
  createdAt: z.string(),
});
export type PartListItem = z.infer<typeof partListItemSchema>;

/** Optional numeric input: empty string / null → undefined (not coerced to 0). */
const optionalNumber = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.coerce.number().nonnegative().optional(),
);

export const createPartSchema = z.object({
  partNo: z.string().min(1, 'Part number is required'),
  description: z.string().min(1, 'Description is required'),
  customerId: z.string().min(1, 'Customer is required'),
  material: z.string().optional(),
  drawingNo: z.string().optional(),
  status: PartStatusEnum.default('ACTIVE'),
  uom: z.string().default('NOS'),
  currentPrice: optionalNumber,
  stdCycleMin: optionalNumber,
});
export type CreatePartInput = z.infer<typeof createPartSchema>;

export const updatePartSchema = createPartSchema.partial().omit({ partNo: true });
export type UpdatePartInput = z.infer<typeof updatePartSchema>;

/** Query params for the parts list (R5 filters). */
export const partsQuerySchema = listQuerySchema.extend({
  status: PartStatusEnum.optional(),
});
export type PartsQuery = z.infer<typeof partsQuerySchema>;
