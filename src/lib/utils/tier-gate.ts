import { TIER_LIMITS, type Tier, type Feature } from './constants';

export function hasFeature(tier: Tier, feature: Feature): boolean {
  const allowed = TIER_LIMITS[tier]?.features as readonly string[];
  return allowed?.includes(feature) ?? false;
}

export function getCustomerLimit(tier: Tier): number {
  return TIER_LIMITS[tier]?.customerLimit ?? 200;
}

export function isWithinLimit(tier: Tier, customerCount: number): boolean {
  return customerCount <= getCustomerLimit(tier);
}
