import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest MRR snapshot
    const { data: latestSnapshot } = await supabase
      .from('mrr_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    // Get previous month snapshot for comparison
    const { data: previousSnapshot } = await supabase
      .from('mrr_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .range(1, 1)
      .single();

    // Get at-risk customers count
    const { count: atRiskCount } = await supabase
      .from('synced_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('cancel_at_period_end', true);

    // Get total customer count
    const { count: totalCustomers } = await supabase
      .from('synced_customers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const mrr = latestSnapshot?.mrr_cents || 0;
    const prevMrr = previousSnapshot?.mrr_cents || 0;
    const activeCustomers = latestSnapshot?.active_customers || 0;
    const prevActiveCustomers = previousSnapshot?.active_customers || 0;
    const churnedCustomers = latestSnapshot?.churned_customers || 0;

    const customerChurnRate =
      activeCustomers + churnedCustomers > 0
        ? (churnedCustomers / (activeCustomers + churnedCustomers)) * 100
        : 0;

    const arpu = activeCustomers > 0 ? mrr / activeCustomers : 0;
    const clv =
      customerChurnRate > 0
        ? arpu / (customerChurnRate / 100)
        : 0;

    return NextResponse.json({
      mrr,
      arr: mrr * 12,
      mrrGrowth: prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : 0,
      activeCustomers,
      activeCustomersGrowth:
        prevActiveCustomers > 0
          ? ((activeCustomers - prevActiveCustomers) / prevActiveCustomers) * 100
          : 0,
      totalCustomers: totalCustomers || 0,
      customerChurnRate: Number(customerChurnRate.toFixed(2)),
      arpu: Math.round(arpu),
      clv: Math.round(clv),
      atRiskCustomers: atRiskCount || 0,
      newMrr: latestSnapshot?.new_mrr_cents || 0,
      expansionMrr: latestSnapshot?.expansion_mrr_cents || 0,
      churnedMrr: latestSnapshot?.churned_mrr_cents || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load overview';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
