import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import type { DossierResponse } from '@caliper/shared';
import { getDossier } from '@/lib/partsApi';
import { dec, date, int, money, pct } from '@/lib/format';
import { canWrite } from '@/lib/roles';
import { useAuth } from '@/store/auth';
import { useFilters } from '@/store/filters';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs, type TabDef } from '@/components/ui/tabs';
import { EmptyRow, Table, Td, Th } from '@/components/ui/table';
import {
  AddLabourDialog,
  AddOperationDialog,
  AddQuotationDialog,
  AddSaleDialog,
} from '@/features/parts/addDialogs';
import {
  AddCycleTimeDialog,
  AddFaiDialog,
  AddFopaDialog,
  AddLotDialog,
  AddPdcaDialog,
  AddPriceDialog,
  AddQualityDialog,
} from '@/features/parts/recordDialogs';
import { Attachments } from '@/features/parts/Attachments';

type Dialog =
  | 'sale'
  | 'quotation'
  | 'labour'
  | 'operation'
  | 'price'
  | 'cycle'
  | 'quality'
  | 'fai'
  | 'pilot'
  | 'production'
  | 'fopa'
  | 'pdca'
  | null;

export function PartDossierPage() {
  const { id = '' } = useParams();
  const role = useAuth((s) => s.user?.role);
  const filters = useFilters();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('overview');
  const [dialog, setDialog] = useState<Dialog>(null);

  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  const dossier = useQuery({
    queryKey: ['dossier', id, from, to],
    queryFn: () => getDossier(id, { from: from || undefined, to: to || undefined }),
  });

  const setRange = (patch: { from?: string; to?: string }) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setSearchParams(next);
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['dossier', id] });

  const backTo = `/parts?${new URLSearchParams(
    Object.entries({ q: filters.q, customerId: filters.customerId, status: filters.status }).filter(
      ([, v]) => v,
    ) as [string, string][],
  ).toString()}`;

  const d = dossier.data;

  const tabs: TabDef[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'sales', label: 'Sales', count: d?.sales.length },
    { key: 'labour', label: 'Cost & Labour', count: d?.labour.length },
    { key: 'operations', label: 'Operations', count: d?.operations.length },
    { key: 'quotations', label: 'Quotations', count: d?.quotations.length },
    { key: 'inspection', label: 'Inspection & Lots', count: d ? d.fai.length + d.pilotLots.length + d.productionLots.length : undefined },
    { key: 'cycle', label: 'Cycle Time', count: d?.cycleTimes.length },
    { key: 'pricing', label: 'Pricing', count: d?.priceChanges.length },
    { key: 'quality', label: 'Quality & CI', count: d ? d.quality.length + d.fopa.length + d.pdca.length : undefined },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-6">
        <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to parts
        </Link>

        {dossier.isLoading ? (
          <Card className="p-10 text-center text-sm text-slate-400">Loading dossier…</Card>
        ) : dossier.isError || !d ? (
          <Card className="p-10 text-center text-sm text-red-600">Could not load this part.</Card>
        ) : (
          <>
            {/* header */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-slate-800">{d.part.partNo}</h1>
                  <StatusBadge value={d.part.status} />
                </div>
                <p className="text-sm text-slate-600">{d.part.description}</p>
                <p className="text-xs text-slate-400">
                  {d.part.customerCode} · {d.part.customerName}
                  {d.part.material ? ` · ${d.part.material}` : ''}
                  {d.part.drawingNo ? ` · Dwg ${d.part.drawingNo}` : ''}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <label className="text-xs text-slate-500">
                  From
                  <Input type="date" value={from} onChange={(e) => setRange({ from: e.target.value })} className="mt-1 h-9" />
                </label>
                <label className="text-xs text-slate-500">
                  To
                  <Input type="date" value={to} onChange={(e) => setRange({ to: e.target.value })} className="mt-1 h-9" />
                </label>
                {(from || to) && (
                  <Button variant="ghost" size="sm" onClick={() => setRange({ from: '', to: '' })}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* KPI strip */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Current price" value={money(d.summary.latestPrice)} />
              <Stat label="Std cycle (min)" value={dec(d.summary.stdCycleMin)} />
              <Stat label="Sales value" value={money(d.summary.totalSalesValue)} />
              <Stat label="Sales qty" value={int(d.summary.totalSalesQty)} />
              <Stat label="Quote win rate" value={pct(d.summary.winRatePct)} />
              <Stat label="Open PDCA" value={int(d.summary.openPdca)} />
            </div>

            <Card>
              <div className="px-4 pt-3">
                <Tabs tabs={tabs} active={tab} onChange={setTab} />
              </div>
              <div className="p-4">
                {tab === 'overview' && (
                  <div className="space-y-4">
                    <OverviewPanel d={d} />
                    <Attachments
                      entityType="part"
                      entityId={id}
                      canUpload={canWrite(role, ['QUALITY', 'COSTING', 'SALES'])}
                    />
                  </div>
                )}
                {tab === 'sales' && (
                  <Section
                    title="Sales orders"
                    canAdd={canWrite(role, ['SALES'])}
                    onAdd={() => setDialog('sale')}
                  >
                    <Table>
                      <thead>
                        <tr>
                          <Th>Date</Th>
                          <Th>SO no.</Th>
                          <Th className="text-right">Qty</Th>
                          <Th className="text-right">Unit price</Th>
                          <Th className="text-right">Value</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.sales.length ? (
                          d.sales.map((s) => (
                            <tr key={s.id}>
                              <Td>{date(s.date)}</Td>
                              <Td>{s.soNo ?? '—'}</Td>
                              <Td className="text-right">{int(s.qty)}</Td>
                              <Td className="text-right">{money(s.unitPrice)}</Td>
                              <Td className="text-right font-medium">{money(s.value)}</Td>
                            </tr>
                          ))
                        ) : (
                          <EmptyRow cols={5}>No sales in this period.</EmptyRow>
                        )}
                      </tbody>
                    </Table>
                  </Section>
                )}
                {tab === 'labour' && (
                  <Section
                    title="Labour & cost"
                    canAdd={canWrite(role, ['COSTING'])}
                    onAdd={() => setDialog('labour')}
                  >
                    <Table>
                      <thead>
                        <tr>
                          <Th>Operation</Th>
                          <Th>Grade</Th>
                          <Th className="text-right">Rate / hr</Th>
                          <Th className="text-right">Std time (min)</Th>
                          <Th className="text-right">Cost / pc</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.labour.length ? (
                          d.labour.map((l) => (
                            <tr key={l.id}>
                              <Td>{l.operation}</Td>
                              <Td>{l.grade ?? '—'}</Td>
                              <Td className="text-right">{money(l.ratePerHr)}</Td>
                              <Td className="text-right">{dec(l.stdTimeMin)}</Td>
                              <Td className="text-right font-medium">{money(l.costPerPc)}</Td>
                            </tr>
                          ))
                        ) : (
                          <EmptyRow cols={5}>No labour entries.</EmptyRow>
                        )}
                      </tbody>
                    </Table>
                  </Section>
                )}
                {tab === 'operations' && (
                  <Section
                    title="Process operations"
                    canAdd={canWrite(role, ['COSTING'])}
                    onAdd={() => setDialog('operation')}
                  >
                    <Table>
                      <thead>
                        <tr>
                          <Th className="text-right">Seq</Th>
                          <Th>Operation</Th>
                          <Th>Machine</Th>
                          <Th className="text-right">Setup (min)</Th>
                          <Th className="text-right">Cycle (min)</Th>
                          <Th>Tooling</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.operations.length ? (
                          d.operations.map((o) => (
                            <tr key={o.id}>
                              <Td className="text-right">{o.seq}</Td>
                              <Td>{o.operation}</Td>
                              <Td>{o.machine ?? '—'}</Td>
                              <Td className="text-right">{dec(o.setupMin)}</Td>
                              <Td className="text-right">{dec(o.cycleMin)}</Td>
                              <Td>{o.tooling ?? '—'}</Td>
                            </tr>
                          ))
                        ) : (
                          <EmptyRow cols={6}>No operations defined.</EmptyRow>
                        )}
                      </tbody>
                    </Table>
                  </Section>
                )}
                {tab === 'quotations' && (
                  <Section
                    title="Quotations"
                    canAdd={canWrite(role, ['SALES'])}
                    onAdd={() => setDialog('quotation')}
                  >
                    <Table>
                      <thead>
                        <tr>
                          <Th>Quote no.</Th>
                          <Th>Date</Th>
                          <Th className="text-right">Qty</Th>
                          <Th className="text-right">Quoted price</Th>
                          <Th>Status</Th>
                          <Th>Valid until</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.quotations.length ? (
                          d.quotations.map((q) => (
                            <tr key={q.id}>
                              <Td>{q.quoteNo}</Td>
                              <Td>{date(q.date)}</Td>
                              <Td className="text-right">{int(q.qty)}</Td>
                              <Td className="text-right">{money(q.quotedPrice)}</Td>
                              <Td>
                                <StatusBadge value={q.status} />
                              </Td>
                              <Td>{date(q.validUntil)}</Td>
                            </tr>
                          ))
                        ) : (
                          <EmptyRow cols={6}>No quotations in this period.</EmptyRow>
                        )}
                      </tbody>
                    </Table>
                  </Section>
                )}
                {tab === 'inspection' && (
                  <div className="space-y-4">
                    {canWrite(role, ['QUALITY']) && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setDialog('fai')}>
                          <Plus size={14} /> FAI
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setDialog('pilot')}>
                          <Plus size={14} /> Pilot lot
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setDialog('production')}>
                          <Plus size={14} /> Production lot
                        </Button>
                      </div>
                    )}
                    <InspectionPanel d={d} />
                  </div>
                )}
                {tab === 'cycle' && (
                  <div className="space-y-4">
                    {canWrite(role, ['COSTING']) && (
                      <div>
                        <Button size="sm" variant="secondary" onClick={() => setDialog('cycle')}>
                          <Plus size={14} /> New revision
                        </Button>
                      </div>
                    )}
                    <CyclePanel d={d} />
                  </div>
                )}
                {tab === 'pricing' && (
                  <div className="space-y-4">
                    {canWrite(role, ['SALES']) && (
                      <div>
                        <Button size="sm" variant="secondary" onClick={() => setDialog('price')}>
                          <Plus size={14} /> Record price change
                        </Button>
                      </div>
                    )}
                    <PricingPanel d={d} />
                  </div>
                )}
                {tab === 'quality' && (
                  <div className="space-y-4">
                    {canWrite(role, ['QUALITY']) && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setDialog('quality')}>
                          <Plus size={14} /> Quality record
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setDialog('fopa')}>
                          <Plus size={14} /> FOPA
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setDialog('pdca')}>
                          <Plus size={14} /> PDCA
                        </Button>
                      </div>
                    )}
                    <QualityPanel d={d} />
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {d && (
        <>
          <AddSaleDialog partId={id} open={dialog === 'sale'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddQuotationDialog partId={id} open={dialog === 'quotation'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddLabourDialog partId={id} open={dialog === 'labour'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddOperationDialog partId={id} open={dialog === 'operation'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddPriceDialog partId={id} open={dialog === 'price'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddCycleTimeDialog partId={id} open={dialog === 'cycle'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddQualityDialog partId={id} open={dialog === 'quality'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddFaiDialog partId={id} open={dialog === 'fai'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddLotDialog kind="pilot" partId={id} open={dialog === 'pilot'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddLotDialog kind="production" partId={id} open={dialog === 'production'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddFopaDialog partId={id} open={dialog === 'fopa'} onClose={() => setDialog(null)} onSuccess={refetch} />
          <AddPdcaDialog partId={id} open={dialog === 'pdca'} onClose={() => setDialog(null)} onSuccess={refetch} />
        </>
      )}
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function Section({
  title,
  canAdd,
  onAdd,
  children,
}: {
  title: string;
  canAdd?: boolean;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {canAdd && onAdd && (
          <Button size="sm" variant="secondary" onClick={onAdd}>
            <Plus size={14} /> Add
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function OverviewPanel({ d }: { d: DossierResponse }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Part details</h3>
        <dl className="space-y-1.5 text-sm">
          <Row k="Customer" v={`${d.part.customerCode} — ${d.part.customerName}`} />
          <Row k="Material" v={d.part.material ?? '—'} />
          <Row k="Drawing no." v={d.part.drawingNo ?? '—'} />
          <Row k="UOM" v={d.part.uom} />
          <Row k="Current price" v={money(d.part.currentPrice)} />
          <Row k="Std cycle (min)" v={dec(d.part.stdCycleMin)} />
        </dl>
      </Card>
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">History at a glance</h3>
        <dl className="space-y-1.5 text-sm">
          <Row k="Sales orders" v={int(d.summary.salesCount)} />
          <Row k="Total sales value" v={money(d.summary.totalSalesValue)} />
          <Row k="Quotations" v={int(d.summary.quotationCount)} />
          <Row k="Quote win rate" v={pct(d.summary.winRatePct)} />
          <Row k="Price changes" v={int(d.priceChanges.length)} />
          <Row k="Cycle-time revisions" v={int(d.cycleTimes.length)} />
          <Row k="Avg production PPM" v={d.summary.avgProductionPpm == null ? '—' : int(d.summary.avgProductionPpm)} />
          <Row k="Open PDCA items" v={int(d.summary.openPdca)} />
        </dl>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-800">{v}</dd>
    </div>
  );
}

function InspectionPanel({ d }: { d: DossierResponse }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">FAI records</h3>
        <Table>
          <thead>
            <tr>
              <Th>FAI no.</Th>
              <Th>Date</Th>
              <Th className="text-right">Qty</Th>
              <Th>Result</Th>
              <Th>Inspector</Th>
              <Th>Remarks</Th>
            </tr>
          </thead>
          <tbody>
            {d.fai.length ? (
              d.fai.map((f) => (
                <tr key={f.id}>
                  <Td>{f.faiNo}</Td>
                  <Td>{date(f.date)}</Td>
                  <Td className="text-right">{int(f.qtyInspected)}</Td>
                  <Td>
                    <StatusBadge value={f.result} />
                  </Td>
                  <Td>{f.inspector ?? '—'}</Td>
                  <Td className="text-slate-500">{f.remarks ?? '—'}</Td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={6}>No FAI records.</EmptyRow>
            )}
          </tbody>
        </Table>
      </div>
      <LotsTable title="Pilot lots" lots={d.pilotLots} />
      <LotsTable title="Production lots" lots={d.productionLots} />
    </div>
  );
}

function LotsTable({ title, lots }: { title: string; lots: DossierResponse['productionLots'] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <Table>
        <thead>
          <tr>
            <Th>Lot no.</Th>
            <Th>Date</Th>
            <Th className="text-right">Qty</Th>
            <Th className="text-right">Accepted</Th>
            <Th className="text-right">Rejected</Th>
            <Th className="text-right">PPM</Th>
          </tr>
        </thead>
        <tbody>
          {lots.length ? (
            lots.map((l) => (
              <tr key={l.id}>
                <Td>{l.lotNo}</Td>
                <Td>{date(l.date)}</Td>
                <Td className="text-right">{int(l.qty)}</Td>
                <Td className="text-right">{int(l.accepted)}</Td>
                <Td className="text-right">{int(l.rejected)}</Td>
                <Td className="text-right font-medium">{int(l.ppm)}</Td>
              </tr>
            ))
          ) : (
            <EmptyRow cols={6}>None in this period.</EmptyRow>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function CyclePanel({ d }: { d: DossierResponse }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th className="text-right">Rev</Th>
          <Th>Date</Th>
          <Th className="text-right">Cycle (min)</Th>
          <Th>Reason</Th>
          <Th>Approved by</Th>
        </tr>
      </thead>
      <tbody>
        {d.cycleTimes.length ? (
          d.cycleTimes.map((c) => (
            <tr key={c.id}>
              <Td className="text-right">{c.rev}</Td>
              <Td>{date(c.date)}</Td>
              <Td className="text-right font-medium">{dec(c.cycleMin)}</Td>
              <Td className="text-slate-500">{c.reason}</Td>
              <Td>{c.approvedBy ?? '—'}</Td>
            </tr>
          ))
        ) : (
          <EmptyRow cols={5}>No cycle-time revisions.</EmptyRow>
        )}
      </tbody>
    </Table>
  );
}

function PricingPanel({ d }: { d: DossierResponse }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Effective</Th>
          <Th>Type</Th>
          <Th className="text-right">Old</Th>
          <Th className="text-right">New</Th>
          <Th className="text-right">Δ%</Th>
          <Th>Reason</Th>
          <Th>Approved by</Th>
        </tr>
      </thead>
      <tbody>
        {d.priceChanges.length ? (
          d.priceChanges.map((p) => (
            <tr key={p.id}>
              <Td>{date(p.effectiveDate)}</Td>
              <Td>
                <StatusBadge value={p.type} />
              </Td>
              <Td className="text-right">{money(p.oldPrice)}</Td>
              <Td className="text-right font-medium">{money(p.newPrice)}</Td>
              <Td className="text-right">{pct(p.deltaPct)}</Td>
              <Td className="text-slate-500">{p.reason}</Td>
              <Td>{p.approvedBy ?? '—'}</Td>
            </tr>
          ))
        ) : (
          <EmptyRow cols={7}>No price changes in this period.</EmptyRow>
        )}
      </tbody>
    </Table>
  );
}

function QualityPanel({ d }: { d: DossierResponse }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Quality records</h3>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Result</Th>
              <Th>Defect</Th>
              <Th className="text-right">PPM</Th>
              <Th>Remarks</Th>
            </tr>
          </thead>
          <tbody>
            {d.quality.length ? (
              d.quality.map((q) => (
                <tr key={q.id}>
                  <Td>{date(q.date)}</Td>
                  <Td>{q.type}</Td>
                  <Td>{q.result ?? '—'}</Td>
                  <Td>{q.defect ?? '—'}</Td>
                  <Td className="text-right">{q.ppm == null ? '—' : int(q.ppm)}</Td>
                  <Td className="text-slate-500">{q.remarks ?? '—'}</Td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={6}>No quality records.</EmptyRow>
            )}
          </tbody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">FOPA</h3>
        <Table>
          <thead>
            <tr>
              <Th>FOPA no.</Th>
              <Th>Date</Th>
              <Th>Result</Th>
              <Th>Characteristic</Th>
              <Th>Approved by</Th>
            </tr>
          </thead>
          <tbody>
            {d.fopa.length ? (
              d.fopa.map((f) => (
                <tr key={f.id}>
                  <Td>{f.fopaNo}</Td>
                  <Td>{date(f.date)}</Td>
                  <Td>
                    <StatusBadge value={f.result} />
                  </Td>
                  <Td>{f.characteristic ?? '—'}</Td>
                  <Td>{f.approvedBy ?? '—'}</Td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={5}>No FOPA records.</EmptyRow>
            )}
          </tbody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">PDCA board</h3>
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Stage</Th>
              <Th>Owner</Th>
              <Th>Status</Th>
              <Th>Target</Th>
            </tr>
          </thead>
          <tbody>
            {d.pdca.length ? (
              d.pdca.map((p) => (
                <tr key={p.id}>
                  <Td>{p.title}</Td>
                  <Td>
                    <StatusBadge value={p.stage} />
                  </Td>
                  <Td>{p.owner ?? '—'}</Td>
                  <Td>
                    <StatusBadge value={p.status} />
                  </Td>
                  <Td>{date(p.targetDate)}</Td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={5}>No PDCA items.</EmptyRow>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
