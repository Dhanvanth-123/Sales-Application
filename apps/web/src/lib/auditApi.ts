import type { AuditAction, Paginated } from '@caliper/shared';
import { api } from './api';

export interface AuditRecord {
  id: string;
  ts: string;
  entity: string;
  entityId: string;
  partNo: string | null;
  action: AuditAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  ipAddress: string | null;
  user: { name: string; email: string } | null;
}

export interface AuditParams {
  entity?: string;
  partNo?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function getAudit(params: AuditParams): Promise<Paginated<AuditRecord>> {
  const { data } = await api.get<Paginated<AuditRecord>>('/audit', { params });
  return data;
}
