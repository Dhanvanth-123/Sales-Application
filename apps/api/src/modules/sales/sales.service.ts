import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateSaleInput, Sale } from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isoReq, numOr } from '../../common/serialize';

type DbSale = {
  id: string;
  partId: string;
  customerId: string;
  date: Date;
  soNo: string | null;
  qty: number;
  unitPrice: Prisma.Decimal;
};

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForPart(partId: string): Promise<Sale[]> {
    const rows = await this.prisma.sale.findMany({ where: { partId }, orderBy: { date: 'desc' } });
    return rows.map(SalesService.toDto);
  }

  async createForPart(partId: string, input: CreateSaleInput): Promise<Sale> {
    const part = await this.prisma.part.findUnique({
      where: { id: partId },
      select: { customerId: true },
    });
    if (!part) throw new NotFoundException({ code: 'PART_NOT_FOUND', message: 'Part not found' });

    const row = await this.prisma.sale.create({
      data: {
        partId,
        customerId: input.customerId ?? part.customerId,
        date: new Date(input.date),
        soNo: input.soNo || null,
        qty: input.qty,
        unitPrice: input.unitPrice,
      },
    });
    return SalesService.toDto(row);
  }

  static toDto(s: DbSale): Sale {
    const unitPrice = numOr(s.unitPrice);
    return {
      id: s.id,
      partId: s.partId,
      customerId: s.customerId,
      date: isoReq(s.date),
      soNo: s.soNo,
      qty: s.qty,
      unitPrice,
      value: s.qty * unitPrice,
    };
  }
}
