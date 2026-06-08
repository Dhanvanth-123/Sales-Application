import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAudit } from '@/lib/auditApi';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyRow, Table, Td, Th } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { ExportButtons } from '@/components/ExportButtons';

const PAGE_SIZE = 20;

function ts(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AuditPage() {
  const [entity, setEntity] = useState('');
  const [partNo, setPartNo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const audit = useQuery({
    queryKey: ['audit', entity, partNo, from, to, page],
    queryFn: () => getAudit({ entity: entity || undefined, partNo: partNo || undefined, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <PageHeader
          title="Audit trail"
          subtitle="Tamper-evident record of every price, cycle-time and quality change (R6)"
          actions={<ExportButtons view="audit" params={{ entity, partNo, from, to }} />}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input value={partNo} onChange={(e) => { setPartNo(e.target.value); setPage(1); }} placeholder="Part no" className="w-40" />
          <Select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
            <option value="">All entities</option>
            <option value="PriceChange">Price change</option>
            <option value="CycleTimeRevision">Cycle time</option>
            <option value="QualityRecord">Quality record</option>
          </Select>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-40" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-40" />
        </div>

        <Card>
          {audit.isLoading ? (
            <TableSkeleton cols={8} />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Part</Th>
                    <Th>Entity</Th>
                    <Th>Action</Th>
                    <Th>Field</Th>
                    <Th>Old → New</Th>
                    <Th>Reason</Th>
                    <Th>User</Th>
                  </tr>
                </thead>
                <tbody>
                  {audit.data && audit.data.data.length ? (
                    audit.data.data.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <Td className="text-slate-500">{ts(a.ts)}</Td>
                        <Td className="font-medium">{a.partNo ?? '—'}</Td>
                        <Td>{a.entity}</Td>
                        <Td><StatusBadge value={a.action} dot={false} /></Td>
                        <Td>{a.field ?? '—'}</Td>
                        <Td>
                          {a.field ? (
                            <span className="text-slate-600">
                              <span className="text-slate-400">{a.oldValue ?? '∅'}</span>
                              {' → '}
                              <span className="font-medium text-slate-800">{a.newValue ?? '∅'}</span>
                            </span>
                          ) : (
                            <span className="max-w-xs truncate text-xs text-slate-400">{a.newValue ?? a.oldValue ?? ''}</span>
                          )}
                        </Td>
                        <Td className="max-w-xs truncate text-slate-500">{a.reason ?? '—'}</Td>
                        <Td>{a.user?.name ?? '—'}</Td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow cols={8}>No audit entries match these filters.</EmptyRow>
                  )}
                </tbody>
              </Table>
              {audit.data && (
                <Pagination page={audit.data.page} pageSize={audit.data.pageSize} total={audit.data.total} totalPages={audit.data.totalPages} onPage={setPage} />
              )}
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
