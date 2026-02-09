import { createAdminClient } from '@/lib/supabase/admin';

export interface ChurnMetrics {
  currentMonth: {
    customerChurnRate: number;
    revenueChurnRate: number;
    netRevenueChurnRate: number;
    churnedCustomers: number;
    atRiskCustomers: number;
  };
  trend: Array<{
    month: string;
    customerChurnRate: number;
    revenueChurnRate: number;
  }>;
}

export async function getChurnMetrics(userId: string): Promise<ChurnMetrics> {
  const supabase = createAdminClient();

  // Get MRR snapshots for churn rate calculation
  const { data: snapshots } = await supabase
    .from('mrr_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: true });

  // Get at-risk customers (cancel_at_period_end = true)
  const { count: atRiskCount } = await supabase
    .from('synced_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('cancel_at_period_end', true);

  const trend = (snapshots || []).map((snap) => {
    const customerChurnRate =
      snap.active_customers > 0
        ? snap.churned_customers / (snap.active_customers + snap.churned_customers)
        : 0;
    const revenueChurnRate =
      snap.mrr_cents > 0
        ? snap.churned_mrr_cents / (snap.mrr_cents + snap.churned_mrr_cents)
        : 0;

    return {
      month: snap.snapshot_date,
      customerChurnRate: Number((customerChurnRate * 100).toFixed(2)),
      revenueChurnRate: Number((revenueChurnRate * 100).toFixed(2)),
    };
  });

  const latest = snapshots?.[snapshots.length - 1];
  const customerChurnRate = latest && latest.active_customers > 0
    ? (latest.churned_customers / (latest.active_customers + latest.churned_customers)) * 100
    : 0;
  const revenueChurnRate = latest && latest.mrr_cents > 0
    ? (latest.churned_mrr_cents / (latest.mrr_cents + latest.churned_mrr_cents)) * 100
    : 0;
  const netRevenueChurnRate = latest && latest.mrr_cents > 0
    ? ((latest.churned_mrr_cents - latest.expansion_mrr_cents) /
        (latest.mrr_cents + latest.churned_mrr_cents)) *
      100
    : 0;

  return {
    currentMonth: {
      customerChurnRate: Number(customerChurnRate.toFixed(2)),
      revenueChurnRate: Number(revenueChurnRate.toFixed(2)),
      netRevenueChurnRate: Number(netRevenueChurnRate.toFixed(2)),
      churnedCustomers: latest?.churned_customers || 0,
      atRiskCustomers: atRiskCount || 0,
    },
    trend,
  };
}
