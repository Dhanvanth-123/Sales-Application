import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Paginated } from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AuditFilter {
  page: number;
  pageSize: number;
  entity?: string;
  entityId?: string;
  partNo?: string;
  from?: string;
  to?: string;
}

type AuditRow = Prisma.AuditLogGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Filterable, paginated audit-trail read (R6, plan §6.3). */
  async query(f: AuditFilter): Promise<Paginated<AuditRow>> {
    const where: Prisma.AuditLogWhereInput = {};
    if (f.entity) where.entity = f.entity;
    if (f.entityId) where.entityId = f.entityId;
    if (f.partNo) where.partNo = f.partNo;
    if (f.from || f.to) {
      where.ts = {
        ...(f.from ? { gte: new Date(f.from) } : {}),
        ...(f.to ? { lte: new Date(f.to) } : {}),
      };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { ts: 'desc' },
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return {
      data,
      page: f.page,
      pageSize: f.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / f.pageSize)),
    };
  }
}
