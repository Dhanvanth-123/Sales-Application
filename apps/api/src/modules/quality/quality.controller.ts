import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createFaiSchema,
  createFopaSchema,
  createLotSchema,
  createPdcaSchema,
  createQualityRecordSchema,
  fopaQuerySchema,
  pdcaQuerySchema,
  updatePdcaSchema,
  type CreateFaiInput,
  type CreateFopaInput,
  type CreateLotInput,
  type CreatePdcaInput,
  type CreateQualityRecordInput,
  type FaiDto,
  type FopaDto,
  type FopaListItem,
  type FopaQuery,
  type LotDto,
  type Paginated,
  type PdcaDto,
  type PdcaListItem,
  type PdcaQuery,
  type QualityDto,
  type UpdatePdcaInput,
} from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { QualityService } from './quality.service';

@Controller('parts/:id')
export class QualityPartController {
  constructor(private readonly quality: QualityService) {}

  @Post('quality')
  @Roles('QUALITY')
  addQuality(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createQualityRecordSchema)) body: CreateQualityRecordInput,
  ): Promise<QualityDto> {
    return this.quality.addQualityRecord(id, body);
  }

  @Post('fai')
  @Roles('QUALITY')
  addFai(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createFaiSchema)) body: CreateFaiInput,
  ): Promise<FaiDto> {
    return this.quality.addFai(id, body);
  }

  @Post('pilot-lots')
  @Roles('QUALITY')
  addPilotLot(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createLotSchema)) body: CreateLotInput,
  ): Promise<LotDto> {
    return this.quality.addPilotLot(id, body);
  }

  @Post('production-lots')
  @Roles('QUALITY')
  addProductionLot(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createLotSchema)) body: CreateLotInput,
  ): Promise<LotDto> {
    return this.quality.addProductionLot(id, body);
  }

  @Post('fopa')
  @Roles('QUALITY')
  addFopa(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createFopaSchema)) body: CreateFopaInput,
  ): Promise<FopaDto> {
    return this.quality.addFopa(id, body, user.id);
  }

  @Post('pdca')
  @Roles('QUALITY')
  addPdca(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createPdcaSchema)) body: CreatePdcaInput,
  ): Promise<PdcaDto> {
    return this.quality.addPdca(id, body);
  }

  @Patch('pdca/:pdcaId')
  @Roles('QUALITY')
  updatePdca(
    @Param('pdcaId') pdcaId: string,
    @Body(new ZodValidationPipe(updatePdcaSchema)) body: UpdatePdcaInput,
  ): Promise<PdcaDto> {
    return this.quality.updatePdca(pdcaId, body);
  }
}

@Controller('quality')
export class QualityController {
  constructor(private readonly quality: QualityService) {}

  /** Cross-part FOPA register (R4). */
  @Get('fopa')
  fopa(@Query(new ZodValidationPipe(fopaQuerySchema)) q: FopaQuery): Promise<Paginated<FopaListItem>> {
    return this.quality.listFopa(q);
  }

  /** Cross-part PDCA board (R4). */
  @Get('pdca')
  pdca(@Query(new ZodValidationPipe(pdcaQuerySchema)) q: PdcaQuery): Promise<Paginated<PdcaListItem>> {
    return this.quality.listPdca(q);
  }
}
