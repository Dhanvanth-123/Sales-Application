import type { CustomerWiseRow, DashboardData, MonthWiseRow } from '@caliper/shared';
import { api } from './api';

export interface ReportParams {
  from?: string;
  to?: string;
  customerId?: string;
}

export async function getCustomerWise(params: ReportParams): Promise<CustomerWiseRow[]> {
  const { data } = await api.get<CustomerWiseRow[]>('/reports/customer-wise', { params });
  return data;
}
export async function getMonthWise(params: ReportParams): Promise<MonthWiseRow[]> {
  const { data } = await api.get<MonthWiseRow[]>('/reports/month-wise', { params });
  return data;
}
export async function getDashboard(params: ReportParams): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/reports/dashboard', { params });
  return data;
}
