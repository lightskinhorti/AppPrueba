-- Enable pgcrypto for API key encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.stripe_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_api_key_encrypted TEXT NOT NULL,
    stripe_account_name TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT DEFAULT 'pending'
        CHECK (last_sync_status IN ('pending','running','completed','failed')),
    last_sync_error TEXT,
    customer_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TRIGGER stripe_connections_updated_at
    BEFORE UPDATE ON public.stripe_connections
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
