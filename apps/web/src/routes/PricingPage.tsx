import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getMaster, getPriceChanges } from '@/lib/pricingApi';
import { listCustomers } from '@/lib/partsApi';
import { date, money, pct } from '@/lib/format';
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

export function PricingPage() {
  const [tab, setTab] = useState('master');
  const [q, setQ] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const customers = useQuery({ queryKey: ['customers'], queryFn: listCustomers });

  const master = useQuery({
    queryKey: ['pricing-master', q, customerId],
    queryFn: () => getMaster({ q: q || undefined, customerId: customerId || undefined }),
    enabled: tab === 'master',
  });

  const changes = useQuery({
    queryKey: ['pricing-changes', q, customerId, type, from, to, page],
    queryFn: () =>
      getPriceChanges({ q: q || undefined, customerId: customerId || undefined, type: type || undefined, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE }),
    enabled: tab === 'changes',
    placeholderData: keepPreviousData,
  });

  const exportParams = { q, customerId, type, from, to };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <PageHeader
          title="Pricing"
          subtitle="Master price list and full price-change history (PVC tagged)"
          actions={<ExportButtons view={tab === 'master' ? 'pricing-master' : 'pricing-changes'} params={exportParams} />}
        />

        <div className="mb-4">
          <Tabs
            tabs={[
              { key: 'master', label: 'Master price list' },
              { key: 'changes', label: 'Price-change history' },
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
          {tab === 'changes' && (
            <>
              <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                <option value="">All types</option>
                <option value="NEW">New</option>
                <option value="REVISION">Revision</option>
                <option value="PVC">PVC</option>
              </Select>
              <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-40" />
              <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-40" />
            </>
          )}
        </div>

        <Card>
          {tab === 'master' ? (
            master.isLoading ? (
              <TableSkeleton cols={7} />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Part no</Th>
                    <Th>Description</Th>
                    <Th>Customer</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Current price</Th>
                    <Th>Last change</Th>
                    <Th>Effective</Th>
                  </tr>
                </thead>
                <tbody>
                  {master.data && master.data.length ? (
                    master.data.map((m) => (
                      <tr key={m.partId} className="hover:bg-slate-50">
                        <Td>
                          <Link to={`/parts/${m.partId}`} className="font-medium text-brand-700 hover:underline">
                            {m.partNo}
                          </Link>
                        </Td>
                        <Td>{m.description}</Td>
                        <Td>{m.customerCode}</Td>
                        <Td><StatusBadge value={m.status} /></Td>
                        <Td className="text-right font-medium">{money(m.currentPrice)}</Td>
                        <Td>{m.lastChangeType ? <StatusBadge value={m.lastChangeType} dot={false} /> : '—'}</Td>
                        <Td>{date(m.lastEffectiveDate)}</Td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow cols={7}>No parts.</EmptyRow>
                  )}
                </tbody>
              </Table>
            )
          ) : changes.isLoading ? (
            <TableSkeleton cols={8} />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Effective</Th>
                    <Th>Part no</Th>
                    <Th>Customer</Th>
                    <Th>Type</Th>
                    <Th className="text-right">Old</Th>
                    <Th className="text-right">New</Th>
                    <Th className="text-right">Δ%</Th>
                    <Th>Reason</Th>
                    <Th>Approved by</Th>
                  </tr>
                </thead>
                <tbody>
                  {changes.data && changes.data.data.length ? (
                    changes.data.data.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <Td>{date(c.effectiveDate)}</Td>
                        <Td>
                          <Link to={`/parts/${c.partId}`} className="font-medium text-brand-700 hover:underline">
                            {c.partNo}
                          </Link>
                        </Td>
                        <Td>{c.customerCode}</Td>
                        <Td><StatusBadge value={c.type} dot={false} /></Td>
                        <Td className="text-right">{money(c.oldPrice)}</Td>
                        <Td className="text-right font-medium">{money(c.newPrice)}</Td>
                        <Td className="text-right">{pct(c.deltaPct)}</Td>
                        <Td className="max-w-xs truncate text-slate-500">{c.reason}</Td>
                        <Td>{c.approvedBy ?? '—'}</Td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow cols={9}>No price changes.</EmptyRow>
                  )}
                </tbody>
              </Table>
              {changes.data && (
                <Pagination
                  page={changes.data.page}
                  pageSize={changes.data.pageSize}
                  total={changes.data.total}
                  totalPages={changes.data.totalPages}
                  onPage={setPage}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
