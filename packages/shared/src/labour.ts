import { z } from 'zod';

export const labourEntrySchema = z.object({
  id: z.string(),
  partId: z.string(),
  operation: z.string(),
  grade: z.string().nullable(),
  ratePerHr: z.number(),
  stdTimeMin: z.number(),
  costPerPc: z.number(), // computed = ratePerHr × stdTimeMin / 60
});
export type LabourEntry = z.infer<typeof labourEntrySchema>;

export const createLabourSchema = z.object({
  operation: z.string().min(1, 'Operation is required'),
  grade: z.string().optional(),
  ratePerHr: z.coerce.number().nonnegative(),
  stdTimeMin: z.coerce.number().nonnegative(),
});
export type CreateLabourInput = z.infer<typeof createLabourSchema>;
