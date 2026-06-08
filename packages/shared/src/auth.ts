import { z } from 'zod';
import { RoleEnum } from './enums';

/**
 * Auth contracts (plan §6.2, §8 Option A). Shared so the SPA login form and the
 * API DTO validate against the exact same schema.
 */

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const userPublicSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: RoleEnum,
  isActive: z.boolean(),
});
export type UserPublic = z.infer<typeof userPublicSchema>;

export const authResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userPublicSchema,
});
export type AuthResult = z.infer<typeof authResultSchema>;
