'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TIER_LIMITS, type Tier } from '@/lib/utils/constants';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const plans: Array<{
  tier: Tier;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}> = [
  {
    tier: 'starter',
    name: 'Starter',
    price: 19,
    features: [
      'Up to 200 customers',
      'MRR / ARR dashboard',
      'Customer overview',
      'Revenue trend analysis',
    ],
  },
  {
    tier: 'growth',
    name: 'Growth',
    price: 49,
    popular: true,
    features: [
      'Up to 1,000 customers',
      'Everything in Starter',
      'Cohort retention analysis',
      'Churn rate tracking',
      'MRR movement breakdown',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 99,
    features: [
      'Up to 2,000 customers',
      'Everything in Growth',
      'Customer segmentation',
      'CSV data export',
      'Churn risk alerts',
      'Priority support',
    ],
  },
];

export default function BillingPage() {
  const [currentTier, setCurrentTier] = useState<Tier>('starter');
  const [status, setStatus] = useState('trialing');
  const [loading, setLoading] = useState<Tier | null>(null);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('subscription_tier, subscription_status')
      .single()
      .then(({ data }) => {
        if (data) {
          setCurrentTier(data.subscription_tier as Tier);
          setStatus(data.subscription_status);
        }
      });

    supabase
      .from('stripe_connections')
      .select('customer_count')
      .single()
      .then(({ data }) => {
        if (data) setCustomerCount(data.customer_count);
      });
  }, []);

  async function handleSubscribe(tier: Tier) {
    setLoading(tier);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  async function handleManageBilling() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  const limit = TIER_LIMITS[currentTier].customerLimit;
  const usagePercent = limit > 0 ? Math.min((customerCount / limit) * 100, 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Customer usage: {customerCount} / {limit}
          </span>
          <span className="text-sm text-gray-500">{usagePercent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              usagePercent > 90 ? 'bg-red-500' :
              usagePercent > 70 ? 'bg-yellow-500' :
              'bg-blue-500'
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Current plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} ({status})
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          return (
            <div
              key={plan.tier}
              className={cn(
                'bg-white rounded-lg border p-5 flex flex-col',
                plan.popular ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200',
                isCurrent && 'bg-blue-50'
              )}
            >
              {plan.popular && (
                <span className="self-start text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded mb-3">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button
                  onClick={handleManageBilling}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Manage Subscription
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loading !== null}
                  className={cn(
                    'w-full py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50',
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  )}
                >
                  {loading === plan.tier ? 'Loading...' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
