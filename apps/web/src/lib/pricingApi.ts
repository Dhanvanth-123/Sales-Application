import type {
  CreatePriceChangeInput,
  MasterPriceItem,
  Paginated,
  PriceChangeDto,
  PriceChangeListItem,
} from '@caliper/shared';
import { api } from './api';

export async function getMaster(params: { q?: string; customerId?: string }): Promise<MasterPriceItem[]> {
  const { data } = await api.get<MasterPriceItem[]>('/pricing/master', { params });
  return data;
}

export interface ChangesParams {
  q?: string;
  customerId?: string;
  from?: string;
  to?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export async function getPriceChanges(params: ChangesParams): Promise<Paginated<PriceChangeListItem>> {
  const { data } = await api.get<Paginated<PriceChangeListItem>>('/pricing/changes', { params });
  return data;
}

export async function createPrice(partId: string, input: CreatePriceChangeInput): Promise<PriceChangeDto> {
  const { data } = await api.post<PriceChangeDto>(`/parts/${partId}/price`, input);
  return data;
}
