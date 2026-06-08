import { z } from 'zod';

/**
 * Domain enums (plan §5.2). Defined once with Zod so both the API validation
 * layer and the SPA forms consume identical option lists. These mirror the
 * Prisma enums in apps/api/prisma/schema.prisma — keep the two in sync.
 */

export const RoleEnum = z.enum(['ADMIN', 'SALES', 'COSTING', 'QUALITY', 'VIEWER']);
export type Role = z.infer<typeof RoleEnum>;
export const ROLES = RoleEnum.options;

export const PartStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'NPD']);
export type PartStatus = z.infer<typeof PartStatusEnum>;

export const QuotationStatusEnum = z.enum(['WON', 'LOST', 'PENDING']);
export type QuotationStatus = z.infer<typeof QuotationStatusEnum>;

export const FaiResultEnum = z.enum(['PASS', 'FAIL']);
export type FaiResult = z.infer<typeof FaiResultEnum>;

export const PriceChangeTypeEnum = z.enum(['NEW', 'REVISION', 'PVC']);
export type PriceChangeType = z.infer<typeof PriceChangeTypeEnum>;

export const QualityRecordTypeEnum = z.enum(['INSPECTION', 'COMPLAINT', 'FAI', 'AUDIT']);
export type QualityRecordType = z.infer<typeof QualityRecordTypeEnum>;

export const FopaResultEnum = z.enum(['APPROVED', 'REJECTED', 'CONDITIONAL']);
export type FopaResult = z.infer<typeof FopaResultEnum>;

export const PdcaStageEnum = z.enum(['PLAN', 'DO', 'CHECK', 'ACT']);
export type PdcaStage = z.infer<typeof PdcaStageEnum>;

export const PdcaStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']);
export type PdcaStatus = z.infer<typeof PdcaStatusEnum>;

export const AuditActionEnum = z.enum(['CREATE', 'UPDATE', 'DELETE']);
export type AuditAction = z.infer<typeof AuditActionEnum>;
