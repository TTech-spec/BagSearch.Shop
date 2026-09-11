-- ============================================================================
-- Seller Subscriptions & Plan Enforcement
-- ============================================================================

-- ── Seller subscriptions table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  flutterwave_tx_ref TEXT,
  flutterwave_tx_id TEXT,
  amount NUMERIC(10, 2) DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_seller_subs_user ON seller_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_subs_status ON seller_subscriptions(status, expires_at);

-- ── Daily upload tracking table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('product', 'video')),
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for counting daily uploads per user
CREATE INDEX IF NOT EXISTS idx_daily_uploads_user_date
  ON daily_uploads(user_id, upload_type, upload_date);

-- ── Payment history table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'product_purchase')),
  plan TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  flutterwave_tx_ref TEXT NOT NULL,
  flutterwave_tx_id TEXT,
  flutterwave_status TEXT,
  product_id UUID,
  seller_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(flutterwave_tx_ref);

-- ── Helper function: get seller's current plan ──────────────────────────────
CREATE OR REPLACE FUNCTION get_seller_plan(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan
  FROM seller_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());

  RETURN COALESCE(v_plan, 'free');
END;
$$;

-- ── Helper function: check if user can upload today ─────────────────────────
CREATE OR REPLACE FUNCTION can_upload_today(p_user_id UUID, p_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_count INT;
  v_limit INT;
BEGIN
  v_plan := get_seller_plan(p_user_id);

  -- Count today's uploads of this type
  SELECT COUNT(*) INTO v_count
  FROM daily_uploads
  WHERE user_id = p_user_id
    AND upload_type = p_type
    AND upload_date = CURRENT_DATE;

  -- Set limits based on plan
  IF v_plan IN ('pro', 'premium') THEN
    v_limit := -1; -- unlimited
  ELSIF p_type = 'video' THEN
    v_limit := 1;  -- free: 1 video/day
  ELSE
    v_limit := 5;  -- free: 5 products total (not per day)
  END IF;

  -- For product listings on free plan, count total (not daily)
  IF v_plan = 'free' AND p_type = 'product' THEN
    SELECT COUNT(*) INTO v_count
    FROM products
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'allowed', (v_limit = -1 OR v_count < v_limit),
    'plan', v_plan,
    'used', v_count,
    'limit', v_limit
  );
END;
$$;

-- ── Record an upload ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_upload(p_user_id UUID, p_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_uploads (user_id, upload_type, upload_date)
  VALUES (p_user_id, p_type, CURRENT_DATE);
END;
$$;

-- ── RLS policies ────────────────────────────────────────────────────────────
ALTER TABLE seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY seller_subs_select ON seller_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own upload counts
CREATE POLICY daily_uploads_select ON daily_uploads
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own payments
CREATE POLICY payments_select ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Insert policies (service role handles most writes, but allow self-inserts for tracking)
CREATE POLICY daily_uploads_insert ON daily_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY payments_insert ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY seller_subs_insert ON seller_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY seller_subs_update ON seller_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
