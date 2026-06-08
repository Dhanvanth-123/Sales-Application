import { Controller, Get, Query } from '@nestjs/common';
import type { CustomerWiseRow, DashboardData, MonthWiseRow } from '@caliper/shared';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('customer-wise')
  customerWise(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<CustomerWiseRow[]> {
    return this.reports.customerWise({ from, to });
  }

  @Get('month-wise')
  monthWise(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
  ): Promise<MonthWiseRow[]> {
    return this.reports.monthWise({ from, to, customerId });
  }

  @Get('dashboard')
  dashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
  ): Promise<DashboardData> {
    return this.reports.dashboard({ from, to, customerId });
  }
}
