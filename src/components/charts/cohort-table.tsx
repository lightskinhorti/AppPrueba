'use client';

import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

interface CohortSnapshot {
  cohort_month: string;
  months_since_start: number;
  cohort_size: number;
  retained_count: number;
  retention_rate: number;
}

interface CohortTableProps {
  data: CohortSnapshot[];
}

function getRetentionColor(rate: number): string {
  if (rate >= 0.9) return 'bg-green-600 text-white';
  if (rate >= 0.8) return 'bg-green-500 text-white';
  if (rate >= 0.7) return 'bg-green-400 text-white';
  if (rate >= 0.6) return 'bg-green-300 text-gray-800';
  if (rate >= 0.5) return 'bg-green-200 text-gray-800';
  if (rate >= 0.4) return 'bg-yellow-200 text-gray-800';
  if (rate >= 0.3) return 'bg-orange-200 text-gray-800';
  if (rate >= 0.2) return 'bg-red-200 text-gray-800';
  return 'bg-red-300 text-gray-800';
}

export function CohortTable({ data }: CohortTableProps) {
  // Group data by cohort month
  const cohorts = new Map<string, Map<number, CohortSnapshot>>();

  for (const snap of data) {
    if (!cohorts.has(snap.cohort_month)) {
      cohorts.set(snap.cohort_month, new Map());
    }
    cohorts.get(snap.cohort_month)!.set(snap.months_since_start, snap);
  }

  const cohortMonths = Array.from(cohorts.keys()).sort();
  const maxMonths = Math.max(
    ...data.map((d) => d.months_since_start),
    0
  );
  const monthHeaders = Array.from({ length: Math.min(maxMonths + 1, 13) }, (_, i) => i);

  if (cohortMonths.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        No cohort data available yet. Data will appear after your first sync.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 overflow-x-auto">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Cohort Retention</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Cohort</th>
            <th className="text-center py-2 px-3 text-gray-500 font-medium">Size</th>
            {monthHeaders.map((m) => (
              <th key={m} className="text-center py-2 px-2 text-gray-500 font-medium">
                M{m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohortMonths.map((month) => {
            const monthData = cohorts.get(month)!;
            const cohortSize = monthData.get(0)?.cohort_size || 0;

            return (
              <tr key={month} className="border-t border-gray-100">
                <td className="py-2 px-3 text-gray-700 font-medium whitespace-nowrap">
                  {format(new Date(month), 'MMM yyyy')}
                </td>
                <td className="py-2 px-3 text-center text-gray-600">{cohortSize}</td>
                {monthHeaders.map((m) => {
                  const snap = monthData.get(m);
                  if (!snap) {
                    return <td key={m} className="py-2 px-2" />;
                  }
                  return (
                    <td key={m} className="py-2 px-2">
                      <div
                        className={cn(
                          'text-center py-1 px-2 rounded text-xs font-medium',
                          getRetentionColor(snap.retention_rate)
                        )}
                      >
                        {(snap.retention_rate * 100).toFixed(0)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
