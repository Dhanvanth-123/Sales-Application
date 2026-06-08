import type { QuotationStatus } from './enums';

/** Customer-wise sales aggregate (R3). */
export interface CustomerWiseRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  orders: number;
  qty: number;
  value: number;
}

/** Month-wise sales aggregate (R3). `month` is 'YYYY-MM'. */
export interface MonthWiseRow {
  month: string;
  orders: number;
  qty: number;
  value: number;
}

export interface TopPartRow {
  partId: string;
  partNo: string;
  description: string;
  qty: number;
  value: number;
}

export interface DashboardData {
  kpis: {
    totalSalesValue: number;
    totalSalesQty: number;
    salesOrders: number;
    partsCount: number;
    activeParts: number;
    customersCount: number;
    quoteWinRatePct: number | null;
    openPdca: number;
  };
  monthly: MonthWiseRow[];
  topParts: TopPartRow[];
  quoteStatus: { status: QuotationStatus; count: number }[];
  customerSplit: { customerCode: string; customerName: string; value: number }[];
}
