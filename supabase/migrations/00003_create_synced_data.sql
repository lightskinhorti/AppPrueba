-- Synced customers from user's Stripe account
CREATE TABLE public.synced_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    created_at_stripe TIMESTAMPTZ NOT NULL,
    currency TEXT DEFAULT 'usd',
    metadata JSONB DEFAULT '{}',
    current_mrr_cents INTEGER DEFAULT 0,
    subscription_status TEXT,
    first_subscription_at TIMESTAMPTZ,
    churned_at TIMESTAMPTZ,
    lifetime_value_cents INTEGER DEFAULT 0,
    plan_name TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stripe_customer_id)
);

CREATE INDEX idx_synced_customers_user ON synced_customers(user_id);
CREATE INDEX idx_synced_customers_status ON synced_customers(user_id, subscription_status);
CREATE INDEX idx_synced_customers_created ON synced_customers(user_id, created_at_stripe);

-- Synced subscriptions from user's Stripe account
CREATE TABLE public.synced_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    plan_id TEXT,
    plan_name TEXT,
    plan_amount_cents INTEGER,
    plan_interval TEXT,
    plan_currency TEXT DEFAULT 'usd',
    quantity INTEGER DEFAULT 1,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stripe_subscription_id)
);

CREATE INDEX idx_synced_subs_user ON synced_subscriptions(user_id);
CREATE INDEX idx_synced_subs_customer ON synced_subscriptions(user_id, stripe_customer_id);
CREATE INDEX idx_synced_subs_status ON synced_subscriptions(user_id, status);

-- Synced events from user's Stripe account
CREATE TABLE public.synced_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    stripe_customer_id TEXT,
    event_data JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, stripe_event_id)
);

CREATE INDEX idx_synced_events_user_type ON synced_events(user_id, event_type);
CREATE INDEX idx_synced_events_user_date ON synced_events(user_id, occurred_at);
