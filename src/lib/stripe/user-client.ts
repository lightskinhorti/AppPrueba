import Stripe from 'stripe';

export function createUserStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  });
}
