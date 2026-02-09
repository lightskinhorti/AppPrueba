'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface MrrSnapshot {
  snapshot_date: string;
  mrr_cents: number;
  arr_cents: number;
  new_mrr_cents: number;
  expansion_mrr_cents: number;
  contraction_mrr_cents: number;
  churned_mrr_cents: number;
  active_customers: number;
}

interface MrrChartProps {
  data: MrrSnapshot[];
  mode?: 'mrr' | 'arr';
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function MrrChart({ data, mode = 'mrr' }: MrrChartProps) {
  const chartData = data.map((d) => ({
    date: format(new Date(d.snapshot_date), 'MMM yyyy'),
    value: mode === 'mrr' ? d.mrr_cents / 100 : d.arr_cents / 100,
    customers: d.active_customers,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        {mode === 'mrr' ? 'Monthly Recurring Revenue' : 'Annual Recurring Revenue'}
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(v) => `$${v.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value) * 100), mode.toUpperCase()]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#mrrGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
