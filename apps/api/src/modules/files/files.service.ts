import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AttachmentDto, PresignUploadInput, PresignUploadResult } from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isoReq } from '../../common/serialize';

/**
 * Attachment storage via presigned URLs (plan §6.2, §9.3). The SPA asks for a
 * short-lived URL and uploads/downloads directly to object storage, so storage
 * credentials never reach the browser.
 */
@Injectable()
export class FilesService {
  private readonly bucket = process.env.S3_BUCKET ?? '';
  private readonly client = this.buildClient();

  constructor(private readonly prisma: PrismaService) {}

  private buildClient(): S3Client | null {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (!endpoint || !this.bucket || !accessKeyId || !secretAccessKey) return null;
    return new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // required for MinIO
    });
  }

  private ensure(): S3Client {
    if (!this.client) {
      throw new ServiceUnavailableException({
        code: 'STORAGE_NOT_CONFIGURED',
        message: 'Object storage is not configured (set S3_* env vars).',
      });
    }
    return this.client;
  }

  async presignUpload(input: PresignUploadInput, userId: string): Promise<PresignUploadResult> {
    const client = this.ensure();
    const created = await this.prisma.attachment.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        filename: input.filename,
        mime: input.mime,
        sizeBytes: input.sizeBytes ?? 0,
        storageKey: 'pending',
        uploadedById: userId,
      },
    });
    const storageKey = `${input.entityType}/${input.entityId}/${created.id}/${input.filename}`;
    await this.prisma.attachment.update({ where: { id: created.id }, data: { storageKey } });

    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: input.mime }),
      { expiresIn: 300 },
    );
    return { attachmentId: created.id, storageKey, uploadUrl };
  }

  async downloadUrl(id: string): Promise<{ url: string }> {
    const client = this.ensure();
    const att = await this.prisma.attachment.findUnique({ where: { id } });
    if (!att) throw new NotFoundException({ code: 'ATTACHMENT_NOT_FOUND', message: 'Not found' });
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.bucket, Key: att.storageKey }),
      { expiresIn: 300 },
    );
    return { url };
  }

  async list(entityType: string, entityId: string): Promise<AttachmentDto[]> {
    const rows = await this.prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { name: true } } },
    });
    return rows.map((a) => ({
      id: a.id,
      entityType: a.entityType,
      entityId: a.entityId,
      filename: a.filename,
      mime: a.mime,
      sizeBytes: a.sizeBytes,
      uploadedBy: a.uploadedBy?.name ?? null,
      createdAt: isoReq(a.createdAt),
    }));
  }
}
