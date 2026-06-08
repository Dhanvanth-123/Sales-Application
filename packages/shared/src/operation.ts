import { z } from 'zod';

export const operationSchema = z.object({
  id: z.string(),
  partId: z.string(),
  seq: z.number(),
  operation: z.string(),
  machine: z.string().nullable(),
  setupMin: z.number(),
  cycleMin: z.number(),
  tooling: z.string().nullable(),
});
export type Operation = z.infer<typeof operationSchema>;

export const createOperationSchema = z.object({
  seq: z.coerce.number().int().nonnegative(),
  operation: z.string().min(1, 'Operation is required'),
  machine: z.string().optional(),
  setupMin: z.coerce.number().nonnegative().default(0),
  cycleMin: z.coerce.number().nonnegative().default(0),
  tooling: z.string().optional(),
});
export type CreateOperationInput = z.infer<typeof createOperationSchema>;
