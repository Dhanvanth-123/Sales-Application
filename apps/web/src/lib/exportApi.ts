import { api } from './api';
import { toast } from '@/store/toast';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

/**
 * Download an export through the authenticated API (so the bearer token is sent),
 * then trigger a browser save. Plan §6.2 /export/:view.(csv|xlsx|pdf), R7.
 */
export async function downloadExport(
  view: string,
  format: ExportFormat,
  params: Record<string, string | undefined> = {},
): Promise<void> {
  try {
    const res = await api.get(`/export/${view}`, {
      params: { ...params, format },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${view}-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Export failed');
  }
}
