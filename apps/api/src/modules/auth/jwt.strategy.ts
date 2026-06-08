import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '@caliper/shared';
import { APP_CONFIG, type AppConfig } from '../../config/configuration';
import { requestContext } from '../../common/context/request-context';
import { UsersService } from '../users/users.service';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(APP_CONFIG) cfg: AppConfig,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.jwt.publicKey,
      algorithms: ['RS256'],
      issuer: cfg.jwt.issuer,
      audience: cfg.jwt.audience,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException('User inactive or not found');
    // make the acting user available to the audit extension (R6)
    requestContext.setUser(user.id);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
