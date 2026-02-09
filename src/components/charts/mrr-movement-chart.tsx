'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface MrrSnapshot {
  snapshot_date: string;
  new_mrr_cents: number;
  expansion_mrr_cents: number;
  contraction_mrr_cents: number;
  churned_mrr_cents: number;
  reactivation_mrr_cents: number;
}

interface MrrMovementChartProps {
  data: MrrSnapshot[];
}

export function MrrMovementChart({ data }: MrrMovementChartProps) {
  const chartData = data.map((d) => ({
    date: format(new Date(d.snapshot_date), 'MMM yyyy'),
    'New': d.new_mrr_cents / 100,
    'Expansion': d.expansion_mrr_cents / 100,
    'Reactivation': d.reactivation_mrr_cents / 100,
    'Contraction': -(d.contraction_mrr_cents / 100),
    'Churned': -(d.churned_mrr_cents / 100),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">MRR Movement</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(v) => `$${Math.abs(v).toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => [
                `$${Math.abs(Number(value)).toLocaleString()}`,
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <Legend />
            <Bar dataKey="New" stackId="positive" fill="#22C55E" />
            <Bar dataKey="Expansion" stackId="positive" fill="#3B82F6" />
            <Bar dataKey="Reactivation" stackId="positive" fill="#A855F7" />
            <Bar dataKey="Contraction" stackId="negative" fill="#F59E0B" />
            <Bar dataKey="Churned" stackId="negative" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
