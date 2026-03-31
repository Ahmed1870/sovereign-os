-- ══════════════════════════════════════════════════════════════════
-- Sovereign OS - Migration 002: Stripe & Pro Features
-- Run AFTER 001_initial_schema.sql
-- ══════════════════════════════════════════════════════════════════

-- Add Stripe fields to user_profiles if not present
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS breaches_found INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platforms_exposed INTEGER DEFAULT 0;

-- Secure view for dashboard (no sensitive fields)
CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT
  up.user_id,
  up.full_name,
  up.subscription_tier,
  up.scan_count,
  up.breaches_found,
  up.platforms_exposed,
  up.deletion_requests_sent,
  up.security_score,
  up.last_scan_at,
  (SELECT COUNT(*) FROM public.alerts a WHERE a.user_id = up.user_id AND a.is_read = FALSE) AS unread_alerts,
  (SELECT COUNT(*) FROM public.deletion_requests dr WHERE dr.user_id = up.user_id AND dr.status = 'confirmed') AS confirmed_deletions
FROM public.user_profiles up;

-- RLS on view
ALTER VIEW public.dashboard_summary SET (security_invoker = true);

-- Function: update breach stats after scan
CREATE OR REPLACE FUNCTION update_scan_stats(
  p_user_id UUID,
  p_breaches INTEGER,
  p_platforms INTEGER,
  p_score INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles SET
    breaches_found = p_breaches,
    platforms_exposed = p_platforms,
    security_score = GREATEST(0, LEAST(100, p_score)),
    last_scan_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: mark alerts as read
CREATE OR REPLACE FUNCTION mark_alerts_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.alerts SET is_read = TRUE
  WHERE user_id = p_user_id AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get unread alert count (for nav badge)
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.alerts
  WHERE user_id = p_user_id AND is_read = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;
