'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/charts/kpi-card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface ChurnTrend {
  month: string;
  customerChurnRate: number;
  revenueChurnRate: number;
}

interface ChurnData {
  currentMonth: {
    customerChurnRate: number;
    revenueChurnRate: number;
    netRevenueChurnRate: number;
    churnedCustomers: number;
    atRiskCustomers: number;
  };
  trend: ChurnTrend[];
}

export default function ChurnPage() {
  const [data, setData] = useState<ChurnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch MRR snapshots and compute churn from them client-side
    // (or create a dedicated churn API endpoint)
    fetch('/api/analytics/mrr')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
          return;
        }

        const snapshots = json.snapshots || [];
        if (snapshots.length === 0) return;

        const trend = snapshots.map((snap: {
          snapshot_date: string;
          active_customers: number;
          churned_customers: number;
          mrr_cents: number;
          churned_mrr_cents: number;
        }) => {
          const totalStart = snap.active_customers + snap.churned_customers;
          const mrrStart = snap.mrr_cents + snap.churned_mrr_cents;
          return {
            month: snap.snapshot_date,
            customerChurnRate:
              totalStart > 0
                ? Number(((snap.churned_customers / totalStart) * 100).toFixed(2))
                : 0,
            revenueChurnRate:
              mrrStart > 0
                ? Number(((snap.churned_mrr_cents / mrrStart) * 100).toFixed(2))
                : 0,
          };
        });

        const latest = snapshots[snapshots.length - 1];
        const totalStart = latest.active_customers + latest.churned_customers;
        const mrrStart = latest.mrr_cents + latest.churned_mrr_cents;

        setData({
          currentMonth: {
            customerChurnRate:
              totalStart > 0
                ? Number(((latest.churned_customers / totalStart) * 100).toFixed(2))
                : 0,
            revenueChurnRate:
              mrrStart > 0
                ? Number(((latest.churned_mrr_cents / mrrStart) * 100).toFixed(2))
                : 0,
            netRevenueChurnRate:
              mrrStart > 0
                ? Number(
                    (((latest.churned_mrr_cents - (latest.expansion_mrr_cents || 0)) / mrrStart) * 100).toFixed(2)
                  )
                : 0,
            churnedCustomers: latest.churned_customers || 0,
            atRiskCustomers: 0,
          },
          trend,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Churn Analysis</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Churn Analysis</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          {error || 'No churn data available yet.'}
        </div>
      </div>
    );
  }

  const chartData = data.trend.map((t) => ({
    ...t,
    date: format(new Date(t.month), 'MMM yyyy'),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Churn Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track customer and revenue churn over time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Customer Churn Rate"
          value={`${data.currentMonth.customerChurnRate}%`}
          subtitle="This month"
        />
        <KpiCard
          title="Revenue Churn Rate"
          value={`${data.currentMonth.revenueChurnRate}%`}
          subtitle="Gross revenue churn"
        />
        <KpiCard
          title="Net Revenue Churn"
          value={`${data.currentMonth.netRevenueChurnRate}%`}
          subtitle="After expansion"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Churn Rate Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="customerChurnRate"
                stroke="#EF4444"
                strokeWidth={2}
                name="Customer Churn"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="revenueChurnRate"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Revenue Churn"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
