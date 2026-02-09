import { createAdminClient } from '@/lib/supabase/admin';
import { startOfMonth, differenceInMonths, format } from 'date-fns';

export async function computeCohortSnapshots(userId: string) {
  const supabase = createAdminClient();

  // Fetch customers with their first subscription date
  const { data: customers, error: custError } = await supabase
    .from('synced_customers')
    .select('stripe_customer_id, first_subscription_at, current_mrr_cents')
    .eq('user_id', userId)
    .not('first_subscription_at', 'is', null);

  if (custError || !customers || customers.length === 0) return;

  // Fetch all subscriptions
  const { data: subs, error: subError } = await supabase
    .from('synced_subscriptions')
    .select('stripe_customer_id, status, started_at, ended_at, plan_amount_cents, plan_interval, quantity')
    .eq('user_id', userId);

  if (subError || !subs) return;

  const now = startOfMonth(new Date());

  // Group customers by cohort month
  const cohorts = new Map<string, string[]>();
  for (const customer of customers) {
    const cohortMonth = format(
      startOfMonth(new Date(customer.first_subscription_at!)),
      'yyyy-MM-dd'
    );
    const existing = cohorts.get(cohortMonth) || [];
    existing.push(customer.stripe_customer_id);
    cohorts.set(cohortMonth, existing);
  }

  const snapshots = [];

  for (const [cohortMonthStr, customerIds] of cohorts) {
    const cohortMonth = new Date(cohortMonthStr);
    const maxMonths = differenceInMonths(now, cohortMonth);

    for (let monthOffset = 0; monthOffset <= Math.min(maxMonths, 24); monthOffset++) {
      const checkMonth = new Date(cohortMonth);
      checkMonth.setMonth(checkMonth.getMonth() + monthOffset);
      const checkMonthEnd = new Date(checkMonth);
      checkMonthEnd.setMonth(checkMonthEnd.getMonth() + 1);

      let retainedCount = 0;
      let cohortMrr = 0;

      for (const customerId of customerIds) {
        // Check if customer had an active subscription during this month
        const customerSubs = subs.filter(
          (s) => s.stripe_customer_id === customerId
        );

        const wasActive = customerSubs.some((sub) => {
          const startedAt = sub.started_at ? new Date(sub.started_at) : null;
          const endedAt = sub.ended_at ? new Date(sub.ended_at) : null;

          if (!startedAt || startedAt >= checkMonthEnd) return false;
          if (endedAt && endedAt <= checkMonth) return false;

          return true;
        });

        if (wasActive) {
          retainedCount++;
          // Calculate MRR for this customer in this month
          for (const sub of customerSubs) {
            const startedAt = sub.started_at ? new Date(sub.started_at) : null;
            const endedAt = sub.ended_at ? new Date(sub.ended_at) : null;

            if (!startedAt || startedAt >= checkMonthEnd) continue;
            if (endedAt && endedAt <= checkMonth) continue;

            const amount = (sub.plan_amount_cents || 0) * (sub.quantity || 1);
            cohortMrr += sub.plan_interval === 'year'
              ? Math.round(amount / 12)
              : amount;
          }
        }
      }

      snapshots.push({
        user_id: userId,
        cohort_month: cohortMonthStr,
        months_since_start: monthOffset,
        cohort_size: customerIds.length,
        retained_count: retainedCount,
        retention_rate: customerIds.length > 0
          ? Number((retainedCount / customerIds.length).toFixed(4))
          : 0,
        mrr_cents: cohortMrr,
        computed_at: new Date().toISOString(),
      });
    }
  }

  if (snapshots.length > 0) {
    const { error: upsertError } = await supabase
      .from('cohort_snapshots')
      .upsert(snapshots, {
        onConflict: 'user_id,cohort_month,months_since_start',
      });

    if (upsertError) {
      throw new Error(`Cohort snapshot upsert failed: ${upsertError.message}`);
    }
  }
}
