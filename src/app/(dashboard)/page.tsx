'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/charts/kpi-card';

interface OverviewData {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  activeCustomers: number;
  activeCustomersGrowth: number;
  totalCustomers: number;
  customerChurnRate: number;
  arpu: number;
  clv: number;
  atRiskCustomers: number;
  newMrr: number;
  expansionMrr: number;
  churnedMrr: number;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function DashboardOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then((res) => res.json())
      .then((json) => {
        if (!json.error) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            No data yet. Connect your Stripe account to get started.
          </p>
          <a
            href="/dashboard/connect"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Connect Stripe
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="MRR"
          value={formatCurrency(data.mrr)}
          change={data.mrrGrowth}
          subtitle="Monthly Recurring Revenue"
        />
        <KpiCard
          title="ARR"
          value={formatCurrency(data.arr)}
          subtitle="Annual Recurring Revenue"
        />
        <KpiCard
          title="Active Customers"
          value={data.activeCustomers.toLocaleString()}
          change={data.activeCustomersGrowth}
        />
        <KpiCard
          title="Customer Churn Rate"
          value={`${data.customerChurnRate}%`}
          subtitle="Monthly"
        />
        <KpiCard
          title="ARPU"
          value={formatCurrency(data.arpu)}
          subtitle="Avg Revenue Per User"
        />
        <KpiCard
          title="Est. CLV"
          value={formatCurrency(data.clv)}
          subtitle="Customer Lifetime Value"
        />
        <KpiCard
          title="New MRR"
          value={formatCurrency(data.newMrr)}
          subtitle="This month"
        />
        <KpiCard
          title="At-Risk Customers"
          value={data.atRiskCustomers.toString()}
          subtitle="Cancel at period end"
        />
      </div>
    </div>
  );
}
