import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { listQuerySchema } from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuditService, type AuditFilter } from './audit.service';

const auditQuerySchema = listQuerySchema.extend({
  entity: z.string().optional(),
  entityId: z.string().optional(),
});

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /** Audit-trail query (R6) — quality/admin only. */
  @Get()
  @Roles('QUALITY', 'ADMIN')
  query(@Query(new ZodValidationPipe(auditQuerySchema)) q: AuditFilter) {
    return this.audit.query(q);
  }
}
