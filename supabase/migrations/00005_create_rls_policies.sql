-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrr_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Stripe connections
CREATE POLICY "Users manage own stripe connections"
    ON public.stripe_connections FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Synced data: read-only for authenticated users (writes via service role)
CREATE POLICY "Users view own synced customers"
    ON public.synced_customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own synced subscriptions"
    ON public.synced_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own synced events"
    ON public.synced_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own mrr snapshots"
    ON public.mrr_snapshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users view own cohort snapshots"
    ON public.cohort_snapshots FOR SELECT
    USING (auth.uid() = user_id);
