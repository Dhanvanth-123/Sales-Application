import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IndianRupee, Package, ShoppingCart, Trophy, Users, Boxes, ClipboardList, Layers } from 'lucide-react';
import { getDashboard } from '@/lib/reportsApi';
import { listCustomers } from '@/lib/partsApi';
import { compactInr, int, money, pct } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Kpi } from '@/components/ui/kpi';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const CHART = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#10b981', '#f59e0b', '#ef4444'];
const STATUS_COLOR: Record<string, string> = { WON: '#10b981', LOST: '#ef4444', PENDING: '#f59e0b' };

export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customerId, setCustomerId] = useState('');

  const customers = useQuery({ queryKey: ['customers'], queryFn: listCustomers });
  const params = { from: from || undefined, to: to || undefined, customerId: customerId || undefined };
  const dash = useQuery({ queryKey: ['dashboard', from, to, customerId], queryFn: () => getDashboard(params) });
  const d = dash.data;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <PageHeader
          title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`}
          subtitle="Shop-floor intelligence at a glance"
          actions={
            <div className="flex items-end gap-2">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">All customers</option>
                {(customers.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </Select>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {d ? (
            <>
              <Kpi label="Sales value" value={money(d.kpis.totalSalesValue)} icon={IndianRupee} tone="brand" />
              <Kpi label="Units sold" value={int(d.kpis.totalSalesQty)} icon={ShoppingCart} tone="emerald" />
              <Kpi label="Sales orders" value={int(d.kpis.salesOrders)} icon={Layers} tone="violet" />
              <Kpi label="Quote win rate" value={pct(d.kpis.quoteWinRatePct)} icon={Trophy} tone="amber" />
              <Kpi label="Active parts" value={`${int(d.kpis.activeParts)} / ${int(d.kpis.partsCount)}`} icon={Boxes} tone="brand" />
              <Kpi label="Customers" value={int(d.kpis.customersCount)} icon={Users} tone="slate" />
              <Kpi label="Open PDCA" value={int(d.kpis.openPdca)} icon={ClipboardList} tone="amber" />
              <Kpi label="Parts catalogue" value={int(d.kpis.partsCount)} icon={Package} tone="slate" />
            </>
          ) : (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)
          )}
        </div>

        {/* charts */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly sales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={d?.monthly ?? []} margin={{ left: 8, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={compactInr} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={56} />
                  <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={d?.quoteStatus ?? []}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {(d?.quoteStatus ?? []).map((s) => (
                      <Cell key={s.status} fill={STATUS_COLOR[s.status] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs text-slate-500">
                {(d?.quoteStatus ?? []).map((s) => (
                  <span key={s.status} className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s.status] ?? '#94a3b8' }} />
                    {s.status} ({s.count})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top parts by value</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d?.topParts ?? []} layout="vertical" margin={{ left: 24, right: 16 }}>
                  <XAxis type="number" tickFormatter={compactInr} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="partNo" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#4f46e5" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer split</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={d?.customerSplit ?? []} dataKey="value" nameKey="customerCode" outerRadius={90}>
                    {(d?.customerSplit ?? []).map((_, i) => (
                      <Cell key={i} fill={CHART[i % CHART.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
                {(d?.customerSplit ?? []).map((c, i) => (
                  <span key={c.customerCode} className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: CHART[i % CHART.length] }} />
                    {c.customerCode}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 6px 24px -6px rgb(16 24 40 / 0.12)',
};
