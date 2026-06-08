import { Download } from 'lucide-react';
import { downloadExport, type ExportFormat } from '@/lib/exportApi';
import { Button } from '@/components/ui/button';

export function ExportButtons({
  view,
  params = {},
  formats = ['csv', 'xlsx', 'pdf'],
}: {
  view: string;
  params?: Record<string, string | undefined>;
  formats?: ExportFormat[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      {formats.map((f) => (
        <Button key={f} size="sm" variant="secondary" onClick={() => void downloadExport(view, f, params)}>
          <Download size={14} /> {f.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
