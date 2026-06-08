import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateFaiInput,
  CreateFopaInput,
  CreateLotInput,
  CreatePdcaInput,
  CreateQualityRecordInput,
  FaiDto,
  FopaDto,
  FopaListItem,
  FopaQuery,
  LotDto,
  Paginated,
  PdcaDto,
  PdcaListItem,
  PdcaQuery,
  QualityDto,
  UpdatePdcaInput,
} from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { writeAudit } from '../../common/audit/audit-writer';
import { iso, isoReq, num, ppm } from '../../common/serialize';

@Injectable()
export class QualityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async partNo(tx: Prisma.TransactionClient | PrismaService, partId: string): Promise<string> {
    const part = await tx.part.findUnique({ where: { id: partId }, select: { partNo: true } });
    if (!part) throw new NotFoundException({ code: 'PART_NOT_FOUND', message: 'Part not found' });
    return part.partNo;
  }

  /** Quality record (R4) — audited (R6). */
  async addQualityRecord(partId: string, input: CreateQualityRecordInput): Promise<QualityDto> {
    return this.prisma.$transaction(async (tx) => {
      const partNo = await this.partNo(tx, partId);
      const created = await tx.qualityRecord.create({
        data: {
          partId,
          date: new Date(input.date),
          type: input.type,
          result: input.result || null,
          defect: input.defect || null,
          ppm: input.ppm ?? null,
          remarks: input.remarks || null,
        },
      });
      await writeAudit(tx, {
        entity: 'QualityRecord',
        entityId: created.id,
        partNo,
        action: 'CREATE',
        reason: input.remarks || input.result || input.type,
        after: {
          date: created.date,
          type: created.type,
          result: created.result,
          defect: created.defect,
          ppm: created.ppm,
        },
      });
      return {
        id: created.id,
        date: isoReq(created.date),
        type: created.type,
        result: created.result,
        defect: created.defect,
        ppm: num(created.ppm),
        remarks: created.remarks,
      };
    });
  }

  async addFai(partId: string, input: CreateFaiInput): Promise<FaiDto> {
    const partNo = await this.partNo(this.prisma, partId);
    const f = await this.prisma.faiRecord.create({
      data: {
        partId,
        faiNo: input.faiNo,
        date: new Date(input.date),
        qtyInspected: input.qtyInspected,
        result: input.result,
        inspector: input.inspector || null,
        remarks: input.remarks || null,
      },
    });
    if (f.result === 'FAIL') {
      void this.notifications.notify(
        'fai.failed',
        `FAI FAILED: ${partNo} (${f.faiNo})`,
        `First-article inspection ${f.faiNo} for ${partNo} failed. ${f.remarks ?? ''}`.trim(),
      );
    }
    return {
      id: f.id,
      faiNo: f.faiNo,
      date: isoReq(f.date),
      qtyInspected: f.qtyInspected,
      result: f.result,
      inspector: f.inspector,
      remarks: f.remarks,
    };
  }

  async addPilotLot(partId: string, input: CreateLotInput): Promise<LotDto> {
    await this.partNo(this.prisma, partId);
    const l = await this.prisma.pilotLot.create({
      data: {
        partId,
        lotNo: input.lotNo,
        date: new Date(input.date),
        qty: input.qty,
        accepted: input.accepted,
        rejected: input.rejected,
        remarks: input.remarks || null,
      },
    });
    return { ...lotDto(l), remarks: l.remarks };
  }

  async addProductionLot(partId: string, input: CreateLotInput): Promise<LotDto> {
    await this.partNo(this.prisma, partId);
    const l = await this.prisma.productionLot.create({
      data: {
        partId,
        lotNo: input.lotNo,
        date: new Date(input.date),
        qty: input.qty,
        accepted: input.accepted,
        rejected: input.rejected,
      },
    });
    return lotDto(l);
  }

  async addFopa(partId: string, input: CreateFopaInput, userId: string): Promise<FopaDto> {
    await this.partNo(this.prisma, partId);
    const f = await this.prisma.fopaRecord.create({
      data: {
        partId,
        fopaNo: input.fopaNo,
        date: new Date(input.date),
        result: input.result,
        characteristic: input.characteristic || null,
        remarks: input.remarks || null,
        approvedById: userId,
      },
      include: { approvedBy: { select: { name: true } } },
    });
    return {
      id: f.id,
      fopaNo: f.fopaNo,
      date: isoReq(f.date),
      result: f.result,
      characteristic: f.characteristic,
      remarks: f.remarks,
      approvedBy: f.approvedBy?.name ?? null,
    };
  }

  async addPdca(partId: string, input: CreatePdcaInput): Promise<PdcaDto> {
    await this.partNo(this.prisma, partId);
    const p = await this.prisma.pdcaItem.create({
      data: {
        partId,
        title: input.title,
        stage: input.stage,
        issue: input.issue || null,
        action: input.action || null,
        owner: input.owner || null,
        status: input.status,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      },
    });
    return pdcaDto(p);
  }

  async updatePdca(pdcaId: string, input: UpdatePdcaInput): Promise<PdcaDto> {
    const exists = await this.prisma.pdcaItem.findUnique({ where: { id: pdcaId }, select: { id: true } });
    if (!exists) throw new NotFoundException({ code: 'PDCA_NOT_FOUND', message: 'PDCA item not found' });
    const p = await this.prisma.pdcaItem.update({
      where: { id: pdcaId },
      data: {
        title: input.title,
        stage: input.stage,
        issue: input.issue,
        action: input.action,
        owner: input.owner,
        status: input.status,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      },
    });
    return pdcaDto(p);
  }

  // ── cross-part registers (Quality screen, R4) ──

  async listFopa(q: FopaQuery): Promise<Paginated<FopaListItem>> {
    const where: Prisma.FopaRecordWhereInput = {};
    if (q.result) where.result = q.result;
    if (q.from || q.to) {
      where.date = { ...(q.from ? { gte: new Date(q.from) } : {}), ...(q.to ? { lte: new Date(q.to) } : {}) };
    }
    const partWhere = buildPartWhere(q.q ?? q.partNo, q.customerId);
    if (partWhere) where.part = partWhere;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.fopaRecord.count({ where }),
      this.prisma.fopaRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          part: { select: { partNo: true, description: true, customer: { select: { code: true } } } },
          approvedBy: { select: { name: true } },
        },
      }),
    ]);
    return paginate(
      rows.map((r) => ({
        id: r.id,
        partId: r.partId,
        partNo: r.part.partNo,
        description: r.part.description,
        customerCode: r.part.customer.code,
        fopaNo: r.fopaNo,
        date: isoReq(r.date),
        result: r.result,
        characteristic: r.characteristic,
        approvedBy: r.approvedBy?.name ?? null,
      })),
      q,
      total,
    );
  }

  async listPdca(q: PdcaQuery): Promise<Paginated<PdcaListItem>> {
    const where: Prisma.PdcaItemWhereInput = {};
    if (q.stage) where.stage = q.stage;
    if (q.status) where.status = q.status;
    const partWhere = buildPartWhere(q.q ?? q.partNo, q.customerId);
    if (partWhere) where.part = partWhere;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.pdcaItem.count({ where }),
      this.prisma.pdcaItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { part: { select: { partNo: true, description: true } } },
      }),
    ]);
    return paginate(
      rows.map((r) => ({
        id: r.id,
        partId: r.partId,
        partNo: r.part.partNo,
        description: r.part.description,
        title: r.title,
        stage: r.stage,
        owner: r.owner,
        status: r.status,
        targetDate: iso(r.targetDate),
        issue: r.issue,
        action: r.action,
      })),
      q,
      total,
    );
  }
}

function lotDto(l: { id: string; lotNo: string; date: Date; qty: number; accepted: number; rejected: number }): LotDto {
  return {
    id: l.id,
    lotNo: l.lotNo,
    date: isoReq(l.date),
    qty: l.qty,
    accepted: l.accepted,
    rejected: l.rejected,
    ppm: ppm(l.accepted, l.rejected),
  };
}

function pdcaDto(p: {
  id: string;
  title: string;
  stage: PdcaDto['stage'];
  issue: string | null;
  action: string | null;
  owner: string | null;
  status: PdcaDto['status'];
  targetDate: Date | null;
}): PdcaDto {
  return {
    id: p.id,
    title: p.title,
    stage: p.stage,
    issue: p.issue,
    action: p.action,
    owner: p.owner,
    status: p.status,
    targetDate: iso(p.targetDate),
  };
}

function buildPartWhere(search?: string, customerId?: string): Prisma.PartWhereInput | undefined {
  const w: Prisma.PartWhereInput = {};
  if (customerId) w.customerId = customerId;
  if (search) {
    w.OR = [
      { partNo: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  return Object.keys(w).length ? w : undefined;
}

function paginate<T>(data: T[], q: { page: number; pageSize: number }, total: number): Paginated<T> {
  return {
    data,
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}
