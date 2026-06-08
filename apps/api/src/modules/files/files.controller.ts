import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  presignUploadSchema,
  type AttachmentDto,
  type PresignUploadInput,
  type PresignUploadResult,
} from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('presign')
  @Roles('QUALITY', 'COSTING', 'SALES')
  presign(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(presignUploadSchema)) body: PresignUploadInput,
  ): Promise<PresignUploadResult> {
    return this.files.presignUpload(body, user.id);
  }

  @Get()
  list(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ): Promise<AttachmentDto[]> {
    return this.files.list(entityType, entityId);
  }

  @Get(':id/url')
  url(@Param('id') id: string): Promise<{ url: string }> {
    return this.files.downloadUrl(id);
  }
}
