import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around PrismaClient with Nest lifecycle hooks.
 *
 * The audit trail (R6) mechanism lives in ./audit.extension.ts (`withAudit`). It is
 * intentionally NOT attached to this base client yet: the pricing/quality services
 * (plan §13 Phases 2–3) will run each audited write inside a `$transaction` and wrap
 * the transaction client with `withAudit`, so the business write and the audit insert
 * commit atomically. Phase 0 has no audited writes, so the base client suffices.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
