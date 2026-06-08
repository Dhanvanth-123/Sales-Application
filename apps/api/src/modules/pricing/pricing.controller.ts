import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  createPriceChangeSchema,
  priceChangesQuerySchema,
  type CreatePriceChangeInput,
  type MasterPriceItem,
  type Paginated,
  type PriceChangeDto,
  type PriceChangeListItem,
  type PriceChangesQuery,
} from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PricingService } from './pricing.service';

@Controller('parts/:id/price')
export class PartPricingController {
  constructor(private readonly pricing: PricingService) {}

  /** Record a new price / revision / PVC (R2) — audited (R6). */
  @Post()
  @Roles('SALES')
  create(
    @Param('id') partId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPriceChangeSchema)) body: CreatePriceChangeInput,
  ): Promise<PriceChangeDto> {
    return this.pricing.addPriceChange(partId, body, user.id);
  }
}

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('master')
  master(
    @Query('q') q?: string,
    @Query('customerId') customerId?: string,
  ): Promise<MasterPriceItem[]> {
    return this.pricing.master({ q, customerId });
  }

  @Get('changes')
  changes(
    @Query(new ZodValidationPipe(priceChangesQuerySchema)) query: PriceChangesQuery,
  ): Promise<Paginated<PriceChangeListItem>> {
    return this.pricing.changes(query);
  }
}
