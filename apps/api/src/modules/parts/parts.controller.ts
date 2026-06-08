import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createCycleTimeSchema,
  createLabourSchema,
  createOperationSchema,
  createPartSchema,
  partsQuerySchema,
  updatePartSchema,
  type CreateCycleTimeInput,
  type CreateLabourInput,
  type CreateOperationInput,
  type CreatePartInput,
  type CycleTimeDto,
  type DossierResponse,
  type LabourEntry,
  type Operation,
  type Paginated,
  type PartListItem,
  type PartsQuery,
  type UpdatePartInput,
} from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PartsService } from './parts.service';

@Controller('parts')
export class PartsController {
  constructor(private readonly parts: PartsService) {}

  /** Filterable, paginated part list (R5). */
  @Get()
  list(
    @Query(new ZodValidationPipe(partsQuerySchema)) query: PartsQuery,
  ): Promise<Paginated<PartListItem>> {
    return this.parts.list(query);
  }

  @Post()
  @Roles('COSTING')
  create(
    @Body(new ZodValidationPipe(createPartSchema)) body: CreatePartInput,
  ): Promise<PartListItem> {
    return this.parts.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<PartListItem> {
    return this.parts.findOne(id);
  }

  @Patch(':id')
  @Roles('COSTING')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePartSchema)) body: UpdatePartInput,
  ): Promise<PartListItem> {
    return this.parts.update(id, body);
  }

  /** Full part history aggregate (R1), optionally bounded by date range (R5). */
  @Get(':id/dossier')
  dossier(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<DossierResponse> {
    return this.parts.dossier(id, from, to);
  }

  @Get(':id/labour')
  listLabour(@Param('id') id: string): Promise<LabourEntry[]> {
    return this.parts.listLabour(id);
  }

  @Post(':id/labour')
  @Roles('COSTING')
  addLabour(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createLabourSchema)) body: CreateLabourInput,
  ): Promise<LabourEntry> {
    return this.parts.addLabour(id, body);
  }

  @Get(':id/operations')
  listOperations(@Param('id') id: string): Promise<Operation[]> {
    return this.parts.listOperations(id);
  }

  @Post(':id/operations')
  @Roles('COSTING')
  addOperation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createOperationSchema)) body: CreateOperationInput,
  ): Promise<Operation> {
    return this.parts.addOperation(id, body);
  }

  /** New cycle-time revision (R1) — audited (R6). */
  @Post(':id/cycle-times')
  @Roles('COSTING')
  addCycleTime(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCycleTimeSchema)) body: CreateCycleTimeInput,
  ): Promise<CycleTimeDto> {
    return this.parts.addCycleTime(id, body, user.id);
  }
}
