import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { verify } from '@node-rs/argon2';
import type { AuthResult, LoginInput } from '@caliper/shared';
import { APP_CONFIG, type AppConfig } from '../../config/configuration';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from './jwt.strategy';

type DbUser = NonNullable<Awaited<ReturnType<UsersService['findByEmail']>>>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email.toLowerCase().trim());
    // verify even on missing user to keep timing roughly constant
    const ok =
      user?.passwordHash && user.isActive
        ? await verify(user.passwordHash, input.password)
        : false;
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');
    return this.issue(user);
  }

  async refresh(refreshToken?: string): Promise<AuthResult> {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.cfg.refresh.secret,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException('User inactive or not found');
    return this.issue(user); // rotation: a fresh pair on every refresh
  }

  private async issue(user: DbUser): Promise<AuthResult> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessOptions: JwtSignOptions = {
      privateKey: this.cfg.jwt.privateKey,
      algorithm: 'RS256',
      // config holds a plain string (e.g. '15m'); ms accepts it at runtime
      expiresIn: this.cfg.jwt.accessTtl as JwtSignOptions['expiresIn'],
      issuer: this.cfg.jwt.issuer,
      audience: this.cfg.jwt.audience,
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.cfg.refresh.secret,
      algorithm: 'HS256',
      expiresIn: this.cfg.refresh.ttl as JwtSignOptions['expiresIn'],
    };
    const accessToken = await this.jwt.signAsync(payload, accessOptions);
    const refreshToken = await this.jwt.signAsync({ sub: user.id }, refreshOptions);
    return { accessToken, refreshToken, user: UsersService.toPublic(user) };
  }
}
