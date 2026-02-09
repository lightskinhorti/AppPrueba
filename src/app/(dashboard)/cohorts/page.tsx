'use client';

import { useEffect, useState } from 'react';
import { CohortTable } from '@/components/charts/cohort-table';

interface CohortSnapshot {
  cohort_month: string;
  months_since_start: number;
  cohort_size: number;
  retained_count: number;
  retention_rate: number;
}

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<CohortSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics/cohorts')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else if (json.cohorts) {
          setCohorts(json.cohorts);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cohort Retention</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-5 h-96 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-72 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cohort Retention</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">{error}</p>
          <a
            href="/dashboard/billing"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cohort Retention</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track how well each monthly cohort retains over time. Green = high retention, Red = low.
        </p>
      </div>

      <CohortTable data={cohorts} />
    </div>
  );
}
