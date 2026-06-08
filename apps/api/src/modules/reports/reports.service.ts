import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CustomerWiseRow,
  DashboardData,
  MonthWiseRow,
  TopPartRow,
} from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface ReportFilter {
  from?: string;
  to?: string;
  customerId?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private bounds(f: ReportFilter) {
    // inclusive day boundaries: from = start of day, to = end of day (UTC)
    return {
      fromD: f.from ? new Date(`${f.from}T00:00:00.000Z`) : null,
      toD: f.to ? new Date(`${f.to}T23:59:59.999Z`) : null,
      cust: f.customerId || null,
    };
  }

  /** Customer-wise sales (R3). */
  async customerWise(f: ReportFilter): Promise<CustomerWiseRow[]> {
    const { fromD, toD } = this.bounds(f);
    return this.prisma.$queryRaw<CustomerWiseRow[]>(Prisma.sql`
      SELECT c.id AS "customerId", c.code AS "customerCode", c.name AS "customerName",
             COUNT(s.id)::int AS orders,
             COALESCE(SUM(s.qty), 0)::int AS qty,
             COALESCE(SUM(s.qty * s."unitPrice"), 0)::float AS value
      FROM "sale" s
      JOIN "customer" c ON c.id = s."customerId"
      WHERE (${fromD}::timestamp IS NULL OR s."date" >= ${fromD})
        AND (${toD}::timestamp IS NULL OR s."date" <= ${toD})
      GROUP BY c.id, c.code, c.name
      ORDER BY value DESC
    `);
  }

  /** Month-wise sales (R3). */
  async monthWise(f: ReportFilter): Promise<MonthWiseRow[]> {
    const { fromD, toD, cust } = this.bounds(f);
    return this.prisma.$queryRaw<MonthWiseRow[]>(Prisma.sql`
      SELECT to_char(date_trunc('month', s."date"), 'YYYY-MM') AS month,
             COUNT(s.id)::int AS orders,
             COALESCE(SUM(s.qty), 0)::int AS qty,
             COALESCE(SUM(s.qty * s."unitPrice"), 0)::float AS value
      FROM "sale" s
      WHERE (${fromD}::timestamp IS NULL OR s."date" >= ${fromD})
        AND (${toD}::timestamp IS NULL OR s."date" <= ${toD})
        AND (${cust}::text IS NULL OR s."customerId" = ${cust})
      GROUP BY 1
      ORDER BY 1 ASC
    `);
  }

  private async topParts(f: ReportFilter): Promise<TopPartRow[]> {
    const { fromD, toD, cust } = this.bounds(f);
    return this.prisma.$queryRaw<TopPartRow[]>(Prisma.sql`
      SELECT p.id AS "partId", p."partNo" AS "partNo", p.description AS description,
             COALESCE(SUM(s.qty), 0)::int AS qty,
             COALESCE(SUM(s.qty * s."unitPrice"), 0)::float AS value
      FROM "sale" s
      JOIN "part" p ON p.id = s."partId"
      WHERE (${fromD}::timestamp IS NULL OR s."date" >= ${fromD})
        AND (${toD}::timestamp IS NULL OR s."date" <= ${toD})
        AND (${cust}::text IS NULL OR s."customerId" = ${cust})
      GROUP BY p.id, p."partNo", p.description
      ORDER BY value DESC
      LIMIT 8
    `);
  }

  /** Dashboard KPIs + chart series (R3). */
  async dashboard(f: ReportFilter): Promise<DashboardData> {
    const [monthly, customerSplitRaw, topParts, quoteGroups, partsCount, activeParts, customersCount, openPdca] =
      await Promise.all([
        this.monthWise(f),
        this.customerWise(f),
        this.topParts(f),
        this.prisma.quotation.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.part.count(),
        this.prisma.part.count({ where: { status: 'ACTIVE' } }),
        this.prisma.customer.count(),
        this.prisma.pdcaItem.count({ where: { status: { not: 'CLOSED' } } }),
      ]);

    const totalSalesValue = monthly.reduce((a, m) => a + m.value, 0);
    const totalSalesQty = monthly.reduce((a, m) => a + m.qty, 0);
    const salesOrders = monthly.reduce((a, m) => a + m.orders, 0);

    const won = quoteGroups.find((g) => g.status === 'WON')?._count._all ?? 0;
    const lost = quoteGroups.find((g) => g.status === 'LOST')?._count._all ?? 0;
    const decided = won + lost;

    return {
      kpis: {
        totalSalesValue,
        totalSalesQty,
        salesOrders,
        partsCount,
        activeParts,
        customersCount,
        quoteWinRatePct: decided > 0 ? (won / decided) * 100 : null,
        openPdca,
      },
      monthly,
      topParts,
      quoteStatus: quoteGroups.map((g) => ({ status: g.status, count: g._count._all })),
      customerSplit: customerSplitRaw.map((c) => ({
        customerCode: c.customerCode,
        customerName: c.customerName,
        value: c.value,
      })),
    };
  }
}
