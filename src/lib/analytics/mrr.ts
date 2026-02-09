import { createAdminClient } from '@/lib/supabase/admin';
import { startOfMonth, eachMonthOfInterval, format } from 'date-fns';

export async function computeMrrSnapshots(userId: string) {
  const supabase = createAdminClient();

  // Fetch all subscriptions for this user
  const { data: subs, error } = await supabase
    .from('synced_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subs || subs.length === 0) return;

  // Determine date range
  const startDates = subs
    .map((s) => s.started_at || s.current_period_start)
    .filter(Boolean)
    .map((d) => new Date(d!));

  if (startDates.length === 0) return;

  const earliest = startOfMonth(new Date(Math.min(...startDates.map((d) => d.getTime()))));
  const latest = startOfMonth(new Date());

  const months = eachMonthOfInterval({ start: earliest, end: latest });

  const snapshots = [];

  let prevActiveCustomers = new Set<string>();
  let prevMrrByCustomer = new Map<string, number>();

  for (const month of months) {
    const monthEnd = new Date(month);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    let totalMrr = 0;
    let newMrr = 0;
    let expansionMrr = 0;
    let contractionMrr = 0;
    let churnedMrr = 0;
    let reactivationMrr = 0;
    const activeCustomers = new Set<string>();
    const newCustomers = new Set<string>();
    const churnedCustomers = new Set<string>();
    const currentMrrByCustomer = new Map<string, number>();

    for (const sub of subs) {
      const startedAt = sub.started_at ? new Date(sub.started_at) : null;
      const endedAt = sub.ended_at ? new Date(sub.ended_at) : null;

      // Check if subscription was active during this month
      if (!startedAt || startedAt >= monthEnd) continue;
      if (endedAt && endedAt <= month) continue;

      // Skip non-contributing statuses
      if (sub.status === 'incomplete' || sub.status === 'incomplete_expired') continue;

      const amount = (sub.plan_amount_cents || 0) * (sub.quantity || 1);
      const mrr = sub.plan_interval === 'year' ? Math.round(amount / 12) : amount;

      const customerId = sub.stripe_customer_id;
      activeCustomers.add(customerId);
      currentMrrByCustomer.set(
        customerId,
        (currentMrrByCustomer.get(customerId) || 0) + mrr
      );
      totalMrr += mrr;

      // New customer (first subscription started this month)
      if (startedAt && startedAt >= month && startedAt < monthEnd) {
        if (!prevActiveCustomers.has(customerId)) {
          newCustomers.add(customerId);
          newMrr += mrr;
        }
      }
    }

    // Calculate expansion, contraction, churn, reactivation
    for (const [customerId, currentMrr] of currentMrrByCustomer) {
      const prevMrr = prevMrrByCustomer.get(customerId) || 0;

      if (prevActiveCustomers.has(customerId) && !newCustomers.has(customerId)) {
        const diff = currentMrr - prevMrr;
        if (diff > 0) expansionMrr += diff;
        if (diff < 0) contractionMrr += Math.abs(diff);
      } else if (!prevActiveCustomers.has(customerId) && !newCustomers.has(customerId)) {
        // Reactivation
        reactivationMrr += currentMrr;
      }
    }

    // Churned customers
    for (const customerId of prevActiveCustomers) {
      if (!activeCustomers.has(customerId)) {
        churnedCustomers.add(customerId);
        churnedMrr += prevMrrByCustomer.get(customerId) || 0;
      }
    }

    snapshots.push({
      user_id: userId,
      snapshot_date: format(month, 'yyyy-MM-dd'),
      mrr_cents: totalMrr,
      new_mrr_cents: newMrr,
      expansion_mrr_cents: expansionMrr,
      contraction_mrr_cents: contractionMrr,
      churned_mrr_cents: churnedMrr,
      reactivation_mrr_cents: reactivationMrr,
      active_customers: activeCustomers.size,
      new_customers: newCustomers.size,
      churned_customers: churnedCustomers.size,
      computed_at: new Date().toISOString(),
    });

    prevActiveCustomers = activeCustomers;
    prevMrrByCustomer = currentMrrByCustomer;
  }

  // Upsert snapshots
  if (snapshots.length > 0) {
    const { error: upsertError } = await supabase
      .from('mrr_snapshots')
      .upsert(snapshots, { onConflict: 'user_id,snapshot_date' });

    if (upsertError) {
      throw new Error(`MRR snapshot upsert failed: ${upsertError.message}`);
    }
  }
}
