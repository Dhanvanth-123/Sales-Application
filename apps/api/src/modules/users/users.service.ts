import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import type { CreateUserInput, Role, UpdateUserInput, UserPublic } from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async list(): Promise<UserPublic[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map((u) => UsersService.toPublic(u));
  }

  async create(input: CreateUserInput): Promise<UserPublic> {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'Email already in use' });
    const passwordHash = await hash(input.password, ARGON2_OPTS);
    const user = await this.prisma.user.create({
      data: { email: input.email.toLowerCase(), name: input.name, role: input.role, passwordHash },
    });
    return UsersService.toPublic(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserPublic> {
    const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    const passwordHash = input.password ? await hash(input.password, ARGON2_OPTS) : undefined;
    const user = await this.prisma.user.update({
      where: { id },
      data: { name: input.name, role: input.role, isActive: input.isActive, passwordHash },
    });
    return UsersService.toPublic(user);
  }

  static toPublic(u: {
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
  }): UserPublic {
    return { id: u.id, email: u.email, name: u.name, role: u.role, isActive: u.isActive };
  }
}
