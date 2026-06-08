import { Module } from '@nestjs/common';
import { QualityController, QualityPartController } from './quality.controller';
import { QualityService } from './quality.service';

@Module({
  controllers: [QualityPartController, QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
