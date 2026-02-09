import type Stripe from 'stripe';

export function transformCustomer(
  userId: string,
  customer: Stripe.Customer
) {
  return {
    user_id: userId,
    stripe_customer_id: customer.id,
    email: customer.email || null,
    name: customer.name || null,
    created_at_stripe: new Date(customer.created * 1000).toISOString(),
    currency: customer.currency || 'usd',
    metadata: customer.metadata || {},
    synced_at: new Date().toISOString(),
  };
}

export function transformSubscription(
  userId: string,
  sub: Stripe.Subscription
) {
  const item = sub.items.data[0];
  const price = item?.price;
  const product = price?.product;

  return {
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id:
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    status: sub.status,
    plan_id: price?.id || null,
    plan_name:
      typeof product === 'object' && product !== null && 'name' in product
        ? (product as { name: string }).name
        : typeof product === 'string'
          ? product
          : null,
    plan_amount_cents: price?.unit_amount || 0,
    plan_interval: price?.recurring?.interval || 'month',
    plan_currency: price?.currency || 'usd',
    quantity: item?.quantity || 1,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString()
      : null,
    ended_at: sub.ended_at
      ? new Date(sub.ended_at * 1000).toISOString()
      : null,
    trial_start: sub.trial_start
      ? new Date(sub.trial_start * 1000).toISOString()
      : null,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
    started_at: sub.start_date
      ? new Date(sub.start_date * 1000).toISOString()
      : null,
    metadata: sub.metadata || {},
    synced_at: new Date().toISOString(),
  };
}

export function transformEvent(
  userId: string,
  event: Stripe.Event
) {
  const data = event.data.object as unknown as Record<string, unknown>;
  return {
    user_id: userId,
    stripe_event_id: event.id,
    event_type: event.type,
    stripe_customer_id:
      (data.customer as string) || (data.id as string) || null,
    event_data: data,
    occurred_at: new Date(event.created * 1000).toISOString(),
    synced_at: new Date().toISOString(),
  };
}
