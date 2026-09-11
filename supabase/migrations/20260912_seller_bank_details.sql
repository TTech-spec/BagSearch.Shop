-- ============================================================================
-- Seller Bank Details & Flutterwave Subaccounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  flutterwave_subaccount_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_bank_user ON seller_bank_details(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_subaccount ON seller_bank_details(flutterwave_subaccount_id);

-- RLS
ALTER TABLE seller_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY seller_bank_select ON seller_bank_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY seller_bank_insert ON seller_bank_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY seller_bank_update ON seller_bank_details
  FOR UPDATE USING (auth.uid() = user_id);
