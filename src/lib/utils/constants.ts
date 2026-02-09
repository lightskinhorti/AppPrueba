export const APP_NAME = 'ChurnLens';

export const TIER_LIMITS = {
  starter: {
    customerLimit: 200,
    features: ['overview', 'mrr', 'customers'] as const,
    label: 'Starter',
    price: 19,
  },
  growth: {
    customerLimit: 1000,
    features: ['overview', 'mrr', 'customers', 'cohorts', 'churn'] as const,
    label: 'Growth',
    price: 49,
  },
  pro: {
    customerLimit: 2000,
    features: ['overview', 'mrr', 'customers', 'cohorts', 'churn', 'segments', 'export', 'alerts'] as const,
    label: 'Pro',
    price: 99,
  },
} as const;

export type Tier = keyof typeof TIER_LIMITS;
export type Feature = (typeof TIER_LIMITS)[Tier]['features'][number];

export const STRIPE_EVENTS_TO_SYNC = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.payment_failed',
  'invoice.paid',
  'customer.created',
  'customer.deleted',
] as const;

export const SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
