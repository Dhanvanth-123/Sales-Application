import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, ChevronsUpDown, Plus } from 'lucide-react';
import type { PartsUrlState } from '@/hooks/usePartsUrlState';
import { usePartsUrlState } from '@/hooks/usePartsUrlState';
import { listCustomers, listParts } from '@/lib/partsApi';
import { money, dec } from '@/lib/format';
import { canWrite } from '@/lib/roles';
import { useAuth } from '@/store/auth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyRow, Table, Td, Th } from '@/components/ui/table';
import { FilterBar } from '@/features/parts/FilterBar';
import { CreatePartDialog } from '@/features/parts/CreatePartDialog';

const PAGE_SIZE = 10;

function SortHeader({
  field,
  label,
  align,
  state,
  update,
}: {
  field: string;
  label: string;
  align?: 'right';
  state: PartsUrlState;
  update: (patch: Partial<PartsUrlState>) => void;
}) {
  const [f, dir] = state.sort ? state.sort.split(':') : ['', ''];
  const active = f === field;
  const nextDir = active && dir === 'asc' ? 'desc' : 'asc';
  return (
    <Th className={align === 'right' ? 'text-right' : undefined}>
      <button
        onClick={() => update({ sort: `${field}:${nextDir}` })}
        className={`inline-flex items-center gap-1 hover:text-slate-700 ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        {active ? (
          dir === 'desc' ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronUp size={14} />
          )
        ) : (
          <ChevronsUpDown size={14} className="text-slate-300" />
        )}
      </button>
    </Th>
  );
}

export function PartsListPage() {
  const navigate = useNavigate();
  const role = useAuth((s) => s.user?.role);
  const { state, update, resetFilters } = usePartsUrlState();
  const [createOpen, setCreateOpen] = useState(false);

  const customers = useQuery({ queryKey: ['customers'], queryFn: listCustomers });
  const parts = useQuery({
    queryKey: ['parts', state.q, state.customerId, state.status, state.page, state.sort],
    queryFn: () =>
      listParts({
        q: state.q || undefined,
        customerId: state.customerId || undefined,
        status: state.status || undefined,
        page: state.page,
        pageSize: PAGE_SIZE,
        sort: state.sort || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const data = parts.data;
  const from = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Parts</h1>
            <p className="text-sm text-slate-500">Browse part-level history. Click a row to open its dossier.</p>
          </div>
          {canWrite(role, ['COSTING']) && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New part
            </Button>
          )}
        </header>

        <div className="mb-4">
          <FilterBar
            state={state}
            update={update}
            resetFilters={resetFilters}
            customers={customers.data ?? []}
          />
        </div>

        <Card>
          <Table>
            <thead>
              <tr>
                <SortHeader field="partNo" label="Part no" state={state} update={update} />
                <SortHeader field="description" label="Description" state={state} update={update} />
                <Th>Customer</Th>
                <SortHeader field="status" label="Status" state={state} update={update} />
                <SortHeader field="currentPrice" label="Price" align="right" state={state} update={update} />
                <SortHeader field="stdCycleMin" label="Cycle (min)" align="right" state={state} update={update} />
              </tr>
            </thead>
            <tbody>
              {parts.isLoading ? (
                <EmptyRow cols={6}>Loading…</EmptyRow>
              ) : parts.isError ? (
                <EmptyRow cols={6}>Failed to load parts.</EmptyRow>
              ) : data && data.data.length > 0 ? (
                data.data.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/parts/${p.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <Td className="font-medium text-brand-700">{p.partNo}</Td>
                    <Td>{p.description}</Td>
                    <Td>
                      <span className="text-slate-700">{p.customerCode}</span>
                      <span className="ml-1 text-slate-400">{p.customerName}</span>
                    </Td>
                    <Td>
                      <StatusBadge value={p.status} />
                    </Td>
                    <Td className="text-right">{money(p.currentPrice)}</Td>
                    <Td className="text-right">{dec(p.stdCycleMin)}</Td>
                  </tr>
                ))
              ) : (
                <EmptyRow cols={6}>No parts match these filters.</EmptyRow>
              )}
            </tbody>
          </Table>

          <div className="flex items-center justify-between px-3 py-3 text-sm text-slate-500">
            <span>
              {data ? (
                <>
                  Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{data.total}</strong>
                </>
              ) : (
                '—'
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!data || data.page <= 1}
                onClick={() => update({ page: state.page - 1 })}
              >
                Prev
              </Button>
              <span className="text-xs">
                Page {data?.page ?? 1} / {data?.totalPages ?? 1}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!data || data.page >= data.totalPages}
                onClick={() => update({ page: state.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <CreatePartDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        customers={customers.data ?? []}
        onCreated={(p) => navigate(`/parts/${p.id}`)}
      />
    </AppLayout>
  );
}
