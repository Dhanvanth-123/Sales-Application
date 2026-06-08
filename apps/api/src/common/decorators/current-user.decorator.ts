import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@caliper/shared';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** Injects the authenticated user (set by JwtStrategy.validate) into a handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
