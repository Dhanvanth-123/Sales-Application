import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Paperclip, Upload } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getDownloadUrl, listAttachments, presignUpload } from '@/lib/filesApi';
import { toast } from '@/store/toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function kb(bytes: number): string {
  if (!bytes) return '';
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(0)} KB`;
}

/** Attachment upload/list via presigned URLs (R7 evidence, plan §6.2). */
export function Attachments({
  entityType,
  entityId,
  canUpload,
}: {
  entityType: string;
  entityId: string;
  canUpload: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const list = useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: () => listAttachments(entityType, entityId),
  });

  const onPick = async (file: File) => {
    setBusy(true);
    try {
      const { uploadUrl } = await presignUpload({
        entityType,
        entityId,
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      });
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      toast.success('File uploaded');
      list.refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed — is object storage running?'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDownload = async (id: string) => {
    try {
      const url = await getDownloadUrl(id);
      window.open(url, '_blank');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Paperclip size={15} /> Attachments
        </h3>
        {canUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
            />
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        )}
      </div>
      {list.isLoading ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : list.data && list.data.length ? (
        <ul className="divide-y divide-slate-100">
          {list.data.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-700">{a.filename}</div>
                <div className="text-xs text-slate-400">
                  {kb(a.sizeBytes)} {a.uploadedBy ? `· ${a.uploadedBy}` : ''}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onDownload(a.id)}>
                <Download size={14} />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">No attachments yet.</p>
      )}
    </Card>
  );
}
