import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createSaleSchema, type CreateSaleInput, type Sale } from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SalesService } from './sales.service';

@Controller('parts/:id/sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  list(@Param('id') partId: string): Promise<Sale[]> {
    return this.sales.listForPart(partId);
  }

  @Post()
  @Roles('SALES')
  create(
    @Param('id') partId: string,
    @Body(new ZodValidationPipe(createSaleSchema)) body: CreateSaleInput,
  ): Promise<Sale> {
    return this.sales.createForPart(partId, body);
  }
}
