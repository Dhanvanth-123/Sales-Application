import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, QuotationStatus } from '@prisma/client';
import type { CreateQuotationInput, Quotation } from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { iso, isoReq, numOr } from '../../common/serialize';

type DbQuotation = {
  id: string;
  partId: string;
  customerId: string;
  quoteNo: string;
  date: Date;
  qty: number;
  quotedPrice: Prisma.Decimal;
  status: QuotationStatus;
  validUntil: Date | null;
};

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForPart(partId: string): Promise<Quotation[]> {
    const rows = await this.prisma.quotation.findMany({
      where: { partId },
      orderBy: { date: 'desc' },
    });
    return rows.map(QuotationsService.toDto);
  }

  async createForPart(partId: string, input: CreateQuotationInput): Promise<Quotation> {
    const part = await this.prisma.part.findUnique({
      where: { id: partId },
      select: { customerId: true },
    });
    if (!part) throw new NotFoundException({ code: 'PART_NOT_FOUND', message: 'Part not found' });

    const row = await this.prisma.quotation.create({
      data: {
        partId,
        customerId: input.customerId ?? part.customerId,
        quoteNo: input.quoteNo,
        date: new Date(input.date),
        qty: input.qty,
        quotedPrice: input.quotedPrice,
        status: input.status,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      },
    });
    return QuotationsService.toDto(row);
  }

  static toDto(q: DbQuotation): Quotation {
    return {
      id: q.id,
      partId: q.partId,
      customerId: q.customerId,
      quoteNo: q.quoteNo,
      date: isoReq(q.date),
      qty: q.qty,
      quotedPrice: numOr(q.quotedPrice),
      status: q.status,
      validUntil: iso(q.validUntil),
    };
  }
}
