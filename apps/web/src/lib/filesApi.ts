import type { AttachmentDto, PresignUploadInput, PresignUploadResult } from '@caliper/shared';
import { api } from './api';

export async function listAttachments(entityType: string, entityId: string): Promise<AttachmentDto[]> {
  const { data } = await api.get<AttachmentDto[]>('/files', { params: { entityType, entityId } });
  return data;
}

export async function presignUpload(input: PresignUploadInput): Promise<PresignUploadResult> {
  const { data } = await api.post<PresignUploadResult>('/files/presign', input);
  return data;
}

export async function getDownloadUrl(id: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/files/${id}/url`);
  return data.url;
}
