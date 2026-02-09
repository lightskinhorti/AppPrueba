'use client';

import { useEffect, useState } from 'react';
import { MrrChart } from '@/components/charts/mrr-chart';
import { MrrMovementChart } from '@/components/charts/mrr-movement-chart';

interface MrrSnapshot {
  snapshot_date: string;
  mrr_cents: number;
  arr_cents: number;
  new_mrr_cents: number;
  expansion_mrr_cents: number;
  contraction_mrr_cents: number;
  churned_mrr_cents: number;
  reactivation_mrr_cents: number;
  active_customers: number;
}

export default function MrrPage() {
  const [snapshots, setSnapshots] = useState<MrrSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'mrr' | 'arr'>('mrr');

  useEffect(() => {
    fetch('/api/analytics/mrr')
      .then((res) => res.json())
      .then((json) => {
        if (json.snapshots) setSnapshots(json.snapshots);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-5 h-96 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-72 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          No revenue data available. Connect your Stripe account and sync data first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('mrr')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              mode === 'mrr'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            MRR
          </button>
          <button
            onClick={() => setMode('arr')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              mode === 'arr'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ARR
          </button>
        </div>
      </div>

      <MrrChart data={snapshots} mode={mode} />
      <MrrMovementChart data={snapshots} />
    </div>
  );
}
