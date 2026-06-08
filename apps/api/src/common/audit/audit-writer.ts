import { Prisma } from '@prisma/client';
import { requestContext } from '../context/request-context';

/**
 * Audit trail (R6) — explicit, transactional writer (plan §6.3).
 *
 * Audited services call this INSIDE their `$transaction(async (tx) => …)` after the
 * business write, passing the same `tx`. The audit row(s) therefore commit
 * atomically with the change — an audit entry can never be lost while the change
 * succeeds. The acting user and IP come from the request-scoped context; the
 * mandatory `reason` is passed explicitly from the validated request body.
 *
 * Convention:
 *   • CREATE → one row, field=null, newValue = JSON snapshot
 *   • DELETE → one row, field=null, oldValue = JSON snapshot
 *   • UPDATE → one row per changed field (old → new)
 */
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';
type AnyRecord = Record<string, unknown>;

const IGNORED = new Set(['id', 'createdAt', 'updatedAt']);

function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (v instanceof Prisma.Decimal) return v.toString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export interface AuditParams {
  entity: string;
  entityId: string;
  partNo?: string | null;
  action: AuditAction;
  reason?: string | null;
  before?: AnyRecord | null;
  after?: AnyRecord | null;
}

export async function writeAudit(tx: Prisma.TransactionClient, p: AuditParams): Promise<void> {
  const ctx = requestContext.get();
  const base = {
    entity: p.entity,
    entityId: p.entityId,
    partNo: p.partNo ?? null,
    action: p.action,
    reason: p.reason ?? ctx?.reason ?? null,
    userId: ctx?.userId ?? null,
    ipAddress: ctx?.ip ?? null,
  };

  const rows: Prisma.AuditLogCreateManyInput[] = [];

  if (p.action === 'CREATE') {
    rows.push({ ...base, field: null, oldValue: null, newValue: snapshot(p.after) });
  } else if (p.action === 'DELETE') {
    rows.push({ ...base, field: null, oldValue: snapshot(p.before), newValue: null });
  } else {
    const fields = new Set([...Object.keys(p.before ?? {}), ...Object.keys(p.after ?? {})]);
    for (const field of fields) {
      if (IGNORED.has(field)) continue;
      const oldValue = toStr(p.before?.[field]);
      const newValue = toStr(p.after?.[field]);
      if (oldValue === newValue) continue;
      rows.push({ ...base, field, oldValue, newValue });
    }
  }

  if (rows.length > 0) await tx.auditLog.createMany({ data: rows });
}

function snapshot(obj: AnyRecord | null | undefined): string | null {
  if (!obj) return null;
  const clean: AnyRecord = {};
  for (const [k, v] of Object.entries(obj)) {
    if (IGNORED.has(k)) continue;
    clean[k] = v instanceof Prisma.Decimal ? v.toString() : v instanceof Date ? v.toISOString() : v;
  }
  return JSON.stringify(clean);
}
