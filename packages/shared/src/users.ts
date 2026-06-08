import { z } from 'zod';
import { RoleEnum } from './enums';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  role: RoleEnum.default('VIEWER'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: RoleEnum.optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
