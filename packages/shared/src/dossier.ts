import type {
  FaiResult,
  FopaResult,
  PdcaStage,
  PdcaStatus,
  PriceChangeType,
  QualityRecordType,
} from './enums';
import type { PartListItem } from './part';
import type { LabourEntry } from './labour';
import type { Operation } from './operation';
import type { Sale } from './sale';
import type { Quotation } from './quotation';

/**
 * Full part history aggregate (R1) returned by GET /parts/:id/dossier.
 *
 * Phase 1 owns the read of every section. The write flows for cycle time,
 * pricing/PVC, and quality/CI arrive in Phases 2–3; those sections are read-only
 * here (their data already exists from the seed and earlier entry).
 */

export interface FaiDto {
  id: string;
  faiNo: string;
  date: string;
  qtyInspected: number;
  result: FaiResult;
  inspector: string | null;
  remarks: string | null;
}

export interface LotDto {
  id: string;
  lotNo: string;
  date: string;
  qty: number;
  accepted: number;
  rejected: number;
  ppm: number; // computed = rejected / (accepted + rejected) × 1e6
  remarks?: string | null;
}

export interface CycleTimeDto {
  id: string;
  rev: number;
  date: string;
  cycleMin: number;
  reason: string;
  approvedBy: string | null;
}

export interface PriceChangeDto {
  id: string;
  effectiveDate: string;
  oldPrice: number | null;
  newPrice: number;
  deltaPct: number | null; // (new - old) / old × 100
  type: PriceChangeType;
  reason: string;
  approvedBy: string | null;
}

export interface QualityDto {
  id: string;
  date: string;
  type: QualityRecordType;
  result: string | null;
  defect: string | null;
  ppm: number | null;
  remarks: string | null;
}

export interface FopaDto {
  id: string;
  fopaNo: string;
  date: string;
  result: FopaResult;
  characteristic: string | null;
  remarks: string | null;
  approvedBy: string | null;
}

export interface PdcaDto {
  id: string;
  title: string;
  stage: PdcaStage;
  issue: string | null;
  action: string | null;
  owner: string | null;
  status: PdcaStatus;
  targetDate: string | null;
}

export interface DossierSummary {
  salesCount: number;
  totalSalesQty: number;
  totalSalesValue: number;
  quotationCount: number;
  winRatePct: number | null;
  latestPrice: number | null;
  stdCycleMin: number | null;
  openPdca: number;
  avgProductionPpm: number | null;
}

export interface DossierResponse {
  part: PartListItem;
  summary: DossierSummary;
  labour: LabourEntry[];
  operations: Operation[];
  sales: Sale[];
  quotations: Quotation[];
  fai: FaiDto[];
  pilotLots: LotDto[];
  productionLots: LotDto[];
  cycleTimes: CycleTimeDto[];
  priceChanges: PriceChangeDto[];
  quality: QualityDto[];
  fopa: FopaDto[];
  pdca: PdcaDto[];
}
