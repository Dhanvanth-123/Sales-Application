import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { loginSchema, type AuthResult, type LoginInput, type UserPublic } from '@caliper/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('auth/login')
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput): Promise<AuthResult> {
    return this.auth.login(body);
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(200)
  refresh(@Body() body: { refreshToken?: string }): Promise<AuthResult> {
    return this.auth.refresh(body?.refreshToken);
  }

  @Public()
  @Post('auth/logout')
  @HttpCode(200)
  logout(): { success: true } {
    // Stateless tokens: the client discards them. A server-side revocation list
    // lands with the rotating refresh-token store in Phase 5.
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): UserPublic {
    return { ...user, isActive: true };
  }
}
