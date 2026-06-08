import type {
  CreateCycleTimeInput,
  CreateLabourInput,
  CreateOperationInput,
  CreatePartInput,
  CreateQuotationInput,
  CreateSaleInput,
  Customer,
  CycleTimeDto,
  DossierResponse,
  LabourEntry,
  Operation,
  Paginated,
  PartListItem,
  Quotation,
  Sale,
} from '@caliper/shared';
import { api } from './api';

export interface PartsListParams {
  q?: string;
  customerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export async function listParts(params: PartsListParams): Promise<Paginated<PartListItem>> {
  const { data } = await api.get<Paginated<PartListItem>>('/parts', { params });
  return data;
}

export async function getDossier(
  id: string,
  range?: { from?: string; to?: string },
): Promise<DossierResponse> {
  const { data } = await api.get<DossierResponse>(`/parts/${id}/dossier`, { params: range });
  return data;
}

export async function createPart(input: CreatePartInput): Promise<PartListItem> {
  const { data } = await api.post<PartListItem>('/parts', input);
  return data;
}

export async function listCustomers(): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>('/customers');
  return data;
}

export async function createSale(partId: string, input: CreateSaleInput): Promise<Sale> {
  const { data } = await api.post<Sale>(`/parts/${partId}/sales`, input);
  return data;
}

export async function createQuotation(
  partId: string,
  input: CreateQuotationInput,
): Promise<Quotation> {
  const { data } = await api.post<Quotation>(`/parts/${partId}/quotations`, input);
  return data;
}

export async function addLabour(partId: string, input: CreateLabourInput): Promise<LabourEntry> {
  const { data } = await api.post<LabourEntry>(`/parts/${partId}/labour`, input);
  return data;
}

export async function addOperation(
  partId: string,
  input: CreateOperationInput,
): Promise<Operation> {
  const { data } = await api.post<Operation>(`/parts/${partId}/operations`, input);
  return data;
}

export async function createCycleTime(
  partId: string,
  input: CreateCycleTimeInput,
): Promise<CycleTimeDto> {
  const { data } = await api.post<CycleTimeDto>(`/parts/${partId}/cycle-times`, input);
  return data;
}
