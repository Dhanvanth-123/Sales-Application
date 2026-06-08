import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PdcaListItem, PdcaStage } from '@caliper/shared';
import { listFopa, listPdca } from '@/lib/qualityApi';
import { listCustomers } from '@/lib/partsApi';
import { date } from '@/lib/format';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyRow, Table, Td, Th } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { ExportButtons } from '@/components/ExportButtons';

const PAGE_SIZE = 15;
const STAGES: { key: PdcaStage; label: string }[] = [
  { key: 'PLAN', label: 'Plan' },
  { key: 'DO', label: 'Do' },
  { key: 'CHECK', label: 'Check' },
  { key: 'ACT', label: 'Act' },
];

export function QualityPage() {
  const [tab, setTab] = useState('fopa');
  const [q, setQ] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const customers = useQuery({ queryKey: ['customers'], queryFn: listCustomers });

  const fopa = useQuery({
    queryKey: ['fopa', q, customerId, result, page],
    queryFn: () => listFopa({ q: q || undefined, customerId: customerId || undefined, result: result || undefined, page, pageSize: PAGE_SIZE }),
    enabled: tab === 'fopa',
    placeholderData: keepPreviousData,
  });

  const pdca = useQuery({
    queryKey: ['pdca', q, customerId, status],
    queryFn: () => listPdca({ q: q || undefined, customerId: customerId || undefined, status: status || undefined, pageSize: 200 }),
    enabled: tab === 'pdca',
  });

  const byStage = (stage: PdcaStage): PdcaListItem[] =>
    (pdca.data?.data ?? []).filter((p) => p.stage === stage);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <PageHeader
          title="Quality & CI"
          subtitle="FOPA register and continuous-improvement PDCA board"
          actions={<ExportButtons view={tab === 'fopa' ? 'fopa' : 'pdca'} params={{ q, customerId, result, status }} />}
        />

        <div className="mb-4">
          <Tabs
            tabs={[
              { key: 'fopa', label: 'FOPA register' },
              { key: 'pdca', label: 'PDCA board' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search part no / description" className="w-64" />
          <Select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPage(1); }}>
            <option value="">All customers</option>
            {(customers.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </Select>
          {tab === 'fopa' ? (
            <Select value={result} onChange={(e) => { setResult(e.target.value); setPage(1); }}>
              <option value="">All results</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONDITIONAL">Conditional</option>
            </Select>
          ) : (
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="CLOSED">Closed</option>
            </Select>
          )}
        </div>

        {tab === 'fopa' ? (
          <Card>
            {fopa.isLoading ? (
              <TableSkeleton cols={7} />
            ) : (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>FOPA no</Th>
                      <Th>Part no</Th>
                      <Th>Customer</Th>
                      <Th>Date</Th>
                      <Th>Result</Th>
                      <Th>Characteristic</Th>
                      <Th>Approved by</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {fopa.data && fopa.data.data.length ? (
                      fopa.data.data.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <Td>{f.fopaNo}</Td>
                          <Td>
                            <Link to={`/parts/${f.partId}`} className="font-medium text-brand-700 hover:underline">
                              {f.partNo}
                            </Link>
                          </Td>
                          <Td>{f.customerCode}</Td>
                          <Td>{date(f.date)}</Td>
                          <Td><StatusBadge value={f.result} /></Td>
                          <Td className="text-slate-500">{f.characteristic ?? '—'}</Td>
                          <Td>{f.approvedBy ?? '—'}</Td>
                        </tr>
                      ))
                    ) : (
                      <EmptyRow cols={7}>No FOPA records.</EmptyRow>
                    )}
                  </tbody>
                </Table>
                {fopa.data && (
                  <Pagination page={fopa.data.page} pageSize={fopa.data.pageSize} total={fopa.data.total} totalPages={fopa.data.totalPages} onPage={setPage} />
                )}
              </>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((s) => (
              <div key={s.key} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-slate-700">{s.label}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">
                    {byStage(s.key).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {byStage(s.key).map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
                      <div className="text-sm font-medium text-slate-800">{p.title}</div>
                      <Link to={`/parts/${p.partId}`} className="text-xs text-brand-600 hover:underline">
                        {p.partNo}
                      </Link>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge value={p.status} />
                        <span className="text-xs text-slate-400">{p.targetDate ? date(p.targetDate) : ''}</span>
                      </div>
                      {p.owner && <div className="mt-1 text-xs text-slate-400">Owner: {p.owner}</div>}
                    </div>
                  ))}
                  {byStage(s.key).length === 0 && (
                    <div className="px-1 py-6 text-center text-xs text-slate-400">No items</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
