import type { Tier } from '@/lib/utils/constants';

export const PLAN_PRICE_IDS: Record<Tier, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
};

export function getTierFromPriceId(priceId: string): Tier {
  for (const [tier, id] of Object.entries(PLAN_PRICE_IDS)) {
    if (id === priceId) return tier as Tier;
  }
  return 'starter';
}

export function getCustomerLimitForTier(tier: Tier): number {
  const limits: Record<Tier, number> = {
    starter: 200,
    growth: 1000,
    pro: 2000,
  };
  return limits[tier];
}
