import { SetMetadata } from '@nestjs/common';
import type { Role } from '@caliper/shared';

export const ROLES_KEY = 'roles';

/** Restrict a route to one or more roles (ADMIN is always allowed — see RolesGuard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
