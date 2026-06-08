import { z } from 'zod';
import {
  FaiResultEnum,
  FopaResultEnum,
  PdcaStageEnum,
  PdcaStatusEnum,
  QualityRecordTypeEnum,
  type FopaResult,
  type PdcaStage,
  type PdcaStatus,
} from './enums';
import { listQuerySchema, optionalNonNegative } from './common';

// ── cycle time (audited — R6) ──
export const createCycleTimeSchema = z.object({
  cycleMin: z.coerce.number().nonnegative(),
  date: z.string().optional(),
  reason: z.string().min(3, 'Reason is required (captured in the audit trail)'),
});
export type CreateCycleTimeInput = z.infer<typeof createCycleTimeSchema>;

// ── quality record (audited — R6) ──
export const createQualityRecordSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: QualityRecordTypeEnum.default('INSPECTION'),
  result: z.string().optional(),
  defect: z.string().optional(),
  ppm: optionalNonNegative,
  remarks: z.string().optional(),
});
export type CreateQualityRecordInput = z.infer<typeof createQualityRecordSchema>;

// ── FAI ──
export const createFaiSchema = z.object({
  faiNo: z.string().min(1, 'FAI number is required'),
  date: z.string().min(1, 'Date is required'),
  qtyInspected: z.coerce.number().int().positive(),
  result: FaiResultEnum.default('PASS'),
  inspector: z.string().optional(),
  remarks: z.string().optional(),
});
export type CreateFaiInput = z.infer<typeof createFaiSchema>;

// ── pilot / production lots ──
export const createLotSchema = z.object({
  lotNo: z.string().min(1, 'Lot number is required'),
  date: z.string().min(1, 'Date is required'),
  qty: z.coerce.number().int().positive(),
  accepted: z.coerce.number().int().nonnegative().default(0),
  rejected: z.coerce.number().int().nonnegative().default(0),
  remarks: z.string().optional(),
});
export type CreateLotInput = z.infer<typeof createLotSchema>;

// ── FOPA (R4) ──
export const createFopaSchema = z.object({
  fopaNo: z.string().min(1, 'FOPA number is required'),
  date: z.string().min(1, 'Date is required'),
  result: FopaResultEnum.default('APPROVED'),
  characteristic: z.string().optional(),
  remarks: z.string().optional(),
});
export type CreateFopaInput = z.infer<typeof createFopaSchema>;

// ── PDCA (R4) ──
export const createPdcaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  stage: PdcaStageEnum.default('PLAN'),
  issue: z.string().optional(),
  action: z.string().optional(),
  owner: z.string().optional(),
  status: PdcaStatusEnum.default('OPEN'),
  targetDate: z.string().optional(),
});
export type CreatePdcaInput = z.infer<typeof createPdcaSchema>;

export const updatePdcaSchema = createPdcaSchema.partial();
export type UpdatePdcaInput = z.infer<typeof updatePdcaSchema>;

// ── cross-part list rows (Quality screen) ──
export interface FopaListItem {
  id: string;
  partId: string;
  partNo: string;
  description: string;
  customerCode: string;
  fopaNo: string;
  date: string;
  result: FopaResult;
  characteristic: string | null;
  approvedBy: string | null;
}

export interface PdcaListItem {
  id: string;
  partId: string;
  partNo: string;
  description: string;
  title: string;
  stage: PdcaStage;
  owner: string | null;
  status: PdcaStatus;
  targetDate: string | null;
  issue: string | null;
  action: string | null;
}

export const fopaQuerySchema = listQuerySchema.extend({ result: FopaResultEnum.optional() });
export type FopaQuery = z.infer<typeof fopaQuerySchema>;

export const pdcaQuerySchema = listQuerySchema.extend({
  stage: PdcaStageEnum.optional(),
  status: PdcaStatusEnum.optional(),
});
export type PdcaQuery = z.infer<typeof pdcaQuerySchema>;
