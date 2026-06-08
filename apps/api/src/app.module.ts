import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CoreConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PartsModule } from './modules/parts/parts.module';
import { SalesModule } from './modules/sales/sales.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { QualityModule } from './modules/quality/quality.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExportModule } from './modules/export/export.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    CoreConfigModule,
    PrismaModule,
    NotificationsModule,
    // rate limiting (plan §10) — 200 req/min/IP by default; auth is tighter (see controller)
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 200 }]),
    AuthModule,
    UsersModule,
    HealthModule,
    AuditModule,
    CustomersModule,
    PartsModule,
    SalesModule,
    QuotationsModule,
    PricingModule,
    QualityModule,
    ReportsModule,
    ExportModule,
    FilesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // authenticate, then authorize
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
