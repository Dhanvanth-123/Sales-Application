import { Prisma, PrismaClient } from '@prisma/client';
import { requestContext } from '../context/request-context';

/**
 * Audit trail (R6) — application layer (plan §6.3).
 *
 * A Prisma Client Extension that, for the three AUDITED models, writes one
 * `audit_log` row per changed field. The acting user, IP, and mandatory `reason`
 * are read from the request-scoped context (request-context.ts), populated by the
 * auth guard and the audited controllers.
 *
 * IMPORTANT (same-transaction guarantee): for the audit row to be atomic with the
 * business write, the calling service must run the write inside an interactive
 * `$transaction` and pass the transaction client. The pricing/quality services
 * (Phases 2–3) do exactly that. This file is the shared mechanism; it is wired up
 * in PrismaModule so it is ready when those services arrive.
 */

/** Prisma model names that must be audited. */
const AUDITED_MODELS = new Set<string>(['PriceChange', 'CycleTimeRevision', 'QualityRecord']);

/** Columns that never count as a meaningful change for the diff. */
const IGNORED_FIELDS = new Set<string>(['id', 'createdAt', 'updatedAt']);

type AnyRecord = Record<string, unknown>;

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

async function writeAuditRows(
  tx: Prisma.TransactionClient,
  model: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  before: AnyRecord | null,
  after: AnyRecord | null,
): Promise<void> {
  const ctx = requestContext.get();
  const entityId = (after?.id ?? before?.id ?? '') as string;
  const partId = (after?.partId ?? before?.partId) as string | undefined;
  let partNo: string | null = null;
  if (partId) {
    const part = await tx.part.findUnique({ where: { id: partId }, select: { partNo: true } });
    partNo = part?.partNo ?? null;
  }

  const fields = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const rows: Prisma.AuditLogCreateManyInput[] = [];
  for (const field of fields) {
    if (IGNORED_FIELDS.has(field)) continue;
    const oldValue = toStr(before?.[field]);
    const newValue = toStr(after?.[field]);
    if (action === 'UPDATE' && oldValue === newValue) continue;
    rows.push({
      entity: model,
      entityId,
      partNo,
      action,
      field,
      oldValue,
      newValue,
      reason: ctx?.reason ?? null,
      userId: ctx?.userId ?? null,
      ipAddress: ctx?.ip ?? null,
    });
  }
  if (rows.length > 0) await tx.auditLog.createMany({ data: rows });
}

/**
 * Build an extended client. `base` is used to read the prior row and to write
 * audit entries. When a service already holds a transaction client it should pass
 * it as `base` so the audit write is atomic with the business write.
 */
export function withAudit(base: PrismaClient | Prisma.TransactionClient) {
  return (base as PrismaClient).$extends({
    name: 'caliper-audit',
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = (await query(args)) as AnyRecord;
          if (AUDITED_MODELS.has(model)) {
            await writeAuditRows(base as Prisma.TransactionClient, model, 'CREATE', null, result);
          }
          return result;
        },
        async update({ model, args, query }) {
          if (!AUDITED_MODELS.has(model)) return query(args);
          const delegate = (base as AnyRecord)[lowerFirst(model)] as {
            findUnique: (a: unknown) => Promise<AnyRecord | null>;
          };
          const before = await delegate.findUnique({ where: (args as AnyRecord).where });
          const result = (await query(args)) as AnyRecord;
          await writeAuditRows(base as Prisma.TransactionClient, model, 'UPDATE', before, result);
          return result;
        },
        async delete({ model, args, query }) {
          if (!AUDITED_MODELS.has(model)) return query(args);
          const delegate = (base as AnyRecord)[lowerFirst(model)] as {
            findUnique: (a: unknown) => Promise<AnyRecord | null>;
          };
          const before = await delegate.findUnique({ where: (args as AnyRecord).where });
          const result = (await query(args)) as AnyRecord;
          await writeAuditRows(base as Prisma.TransactionClient, model, 'DELETE', before, null);
          return result;
        },
      },
    },
  });
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
