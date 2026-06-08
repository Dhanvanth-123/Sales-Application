import { z } from 'zod';
import { PriceChangeTypeEnum, type PartStatus, type PriceChangeType } from './enums';
import { listQuerySchema } from './common';

/** Add a price change (R2). PVC carries an optional reconstructable basis (§6.4). */
export const createPriceChangeSchema = z.object({
  newPrice: z.coerce.number().nonnegative(),
  type: PriceChangeTypeEnum.default('REVISION'),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  reason: z.string().min(3, 'Reason is required (captured in the audit trail)'),
  pvcBasis: z
    .object({
      baseIndex: z.coerce.number(),
      currentIndex: z.coerce.number(),
      materialWeight: z.coerce.number(),
    })
    .partial()
    .optional(),
});
export type CreatePriceChangeInput = z.infer<typeof createPriceChangeSchema>;

/** A row of the master price list (R2). */
export interface MasterPriceItem {
  partId: string;
  partNo: string;
  description: string;
  customerCode: string;
  customerName: string;
  status: PartStatus;
  currentPrice: number | null;
  lastChangeType: PriceChangeType | null;
  lastEffectiveDate: string | null;
}

/** A row of the cross-part price-change history (R2). */
export interface PriceChangeListItem {
  id: string;
  partId: string;
  partNo: string;
  description: string;
  customerCode: string;
  effectiveDate: string;
  oldPrice: number | null;
  newPrice: number;
  deltaPct: number | null;
  type: PriceChangeType;
  reason: string;
  approvedBy: string | null;
}

export const priceChangesQuerySchema = listQuerySchema.extend({
  type: PriceChangeTypeEnum.optional(),
});
export type PriceChangesQuery = z.infer<typeof priceChangesQuerySchema>;
