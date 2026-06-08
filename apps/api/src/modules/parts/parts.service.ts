import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateCycleTimeInput,
  CreateLabourInput,
  CreateOperationInput,
  CreatePartInput,
  CycleTimeDto,
  DossierResponse,
  LabourEntry,
  Operation,
  Paginated,
  PartListItem,
  PartsQuery,
  UpdatePartInput,
} from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { writeAudit } from '../../common/audit/audit-writer';
import { deltaPct, iso, isoReq, num, numOr, ppm } from '../../common/serialize';

const PART_SORT_FIELDS = new Set([
  'partNo',
  'description',
  'currentPrice',
  'stdCycleMin',
  'createdAt',
  'status',
]);

type PartWithCustomer = Prisma.PartGetPayload<{ include: { customer: true } }>;

@Injectable()
export class PartsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── list / detail / CRUD ──────────────────────────────────────────────

  async list(q: PartsQuery): Promise<Paginated<PartListItem>> {
    const where: Prisma.PartWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.customerId) where.customerId = q.customerId;
    const search = q.q ?? q.partNo;
    if (search) {
      where.OR = [
        { partNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.part.count({ where }),
      this.prisma.part.findMany({
        where,
        orderBy: this.buildOrderBy(q.sort),
        include: { customer: true },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    return {
      data: rows.map(PartsService.toListItem),
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  }

  async findOne(id: string): Promise<PartListItem> {
    const row = await this.prisma.part.findUnique({ where: { id }, include: { customer: true } });
    if (!row) throw this.notFound();
    return PartsService.toListItem(row);
  }

  async create(input: CreatePartInput): Promise<PartListItem> {
    const row = await this.prisma.part.create({
      data: {
        partNo: input.partNo,
        description: input.description,
        customerId: input.customerId,
        material: input.material || null,
        drawingNo: input.drawingNo || null,
        status: input.status,
        uom: input.uom,
        currentPrice: input.currentPrice ?? null,
        stdCycleMin: input.stdCycleMin ?? null,
      },
      include: { customer: true },
    });
    return PartsService.toListItem(row);
  }

  async update(id: string, input: UpdatePartInput): Promise<PartListItem> {
    await this.ensurePart(id);
    const row = await this.prisma.part.update({
      where: { id },
      data: {
        description: input.description,
        customerId: input.customerId,
        material: input.material,
        drawingNo: input.drawingNo,
        status: input.status,
        uom: input.uom,
        currentPrice: input.currentPrice,
        stdCycleMin: input.stdCycleMin,
      },
      include: { customer: true },
    });
    return PartsService.toListItem(row);
  }

  // ── dossier (R1) ──────────────────────────────────────────────────────

  async dossier(id: string, from?: string, to?: string): Promise<DossierResponse> {
    const range = dateRange(from, to);
    const dateWhere = range ? { date: range } : undefined;

    const part = await this.prisma.part.findUnique({
      where: { id },
      include: {
        customer: true,
        labourEntries: true,
        operations: { orderBy: { seq: 'asc' } },
        sales: { where: dateWhere, orderBy: { date: 'desc' } },
        quotations: { where: dateWhere, orderBy: { date: 'desc' } },
        faiRecords: { where: dateWhere, orderBy: { date: 'desc' } },
        pilotLots: { where: dateWhere, orderBy: { date: 'desc' } },
        productionLots: { where: dateWhere, orderBy: { date: 'desc' } },
        cycleTimeRevisions: {
          where: dateWhere,
          orderBy: { rev: 'desc' },
          include: { approvedBy: { select: { name: true } } },
        },
        priceChanges: {
          where: range ? { effectiveDate: range } : undefined,
          orderBy: { effectiveDate: 'desc' },
          include: { approvedBy: { select: { name: true } } },
        },
        qualityRecords: { where: dateWhere, orderBy: { date: 'desc' } },
        fopaRecords: {
          where: dateWhere,
          orderBy: { date: 'desc' },
          include: { approvedBy: { select: { name: true } } },
        },
        pdcaItems: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!part) throw this.notFound();

    const sales = part.sales.map((s) => ({
      id: s.id,
      partId: s.partId,
      customerId: s.customerId,
      date: isoReq(s.date),
      soNo: s.soNo,
      qty: s.qty,
      unitPrice: numOr(s.unitPrice),
      value: s.qty * numOr(s.unitPrice),
    }));

    const productionLots = part.productionLots.map((l) => ({
      id: l.id,
      lotNo: l.lotNo,
      date: isoReq(l.date),
      qty: l.qty,
      accepted: l.accepted,
      rejected: l.rejected,
      ppm: ppm(l.accepted, l.rejected),
    }));

    const wins = part.quotations.filter((q) => q.status === 'WON').length;
    const losses = part.quotations.filter((q) => q.status === 'LOST').length;
    const decided = wins + losses;
    const prodPpms = productionLots.map((l) => l.ppm);

    return {
      part: PartsService.toListItem(part),
      summary: {
        salesCount: sales.length,
        totalSalesQty: sales.reduce((a, s) => a + s.qty, 0),
        totalSalesValue: sales.reduce((a, s) => a + s.value, 0),
        quotationCount: part.quotations.length,
        winRatePct: decided > 0 ? (wins / decided) * 100 : null,
        latestPrice: num(part.currentPrice),
        stdCycleMin: num(part.stdCycleMin),
        openPdca: part.pdcaItems.filter((p) => p.status !== 'CLOSED').length,
        avgProductionPpm:
          prodPpms.length > 0 ? Math.round(prodPpms.reduce((a, b) => a + b, 0) / prodPpms.length) : null,
      },
      labour: part.labourEntries.map(PartsService.toLabour),
      operations: part.operations.map(PartsService.toOperation),
      sales,
      quotations: part.quotations.map((q) => ({
        id: q.id,
        partId: q.partId,
        customerId: q.customerId,
        quoteNo: q.quoteNo,
        date: isoReq(q.date),
        qty: q.qty,
        quotedPrice: numOr(q.quotedPrice),
        status: q.status,
        validUntil: iso(q.validUntil),
      })),
      fai: part.faiRecords.map((f) => ({
        id: f.id,
        faiNo: f.faiNo,
        date: isoReq(f.date),
        qtyInspected: f.qtyInspected,
        result: f.result,
        inspector: f.inspector,
        remarks: f.remarks,
      })),
      pilotLots: part.pilotLots.map((l) => ({
        id: l.id,
        lotNo: l.lotNo,
        date: isoReq(l.date),
        qty: l.qty,
        accepted: l.accepted,
        rejected: l.rejected,
        ppm: ppm(l.accepted, l.rejected),
        remarks: l.remarks,
      })),
      productionLots,
      cycleTimes: part.cycleTimeRevisions.map((c) => ({
        id: c.id,
        rev: c.rev,
        date: isoReq(c.date),
        cycleMin: numOr(c.cycleMin),
        reason: c.reason,
        approvedBy: c.approvedBy?.name ?? null,
      })),
      priceChanges: part.priceChanges.map((p) => {
        const oldPrice = num(p.oldPrice);
        const newPrice = numOr(p.newPrice);
        return {
          id: p.id,
          effectiveDate: isoReq(p.effectiveDate),
          oldPrice,
          newPrice,
          deltaPct: deltaPct(oldPrice, newPrice),
          type: p.type,
          reason: p.reason,
          approvedBy: p.approvedBy?.name ?? null,
        };
      }),
      quality: part.qualityRecords.map((qr) => ({
        id: qr.id,
        date: isoReq(qr.date),
        type: qr.type,
        result: qr.result,
        defect: qr.defect,
        ppm: num(qr.ppm),
        remarks: qr.remarks,
      })),
      fopa: part.fopaRecords.map((f) => ({
        id: f.id,
        fopaNo: f.fopaNo,
        date: isoReq(f.date),
        result: f.result,
        characteristic: f.characteristic,
        remarks: f.remarks,
        approvedBy: f.approvedBy?.name ?? null,
      })),
      pdca: part.pdcaItems.map((p) => ({
        id: p.id,
        title: p.title,
        stage: p.stage,
        issue: p.issue,
        action: p.action,
        owner: p.owner,
        status: p.status,
        targetDate: iso(p.targetDate),
      })),
    };
  }

  // ── nested: labour & operations ───────────────────────────────────────

  async listLabour(partId: string): Promise<LabourEntry[]> {
    await this.ensurePart(partId);
    const rows = await this.prisma.labourEntry.findMany({ where: { partId } });
    return rows.map(PartsService.toLabour);
  }

  async addLabour(partId: string, input: CreateLabourInput): Promise<LabourEntry> {
    await this.ensurePart(partId);
    const row = await this.prisma.labourEntry.create({
      data: {
        partId,
        operation: input.operation,
        grade: input.grade || null,
        ratePerHr: input.ratePerHr,
        stdTimeMin: input.stdTimeMin,
      },
    });
    return PartsService.toLabour(row);
  }

  async listOperations(partId: string): Promise<Operation[]> {
    await this.ensurePart(partId);
    const rows = await this.prisma.operation.findMany({ where: { partId }, orderBy: { seq: 'asc' } });
    return rows.map(PartsService.toOperation);
  }

  async addOperation(partId: string, input: CreateOperationInput): Promise<Operation> {
    await this.ensurePart(partId);
    const row = await this.prisma.operation.create({
      data: {
        partId,
        seq: input.seq,
        operation: input.operation,
        machine: input.machine || null,
        setupMin: input.setupMin,
        cycleMin: input.cycleMin,
        tooling: input.tooling || null,
      },
    });
    return PartsService.toOperation(row);
  }

  /** New cycle-time revision (R1) — atomic with the audit row (R6). rev auto-increments. */
  async addCycleTime(
    partId: string,
    input: CreateCycleTimeInput,
    userId: string,
  ): Promise<CycleTimeDto> {
    return this.prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({
        where: { id: partId },
        select: { id: true, partNo: true, stdCycleMin: true },
      });
      if (!part) throw this.notFound();

      const last = await tx.cycleTimeRevision.findFirst({
        where: { partId },
        orderBy: { rev: 'desc' },
        select: { rev: true },
      });
      const rev = (last?.rev ?? 0) + 1;
      const oldCycle = num(part.stdCycleMin);

      const created = await tx.cycleTimeRevision.create({
        data: {
          partId,
          rev,
          date: input.date ? new Date(input.date) : new Date(),
          cycleMin: input.cycleMin,
          reason: input.reason,
          approvedById: userId,
        },
        include: { approvedBy: { select: { name: true } } },
      });
      await tx.part.update({ where: { id: partId }, data: { stdCycleMin: input.cycleMin } });

      await writeAudit(tx, {
        entity: 'CycleTimeRevision',
        entityId: created.id,
        partNo: part.partNo,
        action: 'UPDATE',
        reason: input.reason,
        before: { stdCycleMin: oldCycle },
        after: { stdCycleMin: input.cycleMin },
      });

      return {
        id: created.id,
        rev: created.rev,
        date: isoReq(created.date),
        cycleMin: numOr(created.cycleMin),
        reason: created.reason,
        approvedBy: created.approvedBy?.name ?? null,
      };
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────

  private async ensurePart(id: string): Promise<void> {
    const exists = await this.prisma.part.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw this.notFound();
  }

  private notFound(): NotFoundException {
    return new NotFoundException({ code: 'PART_NOT_FOUND', message: 'Part not found' });
  }

  private buildOrderBy(sort?: string): Prisma.PartOrderByWithRelationInput {
    if (!sort) return { partNo: 'asc' };
    const [field, dirRaw] = sort.split(':');
    if (!PART_SORT_FIELDS.has(field)) return { partNo: 'asc' };
    const dir: Prisma.SortOrder = dirRaw === 'desc' ? 'desc' : 'asc';
    return { [field]: dir } as Prisma.PartOrderByWithRelationInput;
  }

  static toListItem(p: PartWithCustomer): PartListItem {
    return {
      id: p.id,
      partNo: p.partNo,
      description: p.description,
      customerId: p.customerId,
      customerName: p.customer.name,
      customerCode: p.customer.code,
      material: p.material,
      drawingNo: p.drawingNo,
      status: p.status,
      uom: p.uom,
      currentPrice: num(p.currentPrice),
      stdCycleMin: num(p.stdCycleMin),
      createdAt: isoReq(p.createdAt),
    };
  }

  static toLabour(l: {
    id: string;
    partId: string;
    operation: string;
    grade: string | null;
    ratePerHr: Prisma.Decimal;
    stdTimeMin: Prisma.Decimal;
  }): LabourEntry {
    const ratePerHr = numOr(l.ratePerHr);
    const stdTimeMin = numOr(l.stdTimeMin);
    return {
      id: l.id,
      partId: l.partId,
      operation: l.operation,
      grade: l.grade,
      ratePerHr,
      stdTimeMin,
      costPerPc: (ratePerHr * stdTimeMin) / 60,
    };
  }

  static toOperation(o: {
    id: string;
    partId: string;
    seq: number;
    operation: string;
    machine: string | null;
    setupMin: Prisma.Decimal;
    cycleMin: Prisma.Decimal;
    tooling: string | null;
  }): Operation {
    return {
      id: o.id,
      partId: o.partId,
      seq: o.seq,
      operation: o.operation,
      machine: o.machine,
      setupMin: numOr(o.setupMin),
      cycleMin: numOr(o.cycleMin),
      tooling: o.tooling,
    };
  }
}

/** Build a Prisma date range filter, or undefined when no bounds given. */
function dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}
