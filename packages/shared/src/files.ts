import { z } from 'zod';

/** Request a presigned upload URL (plan §6.2 files). The SPA uploads directly to
 *  object storage; credentials never reach the browser. */
export const presignUploadSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  filename: z.string().min(1),
  mime: z.string().min(1),
  sizeBytes: z.coerce.number().int().nonnegative().optional(),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export interface PresignUploadResult {
  attachmentId: string;
  storageKey: string;
  uploadUrl: string;
}

export interface AttachmentDto {
  id: string;
  entityType: string;
  entityId: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
}
