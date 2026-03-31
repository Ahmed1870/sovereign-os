-- ══════════════════════════════════════════════════════════════════════════
-- Sovereign OS - Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ══════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Subscription Tiers ─────────────────────────────────────────────────────
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE scan_type AS ENUM ('username', 'email', 'full', 'sim');
CREATE TYPE alert_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
CREATE TYPE request_status AS ENUM ('pending', 'sent', 'confirmed', 'failed');

-- ── User Profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    subscription_tier subscription_tier DEFAULT 'free',
    location_code   CHAR(2),                        -- ISO 3166-1 alpha-2
    scan_count      INTEGER DEFAULT 0,
    breaches_found  INTEGER DEFAULT 0,
    platforms_exposed INTEGER DEFAULT 0,
    deletion_requests_sent INTEGER DEFAULT 0,
    security_score  INTEGER DEFAULT 0 CHECK (security_score >= 0 AND security_score <= 100),
    last_scan_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Scan History ──────────────────────────────────────────────────────────
-- NOTE: We store hashes of targets, NEVER plaintext (Zero-Knowledge)
CREATE TABLE IF NOT EXISTS public.scan_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_type       scan_type NOT NULL,
    target_hash     TEXT NOT NULL,                  -- SHA-256 of target (email/username)
    results_count   INTEGER DEFAULT 0,
    platforms_found INTEGER DEFAULT 0,
    breaches_found  INTEGER DEFAULT 0,
    score_snapshot  INTEGER,                        -- Security score at time of scan
    completed_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Alerts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    severity        alert_severity DEFAULT 'info',
    source          TEXT,                           -- e.g., 'hibp', 'platform_scan'
    is_read         BOOLEAN DEFAULT FALSE,
    action_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── GDPR Deletion Requests ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_id       TEXT NOT NULL,
    broker_name     TEXT NOT NULL,
    status          request_status DEFAULT 'pending',
    sent_at         TIMESTAMPTZ,
    expected_completion TIMESTAMPTZ,
    confirmed_at    TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscription Records ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier            subscription_tier DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (Multi-tenant isolation)
-- Every user can ONLY access their own data
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "Users read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- scan_history policies
CREATE POLICY "Users read own scans"
    ON public.scan_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scans"
    ON public.scan_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- alerts policies
CREATE POLICY "Users read own alerts"
    ON public.alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own alerts"
    ON public.alerts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own alerts"
    ON public.alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- deletion_requests policies
CREATE POLICY "Users manage own deletion requests"
    ON public.deletion_requests FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- subscriptions policies
CREATE POLICY "Users read own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment scan count (called from API)
CREATE OR REPLACE FUNCTION increment_scan_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        scan_count = scan_count + 1,
        last_scan_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update security score
CREATE OR REPLACE FUNCTION update_security_score(p_user_id UUID, p_score INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET security_score = GREATEST(0, LEAST(100, p_score))
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get subscription tier for rate limiting
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS subscription_tier AS $$
DECLARE
    v_tier subscription_tier;
BEGIN
    SELECT subscription_tier INTO v_tier
    FROM public.user_profiles
    WHERE user_id = p_user_id;
    RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON public.scan_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON public.alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON public.deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.deletion_requests(status);

-- ══════════════════════════════════════════════════════════════════════════
-- SEED: Rate limit tiers reference
-- ══════════════════════════════════════════════════════════════════════════
-- Free tier: 10 scans/hour, 3 full scans/hour
-- Pro tier:  100 scans/hour, 30 full scans/hour
-- Enterprise: unlimited

COMMENT ON TABLE public.user_profiles IS 'Core user profile with subscription and security metrics';
COMMENT ON TABLE public.scan_history IS 'Zero-knowledge scan log - only hashes stored, no plaintext targets';
COMMENT ON TABLE public.alerts IS 'Security alerts generated from scans';
COMMENT ON TABLE public.deletion_requests IS 'GDPR/CCPA deletion request tracking';
