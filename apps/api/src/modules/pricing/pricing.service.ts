import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreatePriceChangeInput,
  MasterPriceItem,
  Paginated,
  PriceChangeDto,
  PriceChangeListItem,
  PriceChangesQuery,
} from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { writeAudit } from '../../common/audit/audit-writer';
import { deltaPct, isoReq, num, numOr } from '../../common/serialize';

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Add a price change (R2) — atomic with the audit row (R6). */
  async addPriceChange(
    partId: string,
    input: CreatePriceChangeInput,
    userId: string,
  ): Promise<PriceChangeDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({
        where: { id: partId },
        select: { id: true, partNo: true, currentPrice: true },
      });
      if (!part) throw new NotFoundException({ code: 'PART_NOT_FOUND', message: 'Part not found' });

      const oldPrice = num(part.currentPrice);
      const created = await tx.priceChange.create({
        data: {
          partId,
          effectiveDate: new Date(input.effectiveDate),
          oldPrice: part.currentPrice ?? null,
          newPrice: input.newPrice,
          type: input.type,
          reason: input.reason,
          approvedById: userId,
          pvcBasis: input.pvcBasis ? (input.pvcBasis as Prisma.InputJsonValue) : undefined,
        },
        include: { approvedBy: { select: { name: true } } },
      });

      await tx.part.update({ where: { id: partId }, data: { currentPrice: input.newPrice } });

      await writeAudit(tx, {
        entity: 'PriceChange',
        entityId: created.id,
        partNo: part.partNo,
        action: 'UPDATE',
        reason: `${input.type} — ${input.reason}`,
        before: { currentPrice: oldPrice },
        after: { currentPrice: input.newPrice },
      });

      const newPrice = numOr(created.newPrice);
      return {
        partNo: part.partNo,
        dto: {
          id: created.id,
          effectiveDate: isoReq(created.effectiveDate),
          oldPrice,
          newPrice,
          deltaPct: deltaPct(oldPrice, newPrice),
          type: created.type,
          reason: created.reason,
          approvedBy: created.approvedBy?.name ?? null,
        } satisfies PriceChangeDto,
      };
    });

    void this.notifications.notify(
      'price.changed',
      `Price ${result.dto.type} on ${result.partNo}`,
      `${result.partNo}: ${result.dto.oldPrice ?? 'new'} → ${result.dto.newPrice}. Reason: ${result.dto.reason}`,
    );
    return result.dto;
  }

  /** Master price list (R2): current price + last change per part. */
  async master(q: { q?: string; customerId?: string }): Promise<MasterPriceItem[]> {
    const where: Prisma.PartWhereInput = {};
    if (q.customerId) where.customerId = q.customerId;
    if (q.q) {
      where.OR = [
        { partNo: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    const parts = await this.prisma.part.findMany({
      where,
      orderBy: { partNo: 'asc' },
      include: {
        customer: { select: { code: true, name: true } },
        priceChanges: { orderBy: { effectiveDate: 'desc' }, take: 1 },
      },
    });
    return parts.map((p) => ({
      partId: p.id,
      partNo: p.partNo,
      description: p.description,
      customerCode: p.customer.code,
      customerName: p.customer.name,
      status: p.status,
      currentPrice: num(p.currentPrice),
      lastChangeType: p.priceChanges[0]?.type ?? null,
      lastEffectiveDate: p.priceChanges[0] ? isoReq(p.priceChanges[0].effectiveDate) : null,
    }));
  }

  /** Cross-part price-change history incl. PVC (R2), filterable + paginated. */
  async changes(q: PriceChangesQuery): Promise<Paginated<PriceChangeListItem>> {
    const where: Prisma.PriceChangeWhereInput = {};
    if (q.type) where.type = q.type;
    if (q.from || q.to) {
      where.effectiveDate = {
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to ? { lte: new Date(q.to) } : {}),
      };
    }
    const partWhere: Prisma.PartWhereInput = {};
    if (q.customerId) partWhere.customerId = q.customerId;
    const search = q.q ?? q.partNo;
    if (search) {
      partWhere.OR = [
        { partNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(partWhere).length) where.part = partWhere;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.priceChange.count({ where }),
      this.prisma.priceChange.findMany({
        where,
        orderBy: { effectiveDate: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          part: { select: { partNo: true, description: true, customer: { select: { code: true } } } },
          approvedBy: { select: { name: true } },
        },
      }),
    ]);

    const data: PriceChangeListItem[] = rows.map((r) => {
      const oldPrice = num(r.oldPrice);
      const newPrice = numOr(r.newPrice);
      return {
        id: r.id,
        partId: r.partId,
        partNo: r.part.partNo,
        description: r.part.description,
        customerCode: r.part.customer.code,
        effectiveDate: isoReq(r.effectiveDate),
        oldPrice,
        newPrice,
        deltaPct: deltaPct(oldPrice, newPrice),
        type: r.type,
        reason: r.reason,
        approvedBy: r.approvedBy?.name ?? null,
      };
    });

    return {
      data,
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  }
}
