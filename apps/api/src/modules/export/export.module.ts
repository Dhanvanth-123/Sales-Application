import { Module } from '@nestjs/common';
import { PartsModule } from '../parts/parts.module';
import { PricingModule } from '../pricing/pricing.module';
import { ReportsModule } from '../reports/reports.module';
import { QualityModule } from '../quality/quality.module';
import { AuditModule } from '../audit/audit.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [PartsModule, PricingModule, ReportsModule, QualityModule, AuditModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
