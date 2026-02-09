import type Stripe from 'stripe';
import { createUserStripeClient } from '@/lib/stripe/user-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { RateLimiter } from './rate-limiter';
import { transformCustomer, transformSubscription, transformEvent } from './transforms';
import { STRIPE_EVENTS_TO_SYNC } from '@/lib/utils/constants';

const rateLimiter = new RateLimiter(4);

interface SyncResult {
  customers: number;
  subscriptions: number;
  events: number;
  error?: string;
}

export async function syncStripeData(
  userId: string,
  apiKey: string,
  fullSync: boolean = false,
  lastSyncAt?: string | null
): Promise<SyncResult> {
  const stripe = createUserStripeClient(apiKey);
  const supabase = createAdminClient();
  const result: SyncResult = { customers: 0, subscriptions: 0, events: 0 };

  // Update sync status to running
  await supabase
    .from('stripe_connections')
    .update({ last_sync_status: 'running', last_sync_error: null })
    .eq('user_id', userId);

  try {
    // Sync customers
    const customerParams: Stripe.CustomerListParams = { limit: 100 };
    if (!fullSync && lastSyncAt) {
      customerParams.created = { gte: Math.floor(new Date(lastSyncAt).getTime() / 1000) };
    }

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      await rateLimiter.throttle();
      const params: Stripe.CustomerListParams = { ...customerParams };
      if (startingAfter) params.starting_after = startingAfter;

      const customers = await stripe.customers.list(params);

      if (customers.data.length > 0) {
        const rows = customers.data
          .filter((c): c is Stripe.Customer => !c.deleted)
          .map((c) => transformCustomer(userId, c));

        if (rows.length > 0) {
          const { error } = await supabase
            .from('synced_customers')
            .upsert(rows, { onConflict: 'user_id,stripe_customer_id' });

          if (error) throw new Error(`Customer upsert failed: ${error.message}`);
          result.customers += rows.length;
        }

        startingAfter = customers.data[customers.data.length - 1].id;
      }

      hasMore = customers.has_more;
    }

    // Sync subscriptions
    const subParams: Stripe.SubscriptionListParams = {
      limit: 100,
      status: 'all',
      expand: ['data.items.data.price.product'],
    };

    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      await rateLimiter.throttle();
      const params: Stripe.SubscriptionListParams = { ...subParams };
      if (startingAfter) params.starting_after = startingAfter;

      const subscriptions = await stripe.subscriptions.list(params);

      if (subscriptions.data.length > 0) {
        const rows = subscriptions.data.map((s) =>
          transformSubscription(userId, s)
        );

        const { error } = await supabase
          .from('synced_subscriptions')
          .upsert(rows, { onConflict: 'user_id,stripe_subscription_id' });

        if (error) throw new Error(`Subscription upsert failed: ${error.message}`);
        result.subscriptions += rows.length;

        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }

      hasMore = subscriptions.has_more;
    }

    // Sync events
    const eventParams: Stripe.EventListParams = {
      limit: 100,
      types: STRIPE_EVENTS_TO_SYNC as unknown as Stripe.EventListParams['types'],
    };
    if (!fullSync && lastSyncAt) {
      eventParams.created = { gte: Math.floor(new Date(lastSyncAt).getTime() / 1000) };
    }

    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      await rateLimiter.throttle();
      const params: Stripe.EventListParams = { ...eventParams };
      if (startingAfter) params.starting_after = startingAfter;

      const events = await stripe.events.list(params);

      if (events.data.length > 0) {
        const rows = events.data.map((e) => transformEvent(userId, e));

        const { error } = await supabase
          .from('synced_events')
          .upsert(rows, { onConflict: 'user_id,stripe_event_id' });

        if (error) throw new Error(`Event upsert failed: ${error.message}`);
        result.events += rows.length;

        startingAfter = events.data[events.data.length - 1].id;
      }

      hasMore = events.has_more;
    }

    // Update customer computed fields from subscription data
    await updateCustomerComputedFields(supabase, userId);

    // Update sync status
    await supabase
      .from('stripe_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'completed',
        customer_count: result.customers,
        last_sync_error: null,
      })
      .eq('user_id', userId);

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
    await supabase
      .from('stripe_connections')
      .update({
        last_sync_status: 'failed',
        last_sync_error: errorMsg,
      })
      .eq('user_id', userId);

    return { ...result, error: errorMsg };
  }
}

async function updateCustomerComputedFields(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
) {
  // Get active subscriptions grouped by customer
  const { data: subs } = await supabase
    .from('synced_subscriptions')
    .select('stripe_customer_id, status, plan_amount_cents, plan_interval, plan_name, quantity, started_at, ended_at, canceled_at')
    .eq('user_id', userId);

  if (!subs) return;

  const customerMap = new Map<string, {
    currentMrr: number;
    status: string;
    firstSubAt: string | null;
    churnedAt: string | null;
    ltv: number;
    planName: string | null;
  }>();

  for (const sub of subs) {
    const existing = customerMap.get(sub.stripe_customer_id) || {
      currentMrr: 0,
      status: 'canceled',
      firstSubAt: null,
      churnedAt: null,
      ltv: 0,
      planName: null,
    };

    // Calculate MRR contribution
    let mrrContribution = 0;
    if (sub.status === 'active' || sub.status === 'trialing') {
      const amount = (sub.plan_amount_cents || 0) * (sub.quantity || 1);
      mrrContribution = sub.plan_interval === 'year' ? Math.round(amount / 12) : amount;
      existing.status = sub.status;
      existing.planName = sub.plan_name;
      existing.churnedAt = null;
    }

    existing.currentMrr += mrrContribution;

    // Track earliest subscription
    if (sub.started_at) {
      if (!existing.firstSubAt || sub.started_at < existing.firstSubAt) {
        existing.firstSubAt = sub.started_at;
      }
    }

    // Track churn (only if all subs are canceled)
    if (sub.status === 'canceled' && sub.ended_at && existing.status !== 'active' && existing.status !== 'trialing') {
      if (!existing.churnedAt || sub.ended_at > existing.churnedAt) {
        existing.churnedAt = sub.ended_at;
      }
    }

    // Accumulate LTV (simplified: sum of all plan amounts)
    existing.ltv += (sub.plan_amount_cents || 0) * (sub.quantity || 1);

    customerMap.set(sub.stripe_customer_id, existing);
  }

  // Batch update customers
  for (const [customerId, data] of customerMap) {
    await supabase
      .from('synced_customers')
      .update({
        current_mrr_cents: data.currentMrr,
        subscription_status: data.status,
        first_subscription_at: data.firstSubAt,
        churned_at: data.churnedAt,
        lifetime_value_cents: data.ltv,
        plan_name: data.planName,
      })
      .eq('user_id', userId)
      .eq('stripe_customer_id', customerId);
  }
}
