-- Report a seller: lets a logged-in buyer flag a seller's profile for
-- illegal/fraudulent activity, misinformation, scams, violent content, or a
-- privacy violation, with optional free-text details.
--
-- There's no in-app admin panel — review submitted reports in the Supabase
-- Table Editor (public.seller_reports) the same way NIN verifications are
-- reviewed (see add_seller_verification.sql).
--
-- Run this once in the Supabase SQL editor before deploying the app changes
-- that depend on it.

CREATE TABLE IF NOT EXISTS public.seller_reports (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('illegal', 'misinformation', 'scams', 'violent', 'privacy')),
  details     text,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seller_reports_seller_id_idx ON public.seller_reports (seller_id);

ALTER TABLE public.seller_reports ENABLE ROW LEVEL SECURITY;

-- A buyer can report a seller once — resubmitting just updates the existing
-- report's reason/details rather than creating duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS seller_reports_seller_reporter_unique
  ON public.seller_reports (seller_id, reporter_id);

DROP POLICY IF EXISTS "Buyers can submit a report" ON public.seller_reports;
CREATE POLICY "Buyers can submit a report"
  ON public.seller_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND auth.uid() <> seller_id);

DROP POLICY IF EXISTS "Buyers can update their own report" ON public.seller_reports;
CREATE POLICY "Buyers can update their own report"
  ON public.seller_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = reporter_id)
  WITH CHECK (auth.uid() = reporter_id);

-- Reports are only visible to the reporter themselves (so the UI can show
-- "you've already reported this seller") — nobody else, including the
-- reported seller, can read them. Full moderation view is the Table Editor
-- with the service role.
DROP POLICY IF EXISTS "Reporters can view their own reports" ON public.seller_reports;
CREATE POLICY "Reporters can view their own reports"
  ON public.seller_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- ─── How to review a report ──────────────────────────────────────────────────
-- 1. Supabase Studio → Table Editor → seller_reports → sort by created_at.
-- 2. Cross-check the seller_id against public.users and their listings.
-- 3. Take action (warn/suspend the seller manually), then set status to
--    'reviewed' or 'dismissed'.
