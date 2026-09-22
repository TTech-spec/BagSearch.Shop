-- ─── seller_bank_details table ───────────────────────────────────────────────
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.seller_bank_details (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name                   text NOT NULL,
  bank_code                   text NOT NULL,
  account_number              text NOT NULL,
  account_name                text NOT NULL,
  flutterwave_subaccount_id   text,           -- set after Edge Function runs
  is_verified                 boolean NOT NULL DEFAULT false,
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  created_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_bank_details ENABLE ROW LEVEL SECURITY;

-- Sellers can only see and manage their own details
DROP POLICY IF EXISTS "Sellers can view own bank details"   ON public.seller_bank_details;
DROP POLICY IF EXISTS "Sellers can insert own bank details" ON public.seller_bank_details;
DROP POLICY IF EXISTS "Sellers can update own bank details" ON public.seller_bank_details;
DROP POLICY IF EXISTS "Sellers can delete own bank details" ON public.seller_bank_details;

CREATE POLICY "Sellers can view own bank details"
  ON public.seller_bank_details FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Sellers can insert own bank details"
  ON public.seller_bank_details FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own bank details"
  ON public.seller_bank_details FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can delete own bank details"
  ON public.seller_bank_details FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
