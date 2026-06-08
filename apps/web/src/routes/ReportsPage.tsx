import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getCustomerWise, getMonthWise } from '@/lib/reportsApi';
import { listCustomers } from '@/lib/partsApi';
import { compactInr, int, money } from '@/lib/format';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { EmptyRow, Table, Td, Th } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ExportButtons } from '@/components/ExportButtons';

const tooltipStyle = { borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 };

export function ReportsPage() {
  const [tab, setTab] = useState('customer');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [customerId, setCustomerId] = useState('');

  const customers = useQuery({ queryKey: ['customers'], queryFn: listCustomers });

  const customerWise = useQuery({
    queryKey: ['rpt-customer', from, to],
    queryFn: () => getCustomerWise({ from: from || undefined, to: to || undefined }),
    enabled: tab === 'customer',
  });
  const monthWise = useQuery({
    queryKey: ['rpt-month', from, to, customerId],
    queryFn: () => getMonthWise({ from: from || undefined, to: to || undefined, customerId: customerId || undefined }),
    enabled: tab === 'month',
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <PageHeader
          title="Reports"
          subtitle="Customer-wise and month-wise sales (R3)"
          actions={<ExportButtons view={tab === 'customer' ? 'customer-wise' : 'month-wise'} params={{ from, to, customerId: tab === 'month' ? customerId : undefined }} />}
        />

        <div className="mb-4">
          <Tabs
            tabs={[
              { key: 'customer', label: 'Customer-wise' },
              { key: 'month', label: 'Month-wise' },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {tab === 'month' && (
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">All customers</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </Select>
          )}
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>

        {tab === 'customer' ? (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Sales value by customer</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={customerWise.data ?? []} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis dataKey="customerCode" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={compactInr} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={56} />
                    <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#4f46e5" barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              {customerWise.isLoading ? (
                <TableSkeleton cols={5} />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Code</Th><Th>Customer</Th><Th className="text-right">Orders</Th><Th className="text-right">Qty</Th><Th className="text-right">Value</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerWise.data && customerWise.data.length ? (
                      customerWise.data.map((c) => (
                        <tr key={c.customerId} className="hover:bg-slate-50">
                          <Td className="font-medium">{c.customerCode}</Td>
                          <Td>{c.customerName}</Td>
                          <Td className="text-right">{int(c.orders)}</Td>
                          <Td className="text-right">{int(c.qty)}</Td>
                          <Td className="text-right font-medium">{money(c.value)}</Td>
                        </tr>
                      ))
                    ) : (
                      <EmptyRow cols={5}>No sales in this period.</EmptyRow>
                    )}
                  </tbody>
                </Table>
              )}
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Monthly sales value</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthWise.data ?? []} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={compactInr} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={56} />
                    <Tooltip formatter={(v: number) => money(v)} contentStyle={tooltipStyle} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#10b981" barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              {monthWise.isLoading ? (
                <TableSkeleton cols={4} />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Month</Th><Th className="text-right">Orders</Th><Th className="text-right">Qty</Th><Th className="text-right">Value</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthWise.data && monthWise.data.length ? (
                      monthWise.data.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-50">
                          <Td className="font-medium">{m.month}</Td>
                          <Td className="text-right">{int(m.orders)}</Td>
                          <Td className="text-right">{int(m.qty)}</Td>
                          <Td className="text-right font-medium">{money(m.value)}</Td>
                        </tr>
                      ))
                    ) : (
                      <EmptyRow cols={4}>No sales in this period.</EmptyRow>
                    )}
                  </tbody>
                </Table>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
