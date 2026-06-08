import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  createQuotationSchema,
  type CreateQuotationInput,
  type Quotation,
} from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { QuotationsService } from './quotations.service';

@Controller('parts/:id/quotations')
export class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get()
  list(@Param('id') partId: string): Promise<Quotation[]> {
    return this.quotations.listForPart(partId);
  }

  @Post()
  @Roles('SALES')
  create(
    @Param('id') partId: string,
    @Body(new ZodValidationPipe(createQuotationSchema)) body: CreateQuotationInput,
  ): Promise<Quotation> {
    return this.quotations.createForPart(partId, body);
  }
}
