import type {
  CreateFaiInput,
  CreateFopaInput,
  CreateLotInput,
  CreatePdcaInput,
  CreateQualityRecordInput,
  FaiDto,
  FopaDto,
  FopaListItem,
  LotDto,
  Paginated,
  PdcaDto,
  PdcaListItem,
  QualityDto,
  UpdatePdcaInput,
} from '@caliper/shared';
import { api } from './api';

export interface FopaParams {
  q?: string;
  customerId?: string;
  result?: string;
  page?: number;
  pageSize?: number;
}
export interface PdcaParams {
  q?: string;
  customerId?: string;
  stage?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listFopa(params: FopaParams): Promise<Paginated<FopaListItem>> {
  const { data } = await api.get<Paginated<FopaListItem>>('/quality/fopa', { params });
  return data;
}
export async function listPdca(params: PdcaParams): Promise<Paginated<PdcaListItem>> {
  const { data } = await api.get<Paginated<PdcaListItem>>('/quality/pdca', { params });
  return data;
}

export async function addQuality(partId: string, input: CreateQualityRecordInput): Promise<QualityDto> {
  const { data } = await api.post<QualityDto>(`/parts/${partId}/quality`, input);
  return data;
}
export async function addFai(partId: string, input: CreateFaiInput): Promise<FaiDto> {
  const { data } = await api.post<FaiDto>(`/parts/${partId}/fai`, input);
  return data;
}
export async function addPilotLot(partId: string, input: CreateLotInput): Promise<LotDto> {
  const { data } = await api.post<LotDto>(`/parts/${partId}/pilot-lots`, input);
  return data;
}
export async function addProductionLot(partId: string, input: CreateLotInput): Promise<LotDto> {
  const { data } = await api.post<LotDto>(`/parts/${partId}/production-lots`, input);
  return data;
}
export async function addFopa(partId: string, input: CreateFopaInput): Promise<FopaDto> {
  const { data } = await api.post<FopaDto>(`/parts/${partId}/fopa`, input);
  return data;
}
export async function addPdca(partId: string, input: CreatePdcaInput): Promise<PdcaDto> {
  const { data } = await api.post<PdcaDto>(`/parts/${partId}/pdca`, input);
  return data;
}
export async function updatePdca(partId: string, pdcaId: string, input: UpdatePdcaInput): Promise<PdcaDto> {
  const { data } = await api.patch<PdcaDto>(`/parts/${partId}/pdca/${pdcaId}`, input);
  return data;
}
