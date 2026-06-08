import { Module } from '@nestjs/common';
import { PartPricingController, PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  controllers: [PartPricingController, PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
