import { z } from 'zod';

export const customerSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  gstin: z.string().nullable(),
  contactName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});
export type Customer = z.infer<typeof customerSchema>;

export const createCustomerSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  gstin: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
