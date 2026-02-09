-- MRR snapshots: pre-computed monthly revenue data
CREATE TABLE public.mrr_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    mrr_cents INTEGER NOT NULL DEFAULT 0,
    arr_cents BIGINT GENERATED ALWAYS AS (mrr_cents * 12) STORED,
    new_mrr_cents INTEGER DEFAULT 0,
    expansion_mrr_cents INTEGER DEFAULT 0,
    contraction_mrr_cents INTEGER DEFAULT 0,
    churned_mrr_cents INTEGER DEFAULT 0,
    reactivation_mrr_cents INTEGER DEFAULT 0,
    active_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_mrr_snapshots_user_date ON mrr_snapshots(user_id, snapshot_date);

-- Cohort retention snapshots
CREATE TABLE public.cohort_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cohort_month DATE NOT NULL,
    months_since_start INTEGER NOT NULL,
    cohort_size INTEGER NOT NULL,
    retained_count INTEGER NOT NULL,
    retention_rate NUMERIC(5,4),
    mrr_cents INTEGER DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cohort_month, months_since_start)
);

CREATE INDEX idx_cohort_snapshots_user ON cohort_snapshots(user_id, cohort_month);
